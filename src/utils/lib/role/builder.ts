import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { baseRole } from '../base/role';
import harvester from './harvester';

const BUILDER_PRIORITY: BuildableStructureConstant[] = [
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER,
  STRUCTURE_WALL,
  STRUCTURE_RAMPART,
  STRUCTURE_ROAD,
  STRUCTURE_CONTAINER,
];

const run: BaseRole['run'] = (creep: Creep, opts = {}) => {
  const constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES).sort((a, b) => {
    const aIndex = BUILDER_PRIORITY.indexOf(a.structureType);
    const bIndex = BUILDER_PRIORITY.indexOf(b.structureType);
    return aIndex - bIndex;
  });

  if (constructionSites.length === 0) {
    harvester.run(creep, opts);
    creep.memory.task = 'harvesting';
    return;
  }

  if (creep.memory.task === 'building' && creep.store[RESOURCE_ENERGY] === 0) {
    intervalSleep(10, () => creep.say(EMOJI.harvesting));
    creep.memory.task = 'harvesting';
  }

  if (creep.memory.task === 'harvesting' && creep.store.getFreeCapacity() === 0) {
    intervalSleep(10, () => creep.say(EMOJI.building));
    creep.memory.task = 'building';
  }

  if (creep.memory.task === 'harvesting') {
    harvester.run(creep, opts);
  }

  if (creep.memory.task === 'building') {
    const needToBuild = constructionSites.filter((site) => site.progress < site.progressTotal);

    if (needToBuild.length === 0) {
      creep.memory.task = 'harvesting';
      return;
    }

    if (creep.build(needToBuild[0]) === ERR_NOT_IN_RANGE) {
      creep.moveTo(needToBuild[0], {
        visualizePathStyle: { stroke: '#ffffff' },
      });
    }
  }
};

const create: BaseRole['create'] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    role: 'builder',
    opts: { memory: { task: 'building' } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
