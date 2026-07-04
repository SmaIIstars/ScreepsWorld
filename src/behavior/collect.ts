// src/behavior/collect.ts
import { type Behavior } from './index';

function getResType(event: Event): ResourceConstant {
  return event.data?.resourceType ?? RESOURCE_ENERGY;
}

export const collectBehavior: Behavior = {
  type: 'collect',

  validate(creep: Creep, event: Event): boolean {
    const rtype = getResType(event);
    if (creep.store.getFreeCapacity(rtype) === 0) return false;
    const target = Game.getObjectById(event.data.targetId as Id<any>);
    if (!target) return false;
    if (target instanceof Resource) return target.amount > 0;
    if ('store' in target) {
      return (target.store as Store<ResourceConstant, false>).getUsedCapacity(rtype) > 0;
    }
    return false;
  },

  execute(creep: Creep, event: Event): void {
    const rtype = getResType(event);
    if (creep.store.getFreeCapacity(rtype) === 0) return;

    const target = Game.getObjectById(event.data.targetId as Id<any>);
    if (!target) return;

    let result: ScreepsReturnCode;
    if (target instanceof Resource) {
      result = creep.pickup(target);
    } else {
      result = creep.withdraw(target as AnyStoreStructure, rtype);
    }

    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(target.pos, { reusePath: 30 });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const rtype = getResType(event);
    if (creep.store.getFreeCapacity(rtype) === 0) return true;
    const target = Game.getObjectById(event.data.targetId as Id<any>);
    if (!target) return true;
    if (target instanceof Resource) return target.amount === 0;
    if ('store' in target) {
      return (target.store as Store<ResourceConstant, false>).getUsedCapacity(rtype) === 0;
    }
    return true;
  },
};
