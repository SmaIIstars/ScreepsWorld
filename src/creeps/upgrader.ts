import { BaseCreep } from './BaseCreep';

export class UpgraderCreep extends BaseCreep {
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

    // Has energy → upgrade first, fallback to build
    if (this.hasEnergy()) {
      if (this.claimEvent(['upgrade'])) return;
      if (this.claimEvent(['build', 'repair'])) return;
      return; // nowhere to spend energy → wait, don't collect
    }

    // Empty → collect first (decays), then harvest
    if (this.claimEvent(['collect', 'harvest', 'withdraw'])) return;

    // Fallback
    this.claimFallback();
  }
}
