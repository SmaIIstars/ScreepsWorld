// Memory 被JSON序列化，不能缓存 Function

import { BASE_ID_ENUM } from '@/constant';
import { intervalSleep } from '..';
import { generatorRoleBody } from '../lib/base/role';
import { generatorRole } from './generatorRole';

const task = () => {
  if (!minCreepGroup()) return;
  if (!miner()) return;
  if (!minerStore()) return;
  generatorRole();
};

// 最小角色组，用于兜底
const minCreepGroup = (): boolean => {
  const minCreepsList: Array<{ name: string; role: CustomRoleType }> = [
    { name: 'MinHarvester', role: 'harvester' },
    { name: 'MinHarvester2', role: 'harvester' },
    { name: 'MinUpgrader', role: 'upgrader' },
    { name: 'MinBuilder', role: 'builder' },
    { name: 'MinRepairer', role: 'repairer' },
  ];

  for (const creep of minCreepsList) {
    const minCreep = Game.creeps[creep.name];
    if (!minCreep) {
      Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
        generatorRoleBody([
          { body: WORK, count: 2 },
          { body: CARRY, count: 1 },
          { body: MOVE, count: 1 },
        ]),
        creep.name,
        { memory: { role: creep.role, task: 'harvesting' } }
      );
      intervalSleep(10, () => console.log(`MinCreepGroup中缺少: ${creep.name}, 等待孵化...`));
      return false;
    }
  }
  return true;
};

// 矿工
const miner = (): boolean => {
  // 固定旷工
  // TODO: 根据能源点位置，动态确定矿工位置
  const minerList = [
    { name: 'FixedMiner1', pos: { x: 9, y: 44 }, targetId: '5bbcaffd9099fc012e63b77c' },
    { name: 'FixedMiner2', pos: { x: 4, y: 40 }, targetId: '5bbcaffd9099fc012e63b77b' },
  ];

  for (const miner of minerList) {
    const minerCreep = Game.creeps[miner.name];

    if (minerCreep && !minerCreep.pos.isEqualTo(minerCreep.pos.x, minerCreep.pos.y)) {
      minerCreep.moveTo(miner.pos.x, miner.pos.y);
    } else if (!minerCreep) {
      // TODO: 根据策略，动态增加矿工的CARRY能力
      Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
        generatorRoleBody([
          { body: WORK, count: 6 },
          { body: CARRY, count: 3 },
          { body: MOVE, count: 1 },
        ]),
        miner.name,
        { memory: { role: 'miner', task: 'harvesting', targetId: miner.targetId } }
      );
      intervalSleep(10, () => console.log(`Miner中缺少: ${miner.name}, 等待孵化...`));
      return false;
    }
  }
  return true;
};

// 矿工仓库
const minerStore = (): boolean => {
  const minerStoreList = [
    // { name: "MinerStore-1", pos: { x: 6, y: 40 } },
    { name: 'MinerStore-2', pos: { x: 5, y: 39 } },
    { name: 'MinerStore-3', pos: { x: 10, y: 43 } },
  ];

  for (const minerStore of minerStoreList) {
    const minerStoreCreep = Game.creeps[minerStore.name];
    if (minerStoreCreep && !minerStoreCreep.pos.isEqualTo(minerStore.pos.x, minerStore.pos.y)) {
      minerStoreCreep.moveTo(minerStore.pos.x, minerStore.pos.y);
    } else if (!minerStoreCreep) {
      Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
        generatorRoleBody([
          { body: CARRY, count: 15 },
          { body: MOVE, count: 1 },
        ]),
        minerStore.name,
        { memory: { role: 'minerStore' } }
      );
      intervalSleep(10, () => console.log(`MinerStore中缺少: ${minerStore.name}, 等待孵化...`));
      return false;
    }
  }
  return true;
};

export { task };
