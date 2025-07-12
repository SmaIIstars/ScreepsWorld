import { ROOM_ID_ENUM } from '@/constant';

// 临时脚本任务
export const tempScriptTask = () => {
  // if (creep.name === 'MinPioneer8' || creep.name === 'MinPioneer9') {
  // mainRoomTask(creep);
  // } else {
  // 本房间自己的临时任务
  currentRoomTask();
  // }

  return true;
};

const mainRoomTask = (creep: Creep) => {
  // 主基地的 Pioneer 支援
  if (creep.room.name !== Game.flags['room2'].room?.name) {
    creep.moveTo(Game.flags['room2']);
  } else {
    // 1. 如果身上没有能量，且正在执行修建或者维修任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了，且正在执行采集任务，则切换到修建任务
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'building';
    }

    if (creep.memory.task === 'building') {
      const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
      if (target) {
        if (target.pos.isNearTo(creep.pos)) {
          creep.build(target);
        } else {
          creep.moveTo(target);
        }
      }
    } else {
      const source = Game.getObjectById<Source>('5bbcaf8d9099fc012e63ac07');
      if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source);
        }
      }
    }
  }
};

const SourceIds = ['5bbcaf8d9099fc012e63ac07', '5bbcaf8d9099fc012e63ac08'];
// const PriorityQueueOfStoreEnergy: Array<Structure['structureType']> = [
//   STRUCTURE_EXTENSION,
//   STRUCTURE_SPAWN,
//   STRUCTURE_STORAGE,
//   STRUCTURE_CONTAINER,
// ];

const miniBody = [WORK, WORK, CARRY, MOVE];

const currentRoomTask = () => {
  // 最小组 (采矿和升级)
  const minCreepGroup = ['Room2MinHarvester1'];
  const minCreepGroup2 = [
    'Room2MinHarvester2',
    'Room2MinUpgrader',
    'Room2MinUpgrader2',
    'Room2MinUpgrader3',
    'Room2MinBuilder',
    'Room2MinBuilder2',
    'Room2MinBuilder3',
  ];

  const allMinCreep = [...minCreepGroup, ...minCreepGroup2];

  for (const creepName of allMinCreep) {
    const creep = Game.creeps[creepName];
    if (!creep) {
      // 如果creep不存在，则尝试在Spawn2基地造
      const spawn = Game.spawns['Spawn2'];
      if (spawn && spawn.spawning == null) {
        // 判断能否造出Harvester或Upgrader
        let role: string;
        if (creepName.includes('Harvester')) {
          role = 'harvester';
        } else if (creepName.includes('Upgrader')) {
          role = 'upgrader';
        } else if (creepName.includes('Builder')) {
          role = 'builder';
        } else {
          continue;
        }
        // 造一个基础body
        const body = minCreepGroup.includes(creepName) ? miniBody : [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
        const memoryOpts: { role?: CustomRoleType; task?: CustomRoleTaskType } = {};
        if (role === 'harvester') {
          memoryOpts.task = 'harvesting';
        } else if (role === 'upgrader') {
          memoryOpts.task = 'upgrading';
        } else if (role === 'builder') {
          memoryOpts.task = 'building';
        }
        memoryOpts.role = role as CustomRoleType;
        const result = spawn.spawnCreep(body, creepName, { memory: memoryOpts });
        if (result === OK) {
          console.log(`[临时任务] 在Spawn2造出 ${creepName} (${role})`);
        }
      }
    }
  }

  const allCreepInRoom = Object.values(Game.creeps).filter((creep) => creep.room.name === ROOM_ID_ENUM.MainRoom2);
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
      default:
        break;
    }
  }

  if (creep.memory.task === 'harvesting') {
    let target = Game.getObjectById<Source>(SourceIds[0]);

    if (creep.memory.role === 'upgrader') {
      target = Game.getObjectById<Source>(SourceIds[1]);
    }

    if (target) {
      if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }
  } else {
    // 做自己的临时任务
    switch (creep.memory.task) {
      case 'transferring':
        transferTask(creep);
        break;
      case 'building':
        buildTask(creep);
        break;
      case 'upgrading':
        upgradeTask(creep);
        break;
      default:
        break;
    }
  }
};

const transferTask = (creep: Creep) => {
  if (creep.memory.targetId) {
    const target = Game.getObjectById<Structure>(creep.memory.targetId);
    if (target) {
      const result = creep.transfer(target, RESOURCE_ENERGY);
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      } else if (result === ERR_FULL) {
        creep.memory.targetId = undefined;
      }
    } else {
      creep.memory.targetId = undefined;
    }
  } else {
    const targetUnits = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });
    if (targetUnits.length > 0) {
      creep.memory.targetId = targetUnits[0].id;
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
      // const repairTarget = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      //   filter: (structure) => structure.hits < structure.hitsMax && structure.structureType === STRUCTURE_ROAD,
      // });
      // if (repairTarget.length > 0) {
      //   creep.repair(repairTarget[0]);
      // }
    }
  }
};
