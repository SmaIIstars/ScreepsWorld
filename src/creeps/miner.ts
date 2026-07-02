import { BaseCreep } from './BaseCreep';

export class MinerCreep extends BaseCreep {
  run(): void {
    // Drop energy if full — keep harvesting, let it fall to ground/container
    if (this.isFull()) {
      this.creep.drop(RESOURCE_ENERGY);
    }

    if (this.creep.memory.currentEventId) {
      this.executeCurrentEvent();
      if (this.creep.memory.currentEventId) return;
    }

    // Miner only harvests — stays at source forever
    const events = this.queryEvents();
    const evt = this.findEvent(events, ['harvest']);
    if (evt) { this.assignEvent(evt); return; }
  }
}
