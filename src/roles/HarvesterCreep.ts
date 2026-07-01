import { BaseCreep } from './BaseCreep';
import { getBehavior } from '../behavior/index';

export class HarvesterCreep extends BaseCreep {
  run(): void {
    if (this.creep.memory.currentEventId) { this.executeCurrentEvent(); return; }

    const events = this.queryEvents();

    // Full → transport
    if (this.isFull()) {
      const evt = this.findEvent(events, ['fill_spawn', 'transport_energy']);
      if (evt) { this.assignEvent(evt); return; }
    }

    // Not full → harvest
    const evt = this.findEvent(events, ['harvest_energy']);
    if (evt) { this.assignEvent(evt); return; }

    // Fallback
    for (const e of events) {
      const b = getBehavior(e.type);
      if (b && b.validate(this.creep, e)) { this.assignEvent(e); return; }
    }
  }
}
