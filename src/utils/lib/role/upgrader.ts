import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { baseRole } from '../base/role';
import harvester from './harvester';

const run = (creep: Creep) => {
  // 1. 如果creep的store.energy === 0 且正在执行升级任务, 则切换到采集任务
  if (creep.memory.task === 'upgrading' && creep.store[RESOURCE_ENERGY] === 0) {
    creep.say(EMOJI.harvesting);
    creep.memory.task = 'harvesting';
  }

  // 2. 执行采集任务
  if (creep.memory.task === 'harvesting' && creep.store.getFreeCapacity() === 0) {
    // 3. 如果creep的能量满了, 则切换到升级任务
    creep.memory.task = 'upgrading';
    creep.say(EMOJI.upgrading);
  }

  if (creep.memory.task === 'harvesting') {
    harvester.run(creep);
    return;
  }

  // 4. 执行升级任务
  if (creep.memory.task === 'upgrading') {
    const targetController = creep.room.controller;
    if (!targetController) return;

    const upgradeResult = creep.upgradeController(targetController);

    switch (upgradeResult) {
      case ERR_NOT_IN_RANGE: {
        creep.moveTo(targetController, {
          visualizePathStyle: { stroke: '#ffffff' },
        });
        break;
      }
      case OK: {
        intervalSleep(10, () => creep.say(EMOJI.upgrading), {
          time: creep.ticksToLive,
        });
        break;
      }
      default:
        break;
    }

    return;
  }
};

const create = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, CARRY, CARRY, MOVE, MOVE],
    role: 'upgrader',
    opts: { memory: { task: 'upgrading' } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
