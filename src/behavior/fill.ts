import { type Behavior } from './index';

const storeOf = (t: AnyStoreStructure) => t.store as Store<ResourceConstant, false>;

export const fillBehavior: Behavior = {
  type: 'fill',

  validate(creep: Creep, event: Event): boolean {
    if (creep.store[RESOURCE_ENERGY] === 0) return false;
    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target) return false;
    return storeOf(target).getFreeCapacity(RESOURCE_ENERGY) > 0;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store[RESOURCE_ENERGY] === 0) return;

    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target) return;

    const result = creep.transfer(target, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target || storeOf(target).getFreeCapacity(RESOURCE_ENERGY) === 0) return true;
    return creep.store[RESOURCE_ENERGY] === 0;
  },
};
