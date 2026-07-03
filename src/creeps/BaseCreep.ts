import { Guild } from '../core/Guild';
import { computeTags, computeCapacities } from '../core/tagSystem';
import { getBehavior } from '../behavior/index';

const ROLE_PREFS: Record<string, string[]> = {
  miner: ['harvest'],
  harvester: ['collect', 'harvest', 'withdraw', 'fill', 'upgrade'],
  builder: ['build', 'collect', 'withdraw', 'fill', 'harvest', 'upgrade'],
  upgrader: ['upgrade', 'collect', 'withdraw', 'fill', 'harvest'],
  remoteMiner: ['harvest'],
  remoteHauler: ['collect', 'fill'],
};

// ─── Event sorting ───

export type EventComparator = (a: Event, b: Event, creep: Creep) => number;

/** Chain multiple comparators: returns on first non-zero result. */
export function sortEvents(events: Event[], creep: Creep, comparators: EventComparator[]): Event[] {
  return events.sort((a, b) => {
    for (const cmp of comparators) {
      const r = cmp(a, b, creep);
      if (r !== 0) return r;
    }
    return 0;
  });
}

/** Sort by role preference order (event type priority). */
export function byType(prefs: string[]): EventComparator {
  return (a, b) => {
    const ai = prefs.indexOf(a.type);
    const bi = prefs.indexOf(b.type);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  };
}

/** Sort by Manhattan distance from creep (nearest first). Uses data.pos. */
export function byDistance(): EventComparator {
  return (a, b, creep) => {
    const pa = a.data?.pos as { x: number; y: number; roomName: string } | undefined;
    const pb = b.data?.pos as { x: number; y: number; roomName: string } | undefined;
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    if (pa.roomName !== creep.room.name || pb.roomName !== creep.room.name) return 0;
    const da = Math.abs(pa.x - creep.pos.x) + Math.abs(pa.y - creep.pos.y);
    const db = Math.abs(pb.x - creep.pos.x) + Math.abs(pb.y - creep.pos.y);
    return da - db;
  };
}

/** Sort by event priority (highest first). */
export function byPriority(): EventComparator {
  return (a, b) => b.priority - a.priority;
}

// ─── BaseCreep ───

export abstract class BaseCreep {
  protected creep: Creep;

  constructor(creep: Creep) {
    this.creep = creep;
  }

  /** Refresh the Creep reference for the new tick (Screeps recreates Game.creeps each tick). */
  refreshCreep(creep: Creep): void {
    this.creep = creep;
  }

  // Each role implements its own run()
  abstract run(): void;

  // ─── Utilities ───

  protected hasEnergy(): boolean {
    return this.creep.store[RESOURCE_ENERGY] > 0;
  }

  protected isFull(): boolean {
    return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
  }

  protected isEmpty(): boolean {
    return this.creep.store[RESOURCE_ENERGY] === 0;
  }

  /** Count living creeps of a given role. */
  protected countRole(role: string): number {
    let count = 0;
    for (const name in Game.creeps) {
      if (Memory.creeps[name]?.role === role) count++;
    }
    return count;
  }

  // ─── Query events sorted by role preference + distance ───

  protected queryEvents(): Event[] {
    const tags = computeTags(this.creep.body);
    const caps = computeCapacities(this.creep.body);
    const events = Guild.query(tags, caps, this.creep.room.name);
    const prefs = ROLE_PREFS[this.creep.memory.role || ''] || [];
    return sortEvents(events, this.creep, [byType(prefs), byDistance()]);
  }

  // ─── Atomic: current event ───

  protected getCurrentEvent(): Event | undefined {
    const id = this.creep.memory.currentEventId;
    if (!id) return undefined;
    return Guild.findById(id);
  }

  /** Event no longer exists, or creep is no longer a valid claimer. */
  protected isEventGone(event: Event): boolean {
    return (
      !event ||
      event.status === 'completed' ||
      event.status === 'expired' ||
      !event.claimerIds.includes(this.creep.name)
    );
  }

  /** Drop currentEventId — event is already gone from Guild, just forget it. */
  protected dropEvent(): void {
    delete this.creep.memory.currentEventId;
  }

  // ─── Atomic: behavior operations ───

  protected validateBehavior(event: Event): boolean {
    const behavior = getBehavior(event.type);
    if (!behavior) return false;
    return behavior.validate(this.creep, event);
  }

  protected executeBehavior(event: Event): void {
    const behavior = getBehavior(event.type);
    if (!behavior) return;
    behavior.execute(this.creep, event);
  }

  protected isBehaviorComplete(event: Event): boolean {
    const behavior = getBehavior(event.type);
    if (!behavior) return true;
    return behavior.isComplete(this.creep, event);
  }

  // ─── Atomic: event lifecycle ───

  /** Validation failed — complete if target gone or objective already achieved, otherwise release. */
  protected resolveInvalidEvent(event: Event): void {
    const targetGone = event.data?.targetId && !Game.getObjectById(event.data.targetId);
    const alreadyDone = this.isBehaviorComplete(event);
    if (targetGone || alreadyDone) {
      console.log(`${this.creep.pos} ${this.creep.name} clear ${event.id}`);
      Guild.complete(event.id);
    } else {
      Guild.release(event.id, this.creep.name);
    }
    delete this.creep.memory.currentEventId;
  }

  protected completeEvent(event: Event): void {
    console.log(
      `[${this.creep.room}:${this.creep.pos.x},${this.creep.pos.y}]: ${this.creep.name} complete ${event.id}`
    );
    Guild.complete(event.id);
    delete this.creep.memory.currentEventId;
  }

  // ─── Task acquisition ───

  /** Compute how much quota this creep can reserve for the event. */
  private computeReserve(event: Event): number {
    if (!event.data?.quota) return 0;
    const rtype = (event.data.quota as EventQuota).resourceType;
    switch (event.type) {
      case 'fill':
      case 'build':
      case 'repair':
        // Creep gives resource to target
        return this.creep.store[rtype] || 0;
      case 'harvest':
      case 'collect':
        // Creep takes resource from target
        return this.creep.store.getFreeCapacity(rtype) ?? 0;
      default:
        return 0;
    }
  }

  /** Query, find first matching type, and claim. Returns true if claimed. */
  protected claimEvent(types: string[]): boolean {
    const events = this.queryEvents();
    for (const t of types) {
      const evt = events.find((e) => e.type === t);
      if (evt) {
        const amount = this.computeReserve(evt);
        const ok = Guild.claim(evt.id, this.creep.name, amount);
        if (ok) {
          this.creep.memory.currentEventId = evt.id;
        }
        return ok;
      }
    }
    return false;
  }

  /** Fallback: try to claim any valid event. */
  protected claimFallback(): boolean {
    const events = this.queryEvents();
    for (const e of events) {
      const b = getBehavior(e.type);
      if (b && b.validate(this.creep, e)) {
        const amount = this.computeReserve(e);
        const ok = Guild.claim(e.id, this.creep.name, amount);
        if (ok) {
          this.creep.memory.currentEventId = e.id;
          return true;
        }
      }
    }
    return false;
  }

  protected repairOrBuildNearby(): void {
    if (!this.hasEnergy()) return;

    const damaged = this.creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER),
    });
    if (damaged) {
      if (this.creep.repair(damaged) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(damaged, { reusePath: 30 });
      }
      return;
    }

    const site = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (site) {
      if (this.creep.build(site) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(site, { reusePath: 30 });
      }
    }
  }
}
