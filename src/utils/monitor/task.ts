// Memory 被JSON序列化，不能缓存 Function

import { BASE_ID_ENUM } from '@/constant';
import { intervalSleep } from '..';
import { generatorRoleBody } from '../lib/base/role';
import { role2 } from '../lib/role2';
import { generatorRole } from './generatorRole';

const FIXED_MINER_LIST = ['FixedMiner1', 'FixedMiner2'];
const MIN_MINER_LIST = ['MinMiner', 'MinMiner2'];

const task = () => {
  if (!minCreepGroup()) return;
  if (!miner()) return;
  generatorRole();
};

// 最小角色组，用于兜底
const minCreepGroup = (): boolean => {
  // let hasAllMiners = false;
  // if (FIXED_MINER_LIST.every((name) => Game.creeps[name])) {
  //   hasAllMiners = true;
  // }

  const minCreepsList: Array<{ name: string; role: CustomRoleType }> = [
    ...MIN_MINER_LIST.map<{ name: string; role: CustomRoleType }>((name) => ({ name, role: 'miner' })),
    { name: 'MinHarvester', role: 'harvester' },
    { name: 'MinHarvester2', role: 'harvester' },
    { name: 'MinUpgrader', role: 'upgrader' },
  ];

  for (const creep of minCreepsList) {
    if (MIN_MINER_LIST.includes(creep.name) && Memory.creepsCount.miner >= 2) continue;
    if (creep.name.startsWith('MinHarvester') && Memory.creepsCount.harvester >= 2) continue;
    if (creep.name === 'MinUpgrader' && Memory.creepsCount.upgrader >= 1) continue;

    const minCreep = Game.creeps[creep.name];
    if (!minCreep) {
      if (MIN_MINER_LIST.includes(creep.name)) {
        role2.miner?.create({
          body: generatorRoleBody([
            { body: WORK, count: 2 },
            { body: CARRY, count: 1 },
            { body: MOVE, count: 1 },
          ]),
          name: creep.name,
          memoryRoleOpts: { role: 'miner', task: 'moving' },
        });
      } else {
        Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
          generatorRoleBody([
            { body: CARRY, count: 4 },
            { body: MOVE, count: 2 },
          ]),
          creep.name,
          { memory: { role: creep.role, task: creep.role === 'miner' ? 'moving' : 'harvesting' } }
        );
        intervalSleep(10, () => console.log(`MinCreepGroup中缺少: ${creep.name}, 等待孵化...`));
        return false;
      }
    }
  }
  return true;
};

// 矿工
const miner = (): boolean => {
  // 如果两个大旷工都在，则杀死小旷工
  if (FIXED_MINER_LIST.every((name) => Game.creeps[name])) {
    for (const name of MIN_MINER_LIST) {
      if (Game.creeps[name]) Game.creeps[name].suicide();
    }
  }

  // 固定旷工
  // TODO: 根据能源点位置，动态确定矿工位置
  const minerList = FIXED_MINER_LIST.map((name) => ({ name }));

  for (const miner of minerList) {
    const minerCreep = Game.creeps[miner.name];
    if (
      minerCreep?.ticksToLive &&
      minerCreep.ticksToLive < 100 &&
      Game.spawns[BASE_ID_ENUM.MainBase].store.getFreeCapacity(RESOURCE_ENERGY) > 0
    ) {
      intervalSleep(10, () => console.log(`Miner ${miner.name} 即将死亡，需要补充, 存储能量`));
      return false;
    }
    if (!minerCreep) {
      // TODO: 根据策略，动态增加矿工的CARRY能力
      role2.miner?.create({
        body: generatorRoleBody([
          { body: WORK, count: 6 },
          { body: CARRY, count: 1 },
          { body: MOVE, count: 3 },
        ]),
        name: miner.name,
        memoryRoleOpts: { role: 'miner', task: 'moving' },
      });
      intervalSleep(10, () => console.log(`缺少: ${miner.name}, 等待孵化...`));
      return false;
    }
  }
  return true;
};

// 矿工仓库
// const minerStore = (): boolean => {
//   const minerStoreList = [
//     // { name: "MinerStore-1", pos: { x: 6, y: 40 } },
//     { name: 'MinerStore-2', pos: { x: 5, y: 39 } },
//     { name: 'MinerStore-3', pos: { x: 10, y: 43 } },
//   ];

//   for (const minerStore of minerStoreList) {
//     const minerStoreCreep = Game.creeps[minerStore.name];
//     if (minerStoreCreep && !minerStoreCreep.pos.isEqualTo(minerStore.pos.x, minerStore.pos.y)) {
//       minerStoreCreep.moveTo(minerStore.pos.x, minerStore.pos.y);
//     } else if (!minerStoreCreep) {
//       Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
//         generatorRoleBody([
//           { body: CARRY, count: 15 },
//           { body: MOVE, count: 1 },
//         ]),
//         minerStore.name,
//         { memory: { role: 'minerStore' } }
//       );
//       intervalSleep(10, () => console.log(`缺少: ${minerStore.name}, 等待孵化...`));
//       return false;
//     }
//   }
//   return true;
// };

export { task };
