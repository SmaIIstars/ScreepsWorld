import { BaseCreep } from './BaseCreep';
import { getBehavior } from '../behavior/index';

export class BuilderCreep extends BaseCreep {
  run(): void {
    if (this.creep.memory.currentEventId) {
      this.executeCurrentEvent();
      if (this.creep.memory.currentEventId) return;
    }

    const events = this.queryEvents();
    if (events.length === 0) {
      console.log('[' + Game.time + '] ' + this.creep.name + ' NO EVENTS available (hasEnergy=' + this.hasEnergy() + ' isFull=' + this.isFull() + ')');
    }

    // Has energy → build first, fallback to upgrade
    if (this.hasEnergy()) {
      const evt = this.findEvent(events, ['build', 'repair']);
      if (evt) { this.assignEvent(evt); return; }
      const upgradeEvt = this.findEvent(events, ['upgrade']);
      if (upgradeEvt) { this.assignEvent(upgradeEvt); return; }
    }

    // Full → fill spawn as fallback duty
    if (this.isFull()) {
      const evt = this.findEvent(events, ['fill']);
      if (evt) { this.assignEvent(evt); return; }
    }

    // Empty → collect first (decays), then harvest
    const evt = this.findEvent(events, ['collect', 'harvest']);
    if (evt) { this.assignEvent(evt); return; }

    // Fallback
    for (const e of events) {
      const b = getBehavior(e.type);
      if (b && b.validate(this.creep, e)) { this.assignEvent(e); return; }
    }
  }
}
