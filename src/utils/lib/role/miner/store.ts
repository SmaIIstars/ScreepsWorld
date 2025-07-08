// 作为Miner专用的存储的creep, 跟随Miner移动, 并存储能量，当周围有其他单位时, 将能量转移给其他单位
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole } from '..';
import { baseRole } from '../../base/role';

const run: BaseRole['run'] = (creep: Creep) => {
  const needyTransferUnits = creep.pos
    .findInRange(FIND_MY_CREEPS, 1)
    .filter((unit) => unit.store.getFreeCapacity() > 0 && unit.memory.role !== 'miner')
    // 让非Miner和非MinerStore的单位优先转移
    .sort((a) => (a.memory.role !== 'miner' && a.memory.role !== 'minerStore' ? -1 : 0));

  for (let unit of needyTransferUnits) {
    const transferResult = creep.transfer(unit, RESOURCE_ENERGY);
    if (transferResult === OK) intervalSleep(5, () => creep.say(EMOJI.transferring));
  }

  // 如果四周有掉落的能量，则回收
  const dropEnergy = creep.pos
    .findInRange(FIND_DROPPED_RESOURCES, 1)
    .filter((resource) => resource.resourceType === RESOURCE_ENERGY);
  if (dropEnergy.length > 0) {
    const transferResult = creep.pickup(dropEnergy[0]);
    if (transferResult === OK) intervalSleep(10, () => creep.say(EMOJI.picking));
  }
};
// Game.spawns['Spawn1'].spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE], 'MinerStore-1', {memory:{role:'minerStore'}});
// TODO: 先手动控制
const create: BaseRole['create'] = (baseId?: string, spawnCreepParams = {}) => {
  return baseRole.create({
    baseId,
    body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE],
    role: 'minerStore',
    ...spawnCreepParams,
  });
};

export default {
  run,
  create,
};
