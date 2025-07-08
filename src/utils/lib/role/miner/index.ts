import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole } from '..';
import { baseRole } from '../../base/role';

const run: BaseRole['run'] = (creep: Creep) => {
  if (creep.store.getFreeCapacity() === 0) {
    intervalSleep(5, () => creep.say(EMOJI.full));
  }

  // 如果周围有其他role, 则将能量转移给其他role
  const nearTransferUnits = creep.pos
    .findInRange(FIND_MY_CREEPS, 1)
    .filter((unit) => unit.store.getFreeCapacity() > 0 && unit.memory.role !== 'miner')
    .sort((a, b) =>
      a.memory.role === 'miner' && b.memory.role !== 'miner'
        ? 1
        : a.memory.role !== 'miner' && b.memory.role === 'miner'
        ? -1
        : 0
    );

  for (let unit of nearTransferUnits) {
    const transferResult = creep.transfer(unit, RESOURCE_ENERGY);
    if (transferResult === OK) {
      intervalSleep(10, () => creep.say(EMOJI.transferring));
    }
  }

  // 如果四周有掉落的能量，则优先回收
  const dropEnergy = creep.pos
    .findInRange(FIND_DROPPED_RESOURCES, 1)
    .filter((resource) => resource.resourceType === RESOURCE_ENERGY);
  if (dropEnergy.length > 0) {
    const transferResult = creep.pickup(dropEnergy[0]);
    if (transferResult === OK) intervalSleep(10, () => creep.say(EMOJI.picking));
    return;
  }

  let targetResource: Source | null = null;
  if (!creep.memory.targetId) {
    // 从Memory中获取现在可用的能源点
    const availableSources = Memory.sources.Source.filter((sourceId) => {
      const source = Game.getObjectById(sourceId) as Source;
      return source.energy > 0 && source.ticksToRegeneration < 300;
    }).map((sourceId) => Game.getObjectById<Source>(sourceId));
    targetResource = availableSources.length ? availableSources.pop()! : null;
  } else {
    targetResource = Game.getObjectById<Source>(creep.memory.targetId);
  }
  if (!targetResource) return;
  creep.memory.targetId = targetResource.id;

  if (creep.memory.task === 'mining') {
    const harvestResult = creep.harvest(targetResource);
    if (harvestResult === OK) {
      intervalSleep(10, () => creep.say(EMOJI.mining));
    } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
      intervalSleep(10, () => creep.say(EMOJI.waiting));
    }
  }

  if (creep.memory.task === 'harvesting') {
    creep.moveTo(targetResource, {
      visualizePathStyle: { stroke: '#ffaa00' },
      reusePath: 5,
    });
    if (creep.pos.isNearTo(targetResource)) {
      creep.memory.task = 'mining';
    }
  }
};

const create: BaseRole['create'] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE],
    role: 'miner',
    opts: { memory: { task: 'harvesting' } },
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
// Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK, CARRY, CARRY, MOVE], 'Miner-1', {memory:{role:'miner', task: 'harvesting'}});
