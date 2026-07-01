import { Guild } from '../core/Guild';
import { computeTags, computeCapacities } from '../core/tagSystem';
import { getBehavior } from '../behavior/index';

const ROLE_PREFS: Record<string, string[]> = {
  harvester: ['harvest_energy', 'fill_spawn', 'upgrade_controller'],
  upgrader: ['upgrade_controller', 'fill_spawn', 'harvest_energy'],
  builder: ['build', 'fill_spawn', 'harvest_energy', 'upgrade_controller'],
};

export abstract class BaseCreep {
  protected creep: Creep;

  constructor(creep: Creep) {
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
      console.log('[' + Game.time + '] ' + this.creep.name + ' claim ' + event.type + ' (p=' + event.priority + ')');
      this.creep.memory.currentEventId = event.id;
    }
  }

  // ─── Execute current event (shared logic) ───

  protected executeCurrentEvent(): void {
    const id = this.creep.memory.currentEventId;
    if (!id) return;

    const event = Guild.findById(id);
    console.log(
      '[' + Game.time + '] ' + this.creep.name + ' check event ' + id + ' -> ' + (event ? event.status : 'null')
    );
    if (!event || !event.claimerIds.includes(this.creep.name)) {
      const reason = !event
        ? 'not_found id=' + id
        : event.status !== 'claimed'
          ? 'status=' + event.status
          : 'not_in_claimers';
      console.log('[' + Game.time + '] ' + this.creep.name + ' lost event (' + reason + ')');
      delete this.creep.memory.currentEventId;
      return;
    }

    const behavior = getBehavior(event.type);
    if (!behavior || !behavior.validate(this.creep, event)) {
      console.log('[' + Game.time + '] ' + this.creep.name + ' release ' + event.type + ' (validate fail)');
      Guild.release(event.id, this.creep.name);
      delete this.creep.memory.currentEventId;
      return;
    }

    var freeCap = this.creep.store.getFreeCapacity(RESOURCE_ENERGY);
    console.log('[' + Game.time + '] ' + this.creep.name + ' execute ' + event.type + ' free=' + freeCap + ' energy=' + this.creep.store[RESOURCE_ENERGY]);
    behavior.execute(this.creep, event);
    var complete = behavior.isComplete(this.creep, event);
    console.log('[' + Game.time + '] ' + this.creep.name + ' isComplete=' + complete + ' free=' + this.creep.store.getFreeCapacity(RESOURCE_ENERGY));
    if (complete) {
      console.log('[' + Game.time + '] ' + this.creep.name + ' complete ' + event.type);
      Guild.complete(event.id);
      delete this.creep.memory.currentEventId;
    }
  }
}
