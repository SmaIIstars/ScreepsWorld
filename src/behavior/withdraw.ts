import { type Behavior } from './index';

function getResType(event: Event): ResourceConstant {
  return (event.data?.quota as EventQuota)?.resourceType ?? RESOURCE_ENERGY;
}

export const withdrawBehavior: Behavior = {
  type: 'withdraw',

  validate(creep: Creep, event: Event): boolean {
    const rtype = getResType(event);
    if (creep.store.getFreeCapacity(rtype) === 0) return false;
    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target) return false;
    return (target.store as Store<ResourceConstant, false>).getUsedCapacity(rtype) > 0;
  },

  execute(creep: Creep, event: Event): void {
    const rtype = getResType(event);
    if (creep.store.getFreeCapacity(rtype) === 0) return;

    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    if (!target) return;

    const result = creep.withdraw(target, rtype);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { reusePath: 30, visualizePathStyle: { stroke: '#ffaa00' } });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const rtype = getResType(event);
    if (creep.store.getFreeCapacity(rtype) === 0) return true;
    const target = Game.getObjectById<AnyStoreStructure>(event.data.targetId);
    return !target || (target.store as Store<ResourceConstant, false>).getUsedCapacity(rtype) === 0;
  },
};
