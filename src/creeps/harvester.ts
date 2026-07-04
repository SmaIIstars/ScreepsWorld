import { BaseCreep } from './BaseCreep';

export class HarvesterCreep extends BaseCreep {
  run(): void {
    // Handle current event
    const event = this.getCurrentEvent();
    if (event) {
      if (this.isEventGone(event)) {
        this.dropEvent();
      } else if (!this.validateBehavior(event)) {
        this.resolveInvalidEvent(event);
      } else {
        this.executeBehavior(event);
        if (this.isBehaviorComplete(event)) {
          this.completeEvent(event);
        } else {
          return; // continue next tick
        }
      }
    }

    // Has energy → fill first, otherwise upgrade
    if (this.hasEnergy()) {
      if (this.claimEvent(['fill'])) return;
      if (this.claimEvent(['upgrade'])) return;
      return; // energy-carrying but nothing to do — wait, don't collect
    }

    // Empty → collect first (decays), then harvest
    if (this.claimEvent(['collect', 'withdraw', 'harvest'])) return;

    // Fallback
    this.claimFallback();
  }
}
