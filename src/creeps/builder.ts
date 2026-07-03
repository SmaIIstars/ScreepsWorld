import { BaseCreep } from './BaseCreep';

export class BuilderCreep extends BaseCreep {
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

    // Has energy → build first, fallback to upgrade
    if (this.hasEnergy()) {
      // 兜底: 没有 harvester 时优先 fill，保证能源基础设施能恢复
      if (this.countRole('harvester') === 0 && this.claimEvent(['fill'])) return;
      if (this.claimEvent(['build', 'repair'])) return;
      if (this.isFull() && this.claimEvent(['fill'])) return;
      if (this.claimEvent(['upgrade'])) return;
      return; // nowhere to spend energy → wait
    }

    // Empty → collect first (decays), then harvest
    if (this.claimEvent(['collect', 'harvest'])) return;

    // Fallback
    this.claimFallback();
  }
}
