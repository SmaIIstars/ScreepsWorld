import { Guild } from '../core/Guild';
import { computeTags, computeCapacities } from '../core/tagSystem';
import { getBehavior } from '../behavior/index';

const ROLE_PREFS: Record<string, string[]> = {
  harvester: ['collect', 'harvest', 'fill', 'upgrade'],
  builder:   ['build', 'collect', 'fill', 'harvest', 'upgrade'],
  upgrader:  ['upgrade', 'collect', 'fill', 'harvest'],
};

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

  // ─── Query events sorted by role preference ───

  protected queryEvents(): Event[] {
    const tags = computeTags(this.creep.body);
    const caps = computeCapacities(this.creep.body);
    const events = Guild.query(tags, caps, this.creep.room.name);
    const prefs = ROLE_PREFS[this.creep.memory.role || ''] || [];
    events.sort((a: Event, b: Event) => {
      const ai = prefs.indexOf(a.type);
      const bi = prefs.indexOf(b.type);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return events;
  }

  // ─── Find first matching event by type list ───

  protected findEvent(events: Event[], types: string[]): Event | undefined {
    for (const t of types) {
      const found = events.find((e) => e.type === t);
      if (found) return found;
    }
    return undefined;
  }

  // ─── Claim an event ───

  protected assignEvent(event: Event): void {
    const ok = Guild.claim(event.id, this.creep.name);
    if (ok) {
      this.creep.memory.currentEventId = event.id;
    }
  }

  // ─── Execute current event (shared logic) ───

  protected executeCurrentEvent(): void {
    const id = this.creep.memory.currentEventId;
    if (!id) return;

    const event = Guild.findById(id);
    if (!event || event.status === 'completed' || event.status === 'expired' || !event.claimerIds.includes(this.creep.name)) {
      const reason = !event
        ? 'not_found'
        : event.status === 'completed' || event.status === 'expired'
          ? 'status=' + event.status
          : 'not_in_claimers';
      console.log('[' + Game.time + '] ' + this.creep.name + ' lost event ' + id + ' (' + reason + ')');
      delete this.creep.memory.currentEventId;
      return;
    }

    const behavior = getBehavior(event.type);
    if (!behavior || !behavior.validate(this.creep, event)) {
      // Target gone → complete the event, not release
      const targetGone = event.data?.targetId && !Game.getObjectById(event.data.targetId as Id<any>);
      if (targetGone) {
        console.log('[' + Game.time + '] ' + this.creep.name + ' complete ' + event.type + ' (target gone)');
        Guild.complete(event.id);
      } else {
        Guild.release(event.id, this.creep.name);
      }
      delete this.creep.memory.currentEventId;
      return;
    }

    behavior.execute(this.creep, event);
    var complete = behavior.isComplete(this.creep, event);
    if (complete) {
      console.log('[' + Game.time + '] ' + this.creep.name + ' complete ' + event.type);
      Guild.complete(event.id);
      delete this.creep.memory.currentEventId;
    }
  }
}
