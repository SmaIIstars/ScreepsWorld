import { BaseCreep } from './BaseCreep';
import { getBehavior } from '../behavior/index';

export class UpgraderCreep extends BaseCreep {
  run(): void {
    if (this.creep.memory.currentEventId) { this.executeCurrentEvent(); return; }

    const events = this.queryEvents();

    // Has energy → upgrade first
    if (this.hasEnergy()) {
      const evt = this.findEvent(events, ['upgrade_controller']);
      if (evt) { this.assignEvent(evt); return; }
    }

    // Full but no upgrade needed → fill spawn
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
