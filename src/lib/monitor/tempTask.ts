import { ROOM_ID_ENUM } from '@/constant';
import { generatorRoleBody } from '@/utils';

// 临时脚本任务
export const tempScriptTask = () => {
  // const targetCreepList = [
  //   Game.creeps['MinPioneer3'],
  //   Game.creeps['MinPioneer7'],
  //   Game.creeps['MinPioneer8'],
  //   Game.creeps['MinPioneer9'],
  // ];
  // targetCreepList.forEach((creep) => {
  //   if (creep) mainRoomTask(creep);
  // });
  // 本房间自己的临时任务
  currentRoomTask();
  autoAttackWithTowers(Game.rooms[ROOM_ID_ENUM.MainRoom]);
  return true;
};

const SourceIds = ['5bbcad8e9099fc012e63770b', '5bbcad8e9099fc012e63770a'];

const miniBody = [WORK, CARRY, CARRY, MOVE, MOVE];

const currentRoomTask = () => {
  // 最小组 (采矿和升级)
  const minCreepGroup = ['Room2MinHarvester1'];
  const minCreepGroup2 = [
    'Room2MinMiner',
    'Room2MinMiner2',
    'Room2MinHarvester2',
    'Room2MinUpgrader',
    'Room2MinRepairer',
    // 'Room2MinRepairer2',
    'Room2MinBuilder',
    // 'Room2MinBuilder2',
    // 'Room2MinBuilder3',
    // 'Room2MinBuilder4',
    'Room2MinUpgrader2',
    'Room2MinUpgrader3',
    'Room2MinUpgrader4',
    // 'Room2MinHarvester3',
    // 'Room2MinUpgrader5',
    // 'Room2MinUpgrader6',
    // 'Room2MinUpgrader7',
    // 'Room2MinUpgrader8',
    // 'Room2MinUpgrader9',
  ];

  minCreepGroup.forEach((creepName) => {
    const creep = Game.creeps[creepName];
    if (!creep) {
      const spawn = Game.spawns['Spawn1'];
      spawn.spawnCreep(miniBody, creepName, {
        memory: {
          role: 'harvester',
          task: 'harvesting',
        },
      });
      return;
    }
  });

  for (const creepName of minCreepGroup2) {
    const creep = Game.creeps[creepName];
    if (!creep) {
      // 如果creep不存在，则尝试在Spawn1基地造
      const spawn = Game.spawns['Spawn1'];
      if (spawn && spawn.spawning == null) {
        // 判断能否造出Harvester或Upgrader
        let role: string;
        if (creepName.includes('Harvester')) {
          role = 'harvester';
        } else if (creepName.includes('Upgrader')) {
          role = 'upgrader';
        } else if (creepName.includes('Builder')) {
          role = 'builder';
        } else if (creepName.includes('Miner')) {
          role = 'miner';
        } else if (creepName.includes('Repairer')) {
          role = 'repairer';
        } else {
          continue;
        }
        // TODO: 替换，造一个基础body
        let body: BodyPartConstant[] = generatorRoleBody([
          { body: WORK, count: 6 },
          { body: CARRY, count: 7 },
          { body: MOVE, count: 7 },
        ]);
        if (creepName.includes('MinMiner')) {
          body = generatorRoleBody([
            { body: WORK, count: 6 },
            { body: MOVE, count: 3 },
          ]);
        }

        if (creepName.includes('MinHarvester')) {
          body = generatorRoleBody([
            { body: WORK, count: 0 },
            { body: CARRY, count: 16 },
            { body: MOVE, count: 8 },
          ]);
        }
        // if (creepName.includes('MinRepairer')) {
        //   body = generatorRoleBody([
        //     { body: WORK, count: 2 },
        //     { body: CARRY, count: 10 },
        //     { body: MOVE, count: 6 },
        //   ]);
        // }

        const memoryOpts: any = {};
        if (role === 'harvester') {
          memoryOpts.task = 'harvesting';
        } else if (role === 'upgrader') {
          memoryOpts.task = 'upgrading';
        } else if (role === 'builder') {
          memoryOpts.task = 'building';
        } else if (role === 'miner') {
          memoryOpts.task = 'mining';
        } else if (role === 'repairing') {
          memoryOpts.task = 'repairing';
        }
        memoryOpts.role = role as CustomRoleType;
        const result = spawn.spawnCreep(body, creepName, { memory: memoryOpts });
        if (result === OK) {
          console.log(`[临时任务] 在Spawn1造出 ${creepName} (${role})`);
        }
      }
      break;
    }
  }

  const allCreepInRoom = Object.values(Game.creeps).filter(
    (creep) => creep.room.name === ROOM_ID_ENUM.MainRoom && creep.name.includes('Min')
  );
  for (const creep of allCreepInRoom) {
    // 1. 如果身上没有能量，且正在没有执行采集任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 如果creep存在，则执行任务
    switch (creep.memory.task) {
      case 'harvesting':
        harvestTask(creep);
        break;
      case 'transferring':
        transferTask(creep);
        break;
      case 'upgrading':
        upgradeTask(creep);
        break;
      case 'building':
        buildTask(creep);
        break;
      case 'mining':
        miningTask(creep);
        break;
      case 'repairing':
        repairTask(creep);
        break;
      default:
        break;
    }
  }
};

const harvestTask = (creep: Creep) => {
  // 2. 如果身上能量满了，且正在执行采集任务，则切换到存储任务
  if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
    switch (creep.memory.role) {
      case 'harvester':
        creep.memory.task = 'transferring';
        break;
      case 'upgrader':
        creep.memory.task = 'upgrading';
        break;
      case 'builder':
        creep.memory.task = 'building';
        break;
      case 'repairer':
        creep.memory.task = 'repairing';
        break;
      default:
        break;
    }
  }

  if (creep.memory.task === 'harvesting') {
    if (creep.memory.role === 'pioneer') {
      return;
    }

    if (creep.memory.role === 'builder' || creep.memory.role === 'repairer') {
      // 优先捡地上的能量
      const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > creep.store.getFreeCapacity(),
      });
      if (dropped) {
        if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
          creep.moveTo(dropped);
        }
        return;
      }

      // store
      const storeList = creep.room.find<StructureStorage>(FIND_MY_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_STORAGE && structure.store.energy > 0,
      });
      if (storeList && storeList.length > 0) {
        const targetStore = storeList[0];
        if (creep.withdraw(targetStore, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targetStore);
          return;
        }
      }

      // container
      const containerList = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) =>
          structure.structureType === STRUCTURE_CONTAINER &&
          structure.store[RESOURCE_ENERGY] > creep.store.getFreeCapacity(),
      });
      if (containerList && containerList.length > 0) {
        const targetContainer = containerList[0];
        if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targetContainer);
          return;
        }
      }
    }

    let target = Game.getObjectById<Source>(SourceIds[0]);

    if (creep.memory.role === 'harvester') {
      // Room2MinHarvester3 专门去采矿
      if (creep.name === 'Room2MinHarvester3') {
        const ruinTarget = Game.getObjectById<Ruin>('6885ab6385e8d700124afca1');
        if (ruinTarget && ruinTarget.store[RESOURCE_LEMERGIUM] > 0) {
          if (creep.withdraw(ruinTarget, RESOURCE_LEMERGIUM) === ERR_NOT_IN_RANGE) {
            creep.moveTo(ruinTarget);
          }
          return;
        }
      } else {
        // 先检查周围是否有resource，如果有则直接采集
        const resource = creep.room
          .find(FIND_DROPPED_RESOURCES, {
            filter: (resource) =>
              resource.resourceType === RESOURCE_ENERGY && resource.amount > creep.store.getFreeCapacity(),
          })
          .sort((a, b) => a.pos.getRangeTo(creep.pos) - b.pos.getRangeTo(creep.pos));
        if (resource.length > 0 && creep.pickup(resource[0]) === ERR_NOT_IN_RANGE) {
          creep.moveTo(resource[0]);
          return;
        }
        // 再检查周围Container是否已满，如果已满则直接采集
        const container = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) =>
            structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 50,
        });
        if (container.length > 0 && creep.withdraw(container[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(container[0]);
          return;
        }

        if (!creep.body.some((part) => part.type === WORK)) {
          return;
        }
      }
    }

    if (creep.memory.role === 'upgrader' || creep.memory.role === 'miner') {
      if (creep.name === 'Room2MinMiner') {
        target = Game.getObjectById<Source>(SourceIds[0]);
      } else {
        target = Game.getObjectById<Source>(SourceIds[1]);
      }
    }

    if (creep.memory.role === 'upgrader') {
      const containerTarget = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0,
      });
      if (containerTarget.length > 0) {
        if (creep.withdraw(containerTarget[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(containerTarget[0]);
        }
        return;
      }

      const dropResource = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
        filter: (resource) => resource.resourceType === RESOURCE_ENERGY,
      });
      if (dropResource.length > 0) {
        if (creep.pickup(dropResource[0]) === ERR_NOT_IN_RANGE) {
          creep.moveTo(dropResource[0]);
        }
        return;
      }
    }

    if (target) {
      if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }
  } else {
    // 做自己的临时任务
    switch (creep.memory.task) {
      case 'mining':
        miningTask(creep);
        break;
      case 'transferring':
        transferTask(creep);
        break;
      case 'building':
        buildTask(creep);
        break;
      case 'upgrading':
        upgradeTask(creep);
        break;
      case 'repairing':
        repairTask(creep);
        break;
      default:
        break;
    }
  }
};

const miningTask = (creep: Creep) => {
  const target = Game.getObjectById<Source>(SourceIds[1]);
  if (!target) return;
  if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
  }
};

const transferTask = (creep: Creep) => {
  if (Game.time % 10 === 0) {
    creep.memory.targetId === undefined;
  }

  if (creep.memory.targetId) {
    const target = Game.getObjectById<Structure>(creep.memory.targetId);
    if (target) {
      const sourceType = creep.store.L ? RESOURCE_LEMERGIUM : RESOURCE_ENERGY;
      const result = creep.transfer(target, sourceType);
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      } else if (result === ERR_FULL) {
        creep.memory.targetId = undefined;
      }
    } else {
      creep.memory.targetId = undefined;
    }
  } else {
    if (creep.name === 'Room2MinHarvester3') {
      const target = Game.getObjectById<StructureStorage>('6887b391b77cbc0eb36d873c');
      if (target) {
        if (creep.transfer(target, RESOURCE_LEMERGIUM) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        return;
      }
    }

    const targetUnits = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
        // || structure.structureType === STRUCTURE_STORAGE
        structure.store.getFreeCapacity(RESOURCE_ENERGY),
    });

    if (targetUnits.length > 0) {
      // 取最近的目标
      const closestTarget = creep.pos.findClosestByPath(targetUnits);
      if (closestTarget) {
        creep.memory.targetId = closestTarget.id;
      }
    }
  }
};

const upgradeTask = (creep: Creep) => {
  const controller = creep.room.controller;
  if (controller) {
    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
  }
};

const buildTask = (creep: Creep) => {
  const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (target) {
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
  } else {
    // 没有建筑就给塔传能量
    const towers = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (structure) =>
        structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    }) as StructureTower[];
    if (towers.length > 0) {
      const tower = towers[0];
      if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(tower);
      }
      return;
    }

    // 没有就修建筑
    repairTask(creep);
  }
};

const repairTask = (creep: Creep) => {
  const damagedStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) => {
      if (structure.structureType === STRUCTURE_WALL) {
        return structure.hits < 100000;
      } else if (structure.structureType === STRUCTURE_RAMPART) {
        return structure.hits < 100000;
      }
      return structure.hits < structure.hitsMax;
    },
  });
  if (damagedStructure) {
    if (creep.repair(damagedStructure) === ERR_NOT_IN_RANGE) {
      creep.moveTo(damagedStructure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  // // 优先给炮台能量
  // const towers = creep.room
  //   .find<StructureTower>(FIND_MY_STRUCTURES, {
  //     filter: (structure) =>
  //       structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  //   })
  //   .sort((a, b) => a.store.energy - b.store.energy);
  // if (towers.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
  //   const tower = creep.pos.findClosestByPath(towers);
  //   if (tower) {
  //     if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
  //       creep.moveTo(tower, { visualizePathStyle: { stroke: '#00ffff' } });
  //     }
  //     return;
  //   }
  // }

  // // 优先修理受损的墙和rampart
  // let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
  //   filter: (structure) =>
  //     // structure.structureType === STRUCTURE_WALL ||
  //     structure.structureType === STRUCTURE_RAMPART && structure.hits < structure.hitsMax * 0.01, // 只修非常低血量的墙和rampart
  // });

  // // 如果没有极低血量的墙或rampart，则修理血量最低的墙或rampart
  // if (!target) {
  //   const wallsAndRamparts = creep.room.find(FIND_STRUCTURES, {
  //     filter: (structure) =>
  //       (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) &&
  //       structure.hits < structure.hitsMax,
  //   });
  //   if (wallsAndRamparts.length > 0) {
  //     // 按血量升序
  //     wallsAndRamparts.sort((a, b) => a.hits - b.hits);
  //     target = wallsAndRamparts[0];
  //   }
  // }

  // if (target) {
  //   if (creep.repair(target) === ERR_NOT_IN_RANGE) {
  //     creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
  //   }
  // } else {
  //   // 没有需要修理的墙或rampart，尝试修理其他建筑

  // }
};

// 塔自动攻击
const autoAttackWithTowers = (room: Room) => {
  const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, {
    filter: (structure) => structure.structureType === STRUCTURE_TOWER,
  }) as StructureTower[];

  if (towers.length === 0) return;

  // 寻找最近的敌人
  const hostile = room.find(FIND_HOSTILE_CREEPS)[0];
  if (hostile) {
    for (const tower of towers) {
      tower.attack(hostile);
    }
  }
};
