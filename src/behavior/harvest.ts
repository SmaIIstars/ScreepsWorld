import { type Behavior } from './index';

export const harvestBehavior: Behavior = {
  type: 'harvest',

  validate(creep: Creep, event: Event): boolean {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return false;
    const source = Game.getObjectById<Source>(event.data.targetId);
    if (!source) return false;
    return source.energy > 0;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return;

    const source = Game.getObjectById<Source>(event.data.targetId);
    if (!source) return;

    const result = creep.harvest(source);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { reusePath: 100, visualizePathStyle: { stroke: '#ffaa00' } });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const source = Game.getObjectById<Source>(event.data.targetId);
    if (!source || source.energy === 0) return true;
    return creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
  },
};
