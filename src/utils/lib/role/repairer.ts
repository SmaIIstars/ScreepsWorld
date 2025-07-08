import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole } from '.';
import { baseRole } from '../base/role';
import harvester from './harvester';

const run: BaseRole['run'] = (creep: Creep) => {
  // 1. 如果creep的store.energy === 0 且正在执行修复任务, 则切换到采集任务
  if (creep.memory.task === 'repairing' && creep.store[RESOURCE_ENERGY] === 0) {
    creep.say(EMOJI.harvesting);
    creep.memory.task = 'harvesting';
    return;
  }

  // 2. 执行采集任务
  if (creep.memory.task === 'harvesting') {
    // 3. 如果creep的能量满了, 则切换到修复任务
    if (creep.store.getFreeCapacity() === 0) {
      creep.memory.task = 'repairing';
      creep.say(EMOJI.repairing);
    } else {
      harvester.run(creep);
    }
    return;
  }

  // 4. 执行修复任务
  if (creep.memory.task === 'repairing') {
    const targetStructures = creep.room
      .find(FIND_STRUCTURES, {
        filter: (s) => s.hits < s.hitsMax || s.structureType === STRUCTURE_TOWER,
      })
      .sort((a, b) => {
        // 优先修复炮塔
        if (a.structureType === STRUCTURE_TOWER && b.structureType !== STRUCTURE_TOWER) return -1;
        if (a.structureType !== STRUCTURE_TOWER && b.structureType === STRUCTURE_TOWER) return 1;
        // 再修生命值最低的，差值1000以上才排序，不然不变
        return Math.abs(a.hits - b.hits) > 1000 ? a.hits - b.hits : 0;
      });

    if (!targetStructures.length) return;
    const targetStructure = targetStructures[0];
    if (!targetStructure.pos.isNearTo(creep)) {
      creep.moveTo(targetStructure, {
        visualizePathStyle: { stroke: '#ffffff' },
      });
      return;
    }
    // 先填炮塔
    if (
      targetStructure.structureType === STRUCTURE_TOWER &&
      targetStructure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    ) {
      const transferResult = creep.transfer(targetStructure, RESOURCE_ENERGY);
      if (transferResult === OK) intervalSleep(5, () => creep.say(EMOJI.transferring));
    } else {
      // 再修建筑
      const repairResult = creep.repair(targetStructure);
      switch (repairResult) {
        case ERR_NOT_IN_RANGE: {
          creep.moveTo(targetStructures[0], {
            visualizePathStyle: { stroke: '#ffffff' },
          });
          break;
        }
        case OK: {
          intervalSleep(10, () => creep.say(EMOJI.repairing), {
            time: creep.ticksToLive,
          });
          break;
        }
        default:
          break;
      }
    }
  }
};

const create: BaseRole['create'] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
    role: 'repairer',
    opts: { memory: { task: 'repairing' } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
