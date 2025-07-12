// Memory 被JSON序列化，不能缓存 Function

import { ROOM_ID_ENUM } from '@/constant';
import { BaseRole, BaseRoleType } from '../lib/base/BaseRole';
import { generatorRole } from './generatorRole';

const MIN_MINER_LIST = ['MinMiner', 'MinMiner2'];
const MIN_PIONEER_TARGET_ROOM1 = ['MinPioneer', 'MinPioneer2', 'MinPioneer3'];
const MIN_PIONEER_TARGET_ROOM2 = ['MinPioneer4', 'MinPioneer5', 'MinPioneer6', 'MinPioneer7'];
const MIN_PIONEER_TARGET_ROOM3 = ['MinPioneer8', 'MinPioneer9'];
const MIN_PIONEER_TARGET_ROOM4 = ['MinPioneer10', 'MinPioneer11', 'MinPioneer12', 'MinPioneer13'];

const task = () => {
  mainRoomTask();
  generatePixel();
};

const mainRoomTask = () => {
  if (!minCreepGroup()) return;
  miner();
  generatorRole();
};

// MainRoom最小角色组，用于兜底
const minCreepGroup = (): boolean => {
  const minCreepsList: Array<{ name: string; role: CustomRoleType; memoryRoleOpts?: BaseRoleType }> = [
    ...MIN_MINER_LIST.map<{ name: string; role: CustomRoleType }>((name) => ({ name, role: 'miner' })),
    { name: 'MinHarvester', role: 'harvester' },
    { name: 'MinHarvester2', role: 'harvester' },
    { name: 'MinUpgrader', role: 'upgrader' },
    { name: 'MinBuilder', role: 'builder' },
    // TargetRoom1
    ...MIN_PIONEER_TARGET_ROOM1.map<{ name: string; role: CustomRoleType }>((name) => ({
      name,
      role: 'pioneer',
      memoryRoleOpts: {
        targetRoomName: ROOM_ID_ENUM.TargetRoomFlag,
      },
    })),
    // TargetRoom2
    ...MIN_PIONEER_TARGET_ROOM2.map<{ name: string; role: CustomRoleType }>((name) => ({
      name,
      role: 'pioneer',
      memoryRoleOpts: {
        targetRoomName: ROOM_ID_ENUM.TargetRoomFlag2,
      },
    })),
    // // TargetRoom3
    // ...MIN_PIONEER_TARGET_ROOM3.map<{ name: string; role: CustomRoleType }>((name) => ({
    //   name,
    //   role: 'pioneer',
    //   body: BaseRole.generatorRoleBody([
    //     { body: WORK, count: 2 },
    //     { body: CARRY, count: 2 },
    //     { body: MOVE, count: 4 },
    //   ]),
    //   memoryRoleOpts: {
    //     targetRoomName: ROOM_ID_ENUM.TargetRoomFlag3,
    //   },
    // })),
    // TargetRoom4
    ...MIN_PIONEER_TARGET_ROOM4.map<{ name: string; role: CustomRoleType }>((name) => ({
      name,
      role: 'pioneer',
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 4 },
      ]),
      memoryRoleOpts: {
        targetRoomName: ROOM_ID_ENUM.TargetRoomFlag4,
      },
    })),
  ];

  const minCreepCount =
    Object.values(Game.creeps).filter((creep) => creep.name.startsWith('MinMiner')).length + Memory.creepsCount.miner;

  for (const creep of minCreepsList) {
    // 有俩矿机，则不孵化
    if (creep.name.startsWith('MinMiner') && minCreepCount >= 2) continue;
    if (creep.name.startsWith('MinHarvester') && Memory.creepsCount.harvester > 0) continue;
    if (creep.name.startsWith('MinUpgrader') && Memory.creepsCount.upgrader > 0) continue;
    if (creep.name.startsWith('MinBuilder') && Memory.creepsCount.builder > 0) continue;
    if (creep.name.startsWith('MinRepairer') && Memory.creepsCount.repairer > 0) continue;

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
          body = MIN_PIONEER_TARGET_ROOM1.includes(creep.name)
            ? BaseRole.generatorRoleBody([
                { body: WORK, count: 2 },
                { body: CARRY, count: 6 },
                { body: MOVE, count: 4 },
              ])
            : BaseRole.generatorRoleBody([
                { body: WORK, count: 3 },
                { body: CARRY, count: 7 },
                { body: MOVE, count: 5 },
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

      if (Game.spawns[ROOM_ID_ENUM.MainRoom2]?.spawning) return false;
      const spawnResult = utils.role2[creep.role].create({
        body,
        name: creep.name,
        memoryRoleOpts: creep.memoryRoleOpts,
      });
      switch (spawnResult) {
        case OK: {
          console.log(`MiniGroup 正在孵化${creep.name}`);
          break;
        }
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

// pixel
const generatePixel = () => {
  if (Game.cpu.bucket >= 10000) {
    const result = Game.cpu.generatePixel();

    if (result === OK) {
      console.log('生成 1 pixel', result);
    } else {
      console.log('生成 pixel 失败', result);
    }
  }
};
