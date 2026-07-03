import { Behavior } from './index';

const repairBehavior: Behavior = {
  type: 'repair',

  validate(creep: Creep, event: Event): boolean {
    if (creep.store[RESOURCE_ENERGY] === 0) return false;
    const target = Game.getObjectById(event.data.targetId) as Structure | null;
    if (!target) return false;
    return target.hits < target.hitsMax;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store[RESOURCE_ENERGY] === 0) return;
    const target = Game.getObjectById(event.data.targetId) as Structure | null;
    if (!target) return;
    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { reusePath: 20 });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const target = Game.getObjectById(event.data.targetId) as Structure | null;
    return !target || target.hits >= target.hitsMax;
  },
};

export default repairBehavior;
