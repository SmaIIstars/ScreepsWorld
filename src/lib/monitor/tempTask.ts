// 临时脚本任务
export const tempScriptTask = () => {
  // 本房间自己的临时任务
  currentRoomTask();
  // pioneeringTask();

  // tempTransferTask();
  return;
};

const tempTransferTask = () => {
  const storage = Game.getObjectById('6887b391b77cbc0eb36d873c') as StructureStorage;
  const factory = Game.getObjectById('68b2c8752ef07d053837dc22') as StructureFactory;

  if (!storage || !factory) return;

  if (storage.store[RESOURCE_ENERGY] >= 200000) return;

  // 解压
  if (factory.store[RESOURCE_ENERGY] > 200 && !factory.cooldown) {
    if (factory.store[RESOURCE_BATTERY] > 50) factory.produce(RESOURCE_ENERGY);
  }

  // 生产;
  // if (factory.store.energy > 200 && !factory.cooldown) {
  //   if (factory.store.O > 500) factory.produce(RESOURCE_OXIDANT);
  //   if (factory.store.H > 500) factory.produce(RESOURCE_REDUCTANT);
  //   if (factory.store.L > 500) factory.produce(RESOURCE_LEMERGIUM_BAR);
  //   if (factory.store[RESOURCE_ENERGY] > 5000) factory.produce(RESOURCE_BATTERY);
  // }

  const creep = Game.creeps['tr-op'];
  if (!creep) {
    const spawn = Object.values(Game.spawns).find((spawn) => spawn.room.name === 'E11N14' && !spawn.spawning);
    if (spawn && !spawn.spawning) {
      spawn.spawnCreep([MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], 'tr-op');
    }
    return;
  }

  if (creep.pos.x !== 15 || creep.pos.y !== 7) {
    creep.moveTo(15, 7);
    return;
  }

  if (factory.store[RESOURCE_ENERGY] > 2000) {
    creep.withdraw(factory, RESOURCE_ENERGY);
  }

  if (creep.store[RESOURCE_ENERGY]) {
    creep.transfer(storage, RESOURCE_ENERGY);
  }

  if (factory.store[RESOURCE_BATTERY] < 100) {
    creep.withdraw(storage, RESOURCE_BATTERY);
    creep.transfer(factory, RESOURCE_BATTERY);
  }

  // // 电池
  // if (factory.store[RESOURCE_BATTERY]) {
  //   creep.withdraw(factory, RESOURCE_BATTERY);
  // }

  // if (creep.store[RESOURCE_BATTERY]) {
  //   creep.transfer(storage, RESOURCE_BATTERY);
  // }

  // if (factory.store[RESOURCE_ENERGY] < 10000) {
  //   creep.withdraw(storage, RESOURCE_ENERGY);
  //   creep.transfer(factory, RESOURCE_ENERGY);
  // }
};

const pioneeringTask = () => {
  // const minClaimerGroupMap: Record<string, string[]> = {};
  // for (const flag of Object.keys(Game.flags)) {
  //   if (Game.flags[flag]?.memory?.type !== 'sourceRoom') continue;
  //   if (Game.flags[flag].memory.status !== 'active') continue;
  //   const payload = Game.flags[flag].memory.payload as RemoteSourceRoomPayload;
  //   minClaimerGroupMap[flag] = new Array(payload.remoteClaimers).fill('').map((_, index) => `${flag}Claimer${index}`);
  // }
  // const spawn = Object.values(Game.spawns).find((s) => s && !s.spawning);
  // for (const roomName of Object.keys(minClaimerGroupMap)) {
  //   for (const creepName of minClaimerGroupMap[roomName]) {
  //     const creep = Game.creeps[creepName];
  //     if (!creep) {
  //       if (spawn)
  //         spawn.spawnCreep(
  //           generatorRoleBody([
  //             { body: MOVE, count: 2 },
  //             { body: CLAIM, count: 2 },
  //           ]),
  //           creepName,
  //           { memory: { role: 'claimer', task: 'moving', targetRoom: roomName } }
  //         );
  //     } else {
  //       if (creep.room.name !== creep.memory.targetRoom) {
  //         creep.moveTo(Game.flags[`${creep.memory.targetRoom}`]);
  //       } else {
  //         const target = Game.rooms[roomName]?.controller;
  //         if (target) {
  //           if (creep.reserveController(target) === ERR_NOT_IN_RANGE) {
  //             creep.moveTo(target);
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
};

const miniBody = [CARRY, CARRY, MOVE, CARRY, CARRY, MOVE];
const currentRoomTask = () => {
  // 最小组 (采矿和升级)
  const minCreepGroup = ['Room2MinHarvester1'];
  if (Game.rooms['E11N14'].memory.creeps?.['harvester']) return;

  minCreepGroup.forEach((creepName) => {
    const creep = Game.creeps[creepName];
    if (!creep) {
      const spawn = Object.values(Game.spawns).find((s: StructureSpawn) => s && !s.spawning);
      if (spawn) {
        spawn.spawnCreep(miniBody, creepName, {
          memory: { role: 'harvester' },
        });
        return;
      }
    }
  });
};

// const harvestTask = (creep: Creep) => {
//   // 2. 如果身上能量满了，且正在执行采集任务，则切换到存储任务
//   if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && creep.memory.task === 'harvesting') {
//     switch (creep.memory.role) {
//       case 'harvester':
//         creep.memory.task = 'transferring';
//         break;
//       case 'upgrader':
//         creep.memory.task = 'upgrading';
//         break;
//       case 'builder':
//         creep.memory.task = 'building';
//         break;
//       case 'repairer':
//         creep.memory.task = 'repairing';
//         break;
//       default:
//         break;
//     }
//   }

//   if (creep.memory.task === 'harvesting') {
//     if (creep.memory.role === 'pioneer') {
//       return;
//     }

//     if (creep.memory.role === 'builder' || creep.memory.role === 'repairer') {
//       // 优先捡地上的能量
//       const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
//         filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY),
//       });
//       if (dropped) {
//         if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(dropped);
//         }
//         return;
//       }

//       // store
//       const storeList = creep.room.find<StructureStorage>(FIND_MY_STRUCTURES, {
//         filter: (structure) => structure.structureType === STRUCTURE_STORAGE && structure.store.energy > 0,
//       });
//       if (storeList && storeList.length > 0) {
//         const targetStore = storeList[0];
//         if (creep.withdraw(targetStore, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(targetStore);
//           return;
//         }
//       }

//       // container
//       const containerList = creep.room.find(FIND_STRUCTURES, {
//         filter: (structure) =>
//           structure.structureType === STRUCTURE_CONTAINER &&
//           structure.store[RESOURCE_ENERGY] > creep.store.getFreeCapacity(RESOURCE_ENERGY),
//       });
//       if (containerList && containerList.length > 0) {
//         const targetContainer = containerList[0];
//         if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(targetContainer);
//           return;
//         }
//       }
//     }

//     let target = Game.getObjectById<Source>(SourceIds[0]);

//     if (creep.memory.role === 'harvester') {
//       // Room2MinHarvester3 专门去采矿
//       if (creep.name === 'Room2MinHarvester3') {
//         const ruinTarget = Game.getObjectById<Ruin>('6885ab6385e8d700124afca1');
//         if (ruinTarget && ruinTarget.store[RESOURCE_LEMERGIUM] > 0) {
//           if (creep.withdraw(ruinTarget, RESOURCE_LEMERGIUM) === ERR_NOT_IN_RANGE) {
//             creep.moveTo(ruinTarget);
//           }
//           return;
//         }
//       } else {
//         // 先检查周围是否有resource，如果有则直接采集
//         const resource = creep.room
//           .find(FIND_DROPPED_RESOURCES, {
//             filter: (resource) =>
//               resource.resourceType === RESOURCE_ENERGY &&
//               resource.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY),
//           })
//           .sort((a, b) => a.pos.getRangeTo(creep.pos) - b.pos.getRangeTo(creep.pos));
//         if (resource.length > 0 && creep.pickup(resource[0]) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(resource[0]);
//           return;
//         }
//         // 再检查周围Container是否已满，如果已满则直接采集
//         const container = creep.room
//           .find(FIND_STRUCTURES, {
//             filter: (structure) =>
//               structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 50,
//           })
//           .sort((a, b) => a.pos.getRangeTo(creep.pos) - b.pos.getRangeTo(creep.pos));

//         if (container.length > 0 && creep.withdraw(container[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(container[0]);
//           return;
//         }

//         if (!creep.body.some((part) => part.type === WORK)) {
//           return;
//         }
//       }
//     }

//     if (creep.memory.role === 'upgrader' || creep.memory.role === 'miner') {
//       if (creep.name === 'Room2MinMiner') {
//         target = Game.getObjectById<Source>(SourceIds[0]);
//       } else {
//         target = Game.getObjectById<Source>(SourceIds[1]);
//       }
//     }

//     if (creep.memory.role === 'upgrader') {
//       const containerTarget = creep.pos.findInRange(FIND_STRUCTURES, 1, {
//         filter: (structure) => structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0,
//       });
//       if (containerTarget.length > 0) {
//         if (creep.withdraw(containerTarget[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(containerTarget[0]);
//         }
//         return;
//       }

//       const dropResource = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
//         filter: (resource) => resource.resourceType === RESOURCE_ENERGY,
//       });
//       if (dropResource.length > 0) {
//         if (creep.pickup(dropResource[0]) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(dropResource[0]);
//         }
//         return;
//       }
//     }

//     if (target) {
//       if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
//         creep.moveTo(target);
//       }
//     }
//   } else {
//     // 做自己的临时任务
//     switch (creep.memory.task) {
//       case 'mining':
//         miningTask(creep);
//         break;
//       case 'transferring':
//         transferTask(creep);
//         break;
//       case 'building':
//         buildTask(creep);
//         break;
//       case 'upgrading':
//         upgradeTask(creep);
//         break;
//       case 'repairing':
//         repairTask(creep);
//         break;
//       default:
//         break;
//     }
//   }
// };

// const miningTask = (creep: Creep) => {
//   const target = Game.getObjectById<Source>(SourceIds[1]);
//   if (!target) return;
//   if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
//     creep.moveTo(target);
//   }
// };

// const transferTask = (creep: Creep) => {
//   if (Game.time % 10 === 0) {
//     creep.memory.targetId === undefined;
//   }

//   if (creep.memory.targetId) {
//     const target = Game.getObjectById<Structure>(creep.memory.targetId);
//     if (target) {
//       const sourceType = creep.store.L ? RESOURCE_LEMERGIUM : RESOURCE_ENERGY;
//       const result = creep.transfer(target, sourceType);
//       if (result === ERR_NOT_IN_RANGE) {
//         creep.moveTo(target);
//       } else if (result === ERR_FULL) {
//         creep.memory.targetId = undefined;
//       }
//     } else {
//       creep.memory.targetId = undefined;
//     }
//   } else {
//     if (creep.name === 'Room2MinHarvester3') {
//       const target = Game.getObjectById<StructureStorage>('6887b391b77cbc0eb36d873c');
//       if (target) {
//         if (creep.transfer(target, RESOURCE_LEMERGIUM) === ERR_NOT_IN_RANGE) {
//           creep.moveTo(target);
//         }
//         return;
//       }
//     }

//     const targetUnits = creep.room.find(FIND_MY_STRUCTURES, {
//       filter: (structure) =>
//         (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
//         // || structure.structureType === STRUCTURE_STORAGE
//         structure.store.getFreeCapacity(RESOURCE_ENERGY),
//     });

//     if (targetUnits.length > 0) {
//       // 取最近的目标
//       const closestTarget = creep.pos.findClosestByPath(targetUnits);
//       if (closestTarget) {
//         creep.memory.targetId = closestTarget.id;
//       }
//     }
//   }
// };

// const upgradeTask = (creep: Creep) => {
//   const controller = creep.room.controller;
//   if (controller) {
//     if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
//       creep.moveTo(controller);
//     }
//   }
// };

// const buildTask = (creep: Creep) => {
//   const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
//   if (target) {
//     if (creep.build(target) === ERR_NOT_IN_RANGE) {
//       creep.moveTo(target);
//     }
//   } else {
//     // 没有建筑就给塔传能量
//     const towers = creep.room.find(FIND_MY_STRUCTURES, {
//       filter: (structure) =>
//         structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
//     }) as StructureTower[];
//     if (towers.length > 0) {
//       const tower = towers[0];
//       if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//         creep.moveTo(tower);
//       }
//       return;
//     }

//     // 没有就修建筑
//     repairTask(creep);
//   }
// };

// const repairTask = (creep: Creep) => {
//   const damagedStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
//     filter: (structure) => {
//       if (structure.structureType === STRUCTURE_WALL) {
//         return structure.hits < 100000;
//       } else if (structure.structureType === STRUCTURE_RAMPART) {
//         return structure.hits < 100000;
//       }
//       return structure.hits < structure.hitsMax;
//     },
//   });
//   if (damagedStructure) {
//     if (creep.repair(damagedStructure) === ERR_NOT_IN_RANGE) {
//       creep.moveTo(damagedStructure, { visualizePathStyle: { stroke: '#ffffff' } });
//     }
//   }

//   // // 优先给炮台能量
//   // const towers = creep.room
//   //   .find<StructureTower>(FIND_MY_STRUCTURES, {
//   //     filter: (structure) =>
//   //       structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
//   //   })
//   //   .sort((a, b) => a.store.energy - b.store.energy);
//   // if (towers.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
//   //   const tower = creep.pos.findClosestByPath(towers);
//   //   if (tower) {
//   //     if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//   //       creep.moveTo(tower, { visualizePathStyle: { stroke: '#00ffff' } });
//   //     }
//   //     return;
//   //   }
//   // }

//   // // 优先修理受损的墙和rampart
//   // let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
//   //   filter: (structure) =>
//   //     // structure.structureType === STRUCTURE_WALL ||
//   //     structure.structureType === STRUCTURE_RAMPART && structure.hits < structure.hitsMax * 0.01, // 只修非常低血量的墙和rampart
//   // });

//   // // 如果没有极低血量的墙或rampart，则修理血量最低的墙或rampart
//   // if (!target) {
//   //   const wallsAndRamparts = creep.room.find(FIND_STRUCTURES, {
//   //     filter: (structure) =>
//   //       (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) &&
//   //       structure.hits < structure.hitsMax,
//   //   });
//   //   if (wallsAndRamparts.length > 0) {
//   //     // 按血量升序
//   //     wallsAndRamparts.sort((a, b) => a.hits - b.hits);
//   //     target = wallsAndRamparts[0];
//   //   }
//   // }

//   // if (target) {
//   //   if (creep.repair(target) === ERR_NOT_IN_RANGE) {
//   //     creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
//   //   }
//   // } else {
//   //   // 没有需要修理的墙或rampart，尝试修理其他建筑

//   // }
// };

// 塔自动攻击
// const autoAttackWithTowers = (room: Room) => {
//   const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, {
//     filter: (structure) => structure.structureType === STRUCTURE_TOWER,
//   }) as StructureTower[];

//   if (towers.length === 0) return;

//   // 寻找最近的敌人
//   const hostile = room.find(FIND_HOSTILE_CREEPS)[0];
//   if (hostile) {
//     for (const tower of towers) {
//       tower.attack(hostile);
//     }
//     return;
//   }

//   // 治疗队友
//   for (const tower of towers) {
//     if (tower.store[RESOURCE_ENERGY] > tower.store.getCapacity(RESOURCE_ENERGY) * 0.3) {
//       const damagedCreeps = room.find(FIND_MY_CREEPS, {
//         filter: (creep) => creep.hits < creep.hitsMax,
//       });
//       if (damagedCreeps.length > 0) {
//         for (const tower of towers) {
//           tower.heal(damagedCreeps[0]);
//         }
//       }
//     }
//     return;
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
//       const body = generatorRoleBody([
//         { body: MOVE, count: 1 },
//         { body: ATTACK, count: 2 },
//         { body: RANGED_ATTACK, count: 2 },
//       ]);
//       // 生成creep
//       const spawn = Game.spawns[BASE_ID_ENUM.MainBase];
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
//     { x: 32, y: 0 },
//     { x: 49, y: 16 },
//   ];

//   attackers.forEach((attacker, index) => {
//     if (!attacker) return;
//     // 如果attacker不在边界则向边界移动
//     if (attacker.pos.x !== 0 && attacker.pos.x !== 49 && attacker.pos.y !== 0 && attacker.pos.y !== 49) {
//       attacker.moveTo(fixPos[index].x, fixPos[index].y);
//     }
//     const hostile = attacker.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
//     if (hostile.length > 0) {
//       attacker.attack(hostile[0]);
//       attacker.rangedAttack(hostile[0]);
//     }
//   });
// };
