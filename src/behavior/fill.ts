import { type Behavior } from './index';

const storeOf = (t: AnyStoreStructure) => t.store as Store<ResourceConstant, false>;

function getResType(event: Event): ResourceConstant {
  return event.data?.resourceType ?? RESOURCE_ENERGY;
}

export const fillBehavior: Behavior = {
  type: 'fill',

  validate(creep: Creep, event: Event): boolean {
    const rtype = getResType(event);
    if (creep.store[rtype] === 0) return false;
    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target) return false;
    return storeOf(target).getFreeCapacity(rtype) > 0;
  },

  execute(creep: Creep, event: Event): void {
    const rtype = getResType(event);
    if (creep.store[rtype] === 0) return;

    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target) return;

    const result = creep.transfer(target, rtype);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { reusePath: 30, visualizePathStyle: { stroke: '#ffffff' } });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const rtype = getResType(event);
    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target || storeOf(target).getFreeCapacity(rtype) === 0) return true;
    return creep.store[rtype] === 0;
  },
};
