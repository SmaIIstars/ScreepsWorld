import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { baseRole } from '../../base/role';

const run: BaseRole['run'] = (creep: Creep) => {
  if (creep.store.getFreeCapacity() === 0) {
    intervalSleep(5, () => creep.say(EMOJI.full));
  }

  // 如果周围有其他role, 则将能量转移给其他role
  const nearTransferUnits = creep.pos
    .findInRange(FIND_MY_CREEPS, 1)
    .filter((unit) => unit.store.getFreeCapacity() > 0)
    .sort((a, b) =>
      a.memory.role === 'miner' && b.memory.role !== 'miner'
        ? 1
        : a.memory.role !== 'miner' && b.memory.role === 'miner'
          ? -1
          : 0,
    );

  if (nearTransferUnits.length > 0) {
    const unit = nearTransferUnits[0];
    const transferResult = creep.transfer(unit, RESOURCE_ENERGY);
    if (transferResult === OK) {
      intervalSleep(5, () => creep.say(EMOJI.transferring));
    }
  }

  let targetResource: Source | null = null;
  if (!creep.memory.targetSourceId) {
    const availableResources = Object.values(Memory.resources)
      .filter(
        (resource) =>
          resource.source instanceof Source && resource.source.energy > 0 && resource.source.ticksToRegeneration < 300,
      )
      .map((resource) => resource.source as Source);
    targetResource = availableResources.pop() ?? null;
    creep.memory.targetSourceId = targetResource?.id;
  } else {
    targetResource = Memory.resources[creep.memory.targetSourceId]?.source as Source | null;
  }
  if (!targetResource) return;

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
