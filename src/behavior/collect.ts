// src/behavior/collect.ts
import { type Behavior } from './index';

export const collectBehavior: Behavior = {
  type: 'collect',

  validate(creep: Creep, event: Event): boolean {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return false;
    const target = Game.getObjectById(event.data.targetId as Id<any>);
    if (!target) return false;
    // Resource (dropped energy)
    if (target instanceof Resource) return target.amount > 0;
    // Tombstone or Ruin
    if ('store' in target) {
      return (target.store as Store<ResourceConstant, false>).getUsedCapacity(RESOURCE_ENERGY) > 0;
    }
    return false;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return;

    const target = Game.getObjectById(event.data.targetId as Id<any>);
    if (!target) return;

    let result: ScreepsReturnCode;
    if (target instanceof Resource) {
      result = creep.pickup(target);
    } else {
      result = creep.withdraw(target as AnyStoreStructure, RESOURCE_ENERGY);
    }

    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(target.pos, { reusePath: 30 });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return true;
    const target = Game.getObjectById(event.data.targetId as Id<any>);
    if (!target) return true;
    if (target instanceof Resource) return target.amount === 0;
    if ('store' in target) {
      return (target.store as Store<ResourceConstant, false>).getUsedCapacity(RESOURCE_ENERGY) === 0;
    }
    return true;
  },
};
