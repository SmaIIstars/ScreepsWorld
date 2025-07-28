// // Memory 被JSON序列化，不能缓存 Function

// import { BASE_ID_ENUM, ROOM_ID_ENUM } from '@/constant';
// import { BaseRole, BaseRoleType } from '../lib/base/BaseRole';
// import { generatorRole } from './generatorRole';

// const MIN_MINER_LIST = ['MinMiner', 'MinMiner2'];
// const MIN_PIONEER_TARGET_ROOM1 = ['MinPioneer', 'MinPioneer1'];
// const MIN_PIONEER_TARGET_ROOM2 = ['MinPioneer2', 'MinPioneer4', 'MinPioneer5', 'MinPioneer6'];
// // const MIN_PIONEER_TARGET_ROOM3 = ['MinPioneer3', 'MinPioneer7'];
// const MIN_PIONEER_TARGET_ROOM4 = ['MinPioneer10', 'MinPioneer11', 'MinPioneer12'];

// const task = () => {
//   moveRoom();
//   combatGroupTask();
//   mainRoomTask();
//   generatePixel();
// };

// const moveRoom = () => {
//   const mover = Game.creeps['mover'];

//   if (!mover) {
//     const spawn = Game.spawns[BASE_ID_ENUM.MainBase].spawning
//       ? Game.spawns[BASE_ID_ENUM.MainBase3]
//       : Game.spawns[BASE_ID_ENUM.MainBase];

//     spawn.spawnCreep(
//       BaseRole.generatorRoleBody([
//         { body: MOVE, count: 1 },
//         { body: CARRY, count: 40 },
//       ]),
//       'mover'
//     );
//   } else {
//     // 获取ID为686d6961844323027c6a8791的能量
//     const source = Game.getObjectById<StructureStorage>('686d6961844323027c6a8791');
//     // 目标结构ID为6875ccc40d2222599bf25e42
//     const target = Game.getObjectById<StructureTerminal>('6875ccc40d2222599bf25e42');

//     // 将 source.store 中的所有资源类型（不只是能量）都搬运到 target
//     if (source && target) {
//       for (const resourceType in source.store) {
//         if (source.store[resourceType as ResourceConstant] > 0) {
//           if (mover.store.getFreeCapacity(resourceType as ResourceConstant) > 0) {
//             // 先从source取资源
//             if (mover.withdraw(source, resourceType as ResourceConstant) === ERR_NOT_IN_RANGE) {
//               mover.moveTo(source);
//             }
//             return;
//           } else if (mover.store[resourceType as ResourceConstant] > 0) {
//             // 再把资源送到target
//             if (mover.transfer(target, resourceType as ResourceConstant) === ERR_NOT_IN_RANGE) {
//               mover.moveTo(target);
//             }
//             return;
//           }
//         }
//       }
//     }
//   }
// };

// const mainRoomTask = () => {
//   if (!minCreepGroup()) return;
//   miner();
//   generatorRole();
//   // minClaimGroupTask();
// };

// // MainRoom最小角色组，用于兜底
// const minCreepGroup = (): boolean => {
//   const minCreepsList: Array<{ name: string; role: CustomRoleType; memoryRoleOpts?: BaseRoleType }> = [
//     ...MIN_MINER_LIST.map<{ name: string; role: CustomRoleType }>((name) => ({ name, role: 'miner' })),
//     { name: 'MinHarvester', role: 'harvester' },
//     { name: 'MinHarvester2', role: 'harvester' },
//     { name: 'MinUpgrader', role: 'upgrader' },
//     { name: 'MinBuilder', role: 'builder' },

//     // TargetRoom2
//     // ...MIN_PIONEER_TARGET_ROOM2.map<{ name: string; role: CustomRoleType }>((name) => ({
//     //   name,
//     //   role: 'pioneer',
//     //   memoryRoleOpts: {
//     //     targetRoomName: ROOM_ID_ENUM.TargetRoomFlag2,
//     //   },
//     // })),
//     // TargetRoom3
//     // ...MIN_PIONEER_TARGET_ROOM3.map<{ name: string; role: CustomRoleType }>((name) => ({
//     //   name,
//     //   role: 'pioneer',
//     //   // body: BaseRole.generatorRoleBody([
//     //   //   { body: WORK, count: 2 },
//     //   //   { body: CARRY, count: 2 },
//     //   //   { body: MOVE, count: 4 },
//     //   // ]),
//     //   memoryRoleOpts: {
//     //     targetRoomName: ROOM_ID_ENUM.TargetRoomFlag3,
//     //   },
//     // })),
//     // TargetRoom4
//     // ...MIN_PIONEER_TARGET_ROOM4.map<{ name: string; role: CustomRoleType }>((name) => ({
//     //   name,
//     //   role: 'pioneer',
//     //   body: BaseRole.generatorRoleBody([
//     //     { body: WORK, count: 2 },
//     //     { body: CARRY, count: 2 },
//     //     { body: MOVE, count: 4 },
//     //   ]),
//     //   memoryRoleOpts: {
//     //     targetRoomName: ROOM_ID_ENUM.TargetRoomFlag4,
//     //   },
//     // })),
//   ];

//   if (!Game.flags[ROOM_ID_ENUM.TargetRoomFlag].room?.find(FIND_HOSTILE_CREEPS).length) {
//     // TargetRoom1
//     minCreepsList.push(
//       ...MIN_PIONEER_TARGET_ROOM1.map<{ name: string; role: CustomRoleType }>((name) => ({
//         name,
//         role: 'pioneer',
//         body: BaseRole.generatorRoleBody([
//           { body: WORK, count: 2 },
//           { body: CARRY, count: 2 },
//           { body: MOVE, count: 4 },
//         ]),
//         memoryRoleOpts: {
//           targetRoomName: ROOM_ID_ENUM.TargetRoomFlag,
//         },
//       }))
//     );
//   }

//   if (!Game.flags[ROOM_ID_ENUM.TargetRoomFlag2].room?.find(FIND_HOSTILE_CREEPS).length) {
//     // TargetRoom2
//     minCreepsList.push(
//       ...MIN_PIONEER_TARGET_ROOM2.map<{ name: string; role: CustomRoleType }>((name) => ({
//         name,
//         role: 'pioneer',
//         memoryRoleOpts: {
//           targetRoomName: ROOM_ID_ENUM.TargetRoomFlag2,
//         },
//       }))
//     );
//   }

//   if (!Game.flags[ROOM_ID_ENUM.TargetRoomFlag4].room?.find(FIND_HOSTILE_CREEPS).length) {
//     minCreepsList.push(
//       ...MIN_PIONEER_TARGET_ROOM4.map<{ name: string; role: CustomRoleType }>((name) => ({
//         name,
//         role: 'pioneer',
//         body: BaseRole.generatorRoleBody([
//           { body: WORK, count: 2 },
//           { body: CARRY, count: 2 },
//           { body: MOVE, count: 4 },
//         ]),
//         memoryRoleOpts: {
//           targetRoomName: ROOM_ID_ENUM.TargetRoomFlag4,
//         },
//       }))
//     );
//   }

//   const minCreepCount =
//     Object.values(Game.creeps).filter((creep) => creep.name.startsWith('MinMiner')).length + Memory.creepsCount.miner;

//   for (const creep of minCreepsList) {
//     // 有俩矿机，则不孵化
//     if (creep.name.startsWith('MinMiner') && minCreepCount >= 2) continue;
//     if (creep.name.startsWith('MinHarvester') && Memory.creepsCount.harvester > 0) continue;
//     if (creep.name.startsWith('MinUpgrader') && Memory.creepsCount.upgrader > 0) continue;
//     if (creep.name.startsWith('MinBuilder') && Memory.creepsCount.builder > 0) continue;
//     if (creep.name.startsWith('MinRepairer') && Memory.creepsCount.repairer > 0) continue;

//     const minCreep = Game.creeps[creep.name];
//     if (!minCreep) {
//       let body = [];
//       switch (creep.role) {
//         case 'miner': {
//           body = BaseRole.generatorRoleBody([
//             { body: WORK, count: 2 },
//             { body: CARRY, count: 1 },
//             { body: MOVE, count: 1 },
//           ]);
//           break;
//         }
//         case 'pioneer': {
//           body = BaseRole.generatorRoleBody([
//             { body: WORK, count: 10 },
//             { body: CARRY, count: 20 },
//             { body: MOVE, count: 15 },
//           ]);
//           break;
//         }
//         default: {
//           body = BaseRole.generatorRoleBody([
//             { body: WORK, count: 1 },
//             { body: CARRY, count: 2 },
//             { body: MOVE, count: 2 },
//           ]);
//           break;
//         }
//       }

//       const baseId = Game.spawns[BASE_ID_ENUM.MainBase]?.spawning ? BASE_ID_ENUM.MainBase3 : BASE_ID_ENUM.MainBase;

//       if (Game.spawns[ROOM_ID_ENUM.MainRoom2]?.spawning) return false;
//       const spawnResult = utils.role2[creep.role].create({
//         baseId,
//         body,
//         name: creep.name,
//         memoryRoleOpts: creep.memoryRoleOpts,
//       });
//       switch (spawnResult) {
//         case OK: {
//           console.log(`MiniGroup 正在孵化${creep.name}`);
//           break;
//         }
//       }

//       return false;
//     }
//   }

//   return true;
// };

// const miner = () => {
//   if (!Memory.creepsCount.miner) return;
//   // 大矿机有几个, 则杀死多余的MinMiner
//   const miners = Memory.creepsCount.miner;
//   const minMiners = Object.values(Game.creeps).filter((creep) => creep.name.startsWith('MinMiner'));
//   const keepMinMiners = minMiners.slice(0, 2 - miners);

//   for (const minMiner of minMiners) {
//     if (keepMinMiners.includes(minMiner)) continue;
//     minMiner.suicide();
//     console.log(`超过大矿机 miner 上限, 杀死小 MinMiner: ${minMiner.name}`);
//   }
// };

// // pixel
// const generatePixel = () => {
//   if (Game.cpu.bucket >= 10000) {
//     const result = Game.cpu.generatePixel();

//     if (result === OK) {
//       console.log('生成 1 pixel', result);
//     } else {
//       console.log('生成 pixel 失败', result);
//     }
//   }
// };

// const COMBAT_GROUP = [
//   { name: 'CombatAttacker1', role: 'attacker' },
//   { name: 'CombatAttacker2', role: 'attacker' },
// ];

// const combatGroupTask = () => {
//   for (const creepConfig of COMBAT_GROUP) {
//     const creep = Game.creeps[creepConfig.name];
//     if (!creep) {
//       const body = BaseRole.generatorRoleBody([
//         { body: MOVE, count: 1 },
//         { body: ATTACK, count: 1 },
//       ]);
//       // 生成creep
//       const spawn = Game.spawns[BASE_ID_ENUM.MainBase].spawning
//         ? Game.spawns[BASE_ID_ENUM.MainBase3]
//         : Game.spawns[BASE_ID_ENUM.MainBase];
//       if (spawn && !spawn.spawning) {
//         const result = spawn.spawnCreep(body, creepConfig.name);
//         if (result === OK) {
//           console.log(`战斗小组正在孵化: ${creepConfig.name}`);
//           break;
//         }
//       }
//     }
//   }
//   const attackers = [Game.creeps['CombatAttacker1'], Game.creeps['CombatAttacker2']];
//   const fixPos: { x: number; y: number }[] = [
//     { x: 31, y: 0 },
//     { x: 0, y: 31 },
//   ];

//   attackers.forEach((attacker, index) => {
//     if (!attacker) return;
//     // 如果attacker不在边界则向边界移动
//     if (attacker.pos.x !== 0 && attacker.pos.x !== 49 && attacker.pos.y !== 0 && attacker.pos.y !== 49) {
//       attacker.moveTo(fixPos[index].x, fixPos[index].y);
//     }
//     const hostile = attacker.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
//     if (hostile.length > 0) {
//       attacker.attack(hostile[0]);
//     }
//   });
// };

// const MIN_CLAIM_GROUP = [
//   // { name: 'MinClaimer1', targetRoomName: ROOM_ID_ENUM.TargetRoomFlag },
//   // { name: 'MinClaimer2', targetRoomName: ROOM_ID_ENUM.TargetRoomFlag2 },
//   // { name: 'MinClaimer4', targetRoomName: ROOM_ID_ENUM.TargetRoomFlag4 },
// ];

// // const minClaimGroupTask = () => {
// //   for (const creepConfig of MIN_CLAIM_GROUP) {
// //     const creep = Game.creeps[creepConfig.name];
// //     if (!creep) {
// //       // 生成claimer
// //       const body = BaseRole.generatorRoleBody([
// //         { body: MOVE, count: 1 },
// //         { body: CLAIM, count: 2 },
// //       ]);
// //       const spawn = Game.spawns[BASE_ID_ENUM.MainBase].spawning
// //         ? Game.spawns[BASE_ID_ENUM.MainBase3]
// //         : Game.spawns[BASE_ID_ENUM.MainBase];
// //       if (spawn && !spawn.spawning) {
// //         const result = spawn.spawnCreep(body, creepConfig.name, {
// //           memory: {
// //             role: 'claimer',
// //             task: 'moving',
// //             targetRoomName: creepConfig.targetRoomName,
// //           },
// //         });
// //         if (result === OK) {
// //           console.log(`MinClaimer正在孵化: ${creepConfig.name}`);
// //           break;
// //         }
// //       }
// //     }
// //   }
// // };

// export { task };
