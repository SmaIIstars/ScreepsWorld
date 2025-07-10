// Memory 被JSON序列化，不能缓存 Function

import { intervalSleep } from '..';
import { BaseRole } from '../lib/base/BaseRole';
import { generatorRole } from './generatorRole';

const MIN_MINER_LIST = ['MinMiner', 'MinMiner2'];

const task = () => {
  mainRoomTask();
  // nearSourceRoomTask();
};

const mainRoomTask = () => {
  if (!minCreepGroup()) return;
  miner();
  generatorRole();
};

// MainRoom最小角色组，用于兜底
const minCreepGroup = (): boolean => {
  const minCreepsList: Array<{ name: string; role: CustomRoleType }> = [
    ...MIN_MINER_LIST.map<{ name: string; role: CustomRoleType }>((name) => ({ name, role: 'miner' })),
    { name: 'MinHarvester', role: 'harvester' },
    { name: 'MinHarvester2', role: 'harvester' },
    { name: 'MinUpgrader', role: 'upgrader' },
    { name: 'MinBuilder', role: 'builder' },
    { name: 'MinPioneer', role: 'pioneer' },
    { name: 'MinPioneer2', role: 'pioneer' },
    { name: 'MinPioneer3', role: 'pioneer' },
  ];

  const minCreepCount =
    Object.values(Game.creeps).filter((creep) => creep.name.startsWith('MinMiner')).length + Memory.creepsCount.miner;

  for (const creep of minCreepsList) {
    // 有俩矿机，则不孵化
    if (creep.name.startsWith('MinMiner') && minCreepCount >= 2) continue;
    const minCreep = Game.creeps[creep.name];
    if (!minCreep) {
      let body = [];
      switch (creep.role) {
        case 'miner': {
          body = BaseRole.generatorRoleBody([
            { body: WORK, count: 2 },
            { body: CARRY, count: 1 },
            { body: MOVE, count: 1 },
          ]);
          break;
        }
        case 'pioneer': {
          body = BaseRole.generatorRoleBody([
            { body: WORK, count: 2 },
            { body: CARRY, count: 5 },
            { body: MOVE, count: 4 },
          ]);
          break;
        }
        default: {
          body = BaseRole.generatorRoleBody([
            { body: WORK, count: 1 },
            { body: CARRY, count: 2 },
            { body: MOVE, count: 2 },
          ]);
          break;
        }
      }

      const spawnResult = utils.role2[creep.role].create({
        body,
        name: creep.name,
      });
      // const spawnResult = Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(body, creep.name, {
      //   memory: { role: creep.role, task: creep.role === 'miner' ? 'moving' : 'harvesting' },
      // });

      switch (spawnResult) {
        case OK: {
          console.log(`MiniGroup 孵化${creep.name}成功`);
          break;
        }
        case ERR_NOT_ENOUGH_ENERGY: {
          intervalSleep(5, () => console.log(`MiniGroup 缺少${creep.name}, 能量不足, 等待孵化`));
          break;
        }
        case ERR_NOT_ENOUGH_RESOURCES: {
          intervalSleep(5, () => console.log(`MiniGroup 缺少${creep.name}, 资源不足, 等待孵化`));
          break;
        }
        default:
          intervalSleep(5, () => console.log(`MiniGroup 孵化${creep.name}失败`, spawnResult));
          break;
      }

      return false;
    }
  }

  return true;
};

const miner = () => {
  if (!Memory.creepsCount.miner) return;
  // 大矿机有几个, 则杀死多余的MinMiner
  const miners = Memory.creepsCount.miner;
  const minMiners = Object.values(Game.creeps).filter((creep) => creep.name.startsWith('MinMiner'));
  const keepMinMiners = minMiners.slice(0, 2 - miners);

  for (const minMiner of minMiners) {
    if (keepMinMiners.includes(minMiner)) continue;
    minMiner.suicide();
    console.log(`超过大矿机 miner 上限, 杀死小 MinMiner: ${minMiner.name}`);
  }
};

export { task };

// 新资源房的探索组任务
// export const nearSourceRoomTask = () => {
//   const sourceRoom = Game.rooms[ROOM_ID_ENUM.SourceRoom];
//   if (!sourceRoom) return;

//   // 新资源房探索组, 先只有一个采集者
//   const minCreepsList: Array<{ name: string; role: CustomRoleType }> = [
//     { name: 'MinNearSourceHarvester', role: 'harvester' },
//   ];

//   const body = BaseRole.generatorRoleBody([
//     { body: WORK, count: 1 },
//     { body: CARRY, count: 4 },
//     { body: MOVE, count: 3 },
//   ]);

//   for (const creep of minCreepsList) {
//     const minCreep = Game.creeps[creep.name];
//     if (!minCreep) {
//       // 孵化
//       Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(body, creep.name, {
//         memory: { role: creep.role, task: creep.role === 'miner' ? 'moving' : 'harvesting', group: 'nearSource' },
//       });
//     } else {
//       const targetSource = sourceRoom.find(FIND_SOURCES)[0];
//       if (minCreep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
//         minCreep.moveTo(targetSource);
//       }
//     }
//   }
// };
