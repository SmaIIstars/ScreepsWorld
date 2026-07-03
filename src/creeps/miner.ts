import { BaseCreep } from './BaseCreep';
import { Guild } from '../core/Guild';

export class MinerCreep extends BaseCreep {
  /** Only accept harvest events from real Sources — ignore containers, ruins, etc. */
  protected queryEvents(): Event[] {
    const events = super.queryEvents();
    return events.filter((e) => {
      if (e.type !== 'harvest') return true;
      const target = Game.getObjectById(e.data.targetId as Id<any>);
      return target instanceof Source;
    });
  }

  run(): void {
    // Drop energy if full — keep harvesting, let it fall to ground/container
    if (this.isFull()) {
      this.creep.drop(RESOURCE_ENERGY);
    }

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

    // Already bound → verify assignment still valid
    if (this.creep.memory.sourceId) {
      const assignments = Memory.rooms[this.creep.room.name]?.minerAssignments;
      if (assignments?.[this.creep.memory.sourceId] === this.creep.name) return;
      // Assignment was overwritten by another miner → clear and rebind
      delete this.creep.memory.sourceId;
    }

    // First time: claim any harvest
    if (!this.claimEvent(['harvest'])) return;

    const claimed = this.getCurrentEvent();
    if (!claimed) return;

    const sourceId = claimed.data.targetId;
    const assignments = Memory.rooms[this.creep.room.name].minerAssignments ?? {};

    // Check if another living miner already owns this source
    const existing = assignments[sourceId];
    if (existing && existing !== this.creep.name && Game.creeps[existing]) {
      // Another miner got here first → release, try another source next tick
      Guild.release(claimed.id, this.creep.name);
      delete this.creep.memory.currentEventId;
      return;
    }

    // Register this miner as the owner
    if (!Memory.rooms[this.creep.room.name].minerAssignments) {
      Memory.rooms[this.creep.room.name].minerAssignments = {};
    }
    this.creep.memory.sourceId = sourceId;
    Memory.rooms[this.creep.room.name].minerAssignments![sourceId] = this.creep.name;
  }
}
