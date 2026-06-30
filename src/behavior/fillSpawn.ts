import { type Behavior } from './index';

export const fillSpawnBehavior: Behavior = {
  type: 'fill_spawn',

  validate(event: Event): boolean {
    const spawn = Game.getObjectById<StructureSpawn>(event.data.targetId);
    if (!spawn) return false;
    return spawn.energy < spawn.energyCapacity;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store[RESOURCE_ENERGY] === 0) return;

    const spawn = Game.getObjectById<StructureSpawn>(event.data.targetId);
    if (!spawn) return;

    const result = creep.transfer(spawn, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const spawn = Game.getObjectById<StructureSpawn>(event.data.targetId);
    if (!spawn || spawn.energy >= spawn.energyCapacity) return true;
    return creep.store[RESOURCE_ENERGY] === 0;
  },
};
