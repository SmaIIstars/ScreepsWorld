import { BaseCreep } from './BaseCreep';
import { getBehavior } from '../behavior/index';

export class BuilderCreep extends BaseCreep {
  run(): void {
    if (this.creep.memory.currentEventId) { this.executeCurrentEvent(); return; }

    const events = this.queryEvents();

    // Has energy → build first
    if (this.hasEnergy()) {
      const evt = this.findEvent(events, ['build', 'repair']);
      if (evt) { this.assignEvent(evt); return; }
    }

    // Full → fill spawn as fallback duty
    if (this.isFull()) {
      const evt = this.findEvent(events, ['fill_spawn']);
      if (evt) { this.assignEvent(evt); return; }
    }

    // Empty → harvest
    const evt = this.findEvent(events, ['harvest_energy']);
    if (evt) { this.assignEvent(evt); return; }

    // Fallback
    for (const e of events) {
      const b = getBehavior(e.type);
      if (b && b.validate(this.creep, e)) { this.assignEvent(e); return; }
    }
  }
}
