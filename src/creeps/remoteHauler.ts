import { BaseCreep } from './BaseCreep';

export class RemoteHaulerCreep extends BaseCreep {
  run(): void {
    const homeRoom = this.creep.memory.homeRoom as string;
    const targetRoom = this.creep.memory.targetRoom as string;
    if (!homeRoom || !targetRoom) { this.creep.say('no route'); return; }

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

    // State: returning home with energy
    if (this.creep.memory.returning) {
      // Arrived home -> deposit to storage (or spawn)
      if (this.creep.room.name === homeRoom) {
        this.depositAtHome(homeRoom);
        return;
      }
      // En route home -> move toward home controller (always visible)
      const homeTarget = Game.rooms[homeRoom]?.controller?.pos
        || new RoomPosition(25, 25, homeRoom);
      this.creep.moveTo(homeTarget, {
        reusePath: 50,
        visualizePathStyle: { stroke: '#ffffff' },
      });
      this.repairOrBuildNearby();
      return;
    }

    // State: collecting in target room
    if (this.creep.room.name !== targetRoom) {
      // Travel to target room — use flag as waypoint (always visible)
      const flag = Game.flags[targetRoom];
      const target = flag || new RoomPosition(25, 25, targetRoom);
      this.creep.moveTo(target, {
        reusePath: 50,
        visualizePathStyle: { stroke: '#ffaa00' },
      });
      this.repairOrBuildNearby();
      return;
    }

    // In target room - collect energy
    if (this.isFull()) {
      this.creep.memory.returning = true;
      return;
    }

    // Pick up dropped energy
    const dropped = this.creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY,
    });
    if (dropped) {
      if (this.creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(dropped, { reusePath: 30 });
      }
      return;
    }

    // Also check tombstones and ruins
    if (this.claimEvent(['collect'])) return;

    // Nothing to collect -> repair/build if we have energy
    this.repairOrBuildNearby();
  }

  private depositAtHome(homeRoom: string): void {
    const storage = this.creep.room.storage;
    const target = storage || this.creep.room.find(FIND_MY_SPAWNS)[0];
    if (!target) {
      // No storage or spawn — dump energy and go back
      if (this.hasEnergy()) this.creep.drop(RESOURCE_ENERGY);
      this.creep.memory.returning = false;
      return;
    }

    const result = this.creep.transfer(target, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target, { reusePath: 30, visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }

    // Target full — dump energy so we don't get stuck
    if (result === ERR_FULL) {
      this.creep.drop(RESOURCE_ENERGY);
      this.creep.memory.returning = false;
      return;
    }

    // Empty → go back to collecting
    if (this.isEmpty()) {
      this.creep.memory.returning = false;
    }
  }
}
