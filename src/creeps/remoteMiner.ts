import { BaseCreep } from './BaseCreep';

export class RemoteMinerCreep extends BaseCreep {
  /** Only accept harvest from real Sources. */
  protected queryEvents(): Event[] {
    const events = super.queryEvents();
    return events.filter((e) => {
      if (e.type !== 'harvest') return true;
      const target = Game.getObjectById(e.data.targetId as Id<any>);
      return target instanceof Source;
    });
  }

  run(): void {
    const targetRoom = this.creep.memory.targetRoom as string;
    if (!targetRoom) { this.creep.say('no target'); return; }

    // Drop energy if full — let it fall to ground for hauler
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
          return;
        }
      }
    }

    // Not in target room → move there (use flag for cross-room visibility)
    if (this.creep.room.name !== targetRoom) {
      const flag = Game.flags[targetRoom];
      const target = flag || new RoomPosition(25, 25, targetRoom);
      this.creep.moveTo(target, {
        reusePath: 50,
        visualizePathStyle: { stroke: '#ffaa00' },
      });
      return;
    }

    // Bound to source → verify, harvest
    if (this.creep.memory.sourceId) {
      const source = Game.getObjectById(this.creep.memory.sourceId as Id<Source>);
      if (!source || source.energy === 0) {
        delete this.creep.memory.sourceId;
        return;
      } else {
        const result = this.creep.harvest(source);
        if (result === ERR_NOT_IN_RANGE) {
          this.creep.moveTo(source, { reusePath: 100, visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
          // Only repair/build when already at the source
          this.repairOrBuildNearby();
        }
        return;
      }
    }

    // Claim harvest from a free source
    if (this.claimEvent(['harvest'])) {
      const claimed = this.getCurrentEvent();
      if (claimed) this.creep.memory.sourceId = claimed.data.targetId;
      return;
    }

    // Nothing to do — repair/build nearby if we have energy
    this.repairOrBuildNearby();
  }
}
