// Memory 被JSON序列化，不能缓存 Function

import { BASE_ID_ENUM } from '@/constant';
import { generatorRoleBody } from '../lib/base/role';
import { generatorRole } from './generatorRole';

const FIXED_MINER_LIST = ['FixedMiner1', 'FixedMiner2'];
const MIN_MINER_LIST = ['MinMiner', 'MinMiner2'];

const task = () => {
  if (!minCreepGroup()) return;
  // if (!miner()) return;
  generatorRole();
};

// 最小角色组，用于兜底
const minCreepGroup = (): boolean => {
  const minCreepsList: Array<{ name: string; role: CustomRoleType }> = [
    ...MIN_MINER_LIST.map<{ name: string; role: CustomRoleType }>((name) => ({ name, role: 'miner' })),
    { name: 'MinHarvester', role: 'harvester' },
    { name: 'MinHarvester2', role: 'harvester' },
    { name: 'MinUpgrader', role: 'upgrader' },
    { name: 'MinBuilder', role: 'builder' },
  ];

  for (const creep of minCreepsList) {
    if (MIN_MINER_LIST.includes(creep.name) && Memory.creepsCount.miner >= 2) continue;
    if (creep.name.startsWith('MinHarvester') && Memory.creepsCount.harvester >= 2) continue;
    if (creep.name === 'MinUpgrader' && Memory.creepsCount.upgrader >= 1) continue;

    const minCreep = Game.creeps[creep.name];
    if (!minCreep) {
      let body = [];
      switch (creep.role) {
        case 'miner': {
          body = generatorRoleBody([
            { body: WORK, count: 2 },
            { body: CARRY, count: 1 },
            { body: MOVE, count: 1 },
          ]);
          break;
        }
        default: {
          body = generatorRoleBody([
            { body: WORK, count: 1 },
            { body: CARRY, count: 2 },
            { body: MOVE, count: 2 },
          ]);
          break;
        }
      }

      Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(body, creep.name, {
        memory: { role: creep.role, task: creep.role === 'miner' ? 'moving' : 'harvesting' },
      });

      return false;
    }
  }
  return true;
};

// 矿工
// const miner = (): boolean => {};

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
