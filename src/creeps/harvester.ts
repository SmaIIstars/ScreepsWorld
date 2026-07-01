import { BaseCreep } from './BaseCreep';
import { getBehavior } from '../behavior/index';

export class HarvesterCreep extends BaseCreep {
  run(): void {
    if (this.creep.memory.currentEventId) {
      this.executeCurrentEvent();
      if (this.creep.memory.currentEventId) return;
    }

    const events = this.queryEvents();
    if (events.length === 0) {
      console.log('[' + Game.time + '] ' + this.creep.name + ' NO EVENTS available (hasEnergy=' + this.hasEnergy() + ' isFull=' + this.isFull() + ')');
    }

    // Full → transport
    if (this.isFull()) {
      const evt = this.findEvent(events, ['fill', 'transport_energy']);
      if (evt) { this.assignEvent(evt); return; }
    }

    // Not full → harvest
    const evt = this.findEvent(events, ['harvest']);
    if (evt) { this.assignEvent(evt); return; }

    // Fallback
    for (const e of events) {
      const b = getBehavior(e.type);
      if (b && b.validate(this.creep, e)) { this.assignEvent(e); return; }
    }
  }
}
