import { ROOM_ID_ENUM } from '@/constant';

const generatorRoleBody = (bodyWidgetConfig: { body: BodyPartConstant; count: number }[]) => {
  // flatMap 不兼容 es2019
  // bodyWidgetConfig.flatMap(({ body, count }) => Array(count).fill(body));
  return bodyWidgetConfig.reduce<BodyPartConstant[]>((acc, { body, count }) => {
    return acc.concat(Array(count).fill(body));
  }, []);
};

// 临时脚本任务
export const tempScriptTask = () => {
  // if (creep.name === 'MinPioneer8' || creep.name === 'MinPioneer9') {
  // mainRoomTask(creep);
  // } else {
  // 本房间自己的临时任务
  currentRoomTask();
  // }
  autoTowerDefend(Game.rooms[ROOM_ID_ENUM.MainRoom2]);
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
    'Room2MinMiner',
    'Room2MinMiner2',
    'Room2MinUpgrader',
    'Room2MinRepairer',
    'Room2MinBuilder',
    'Room2MinBuilder2',
    'Room2MinBuilder3',
    'Room2MinHarvester2',
    'Room2MinUpgrader2',
    'Room2MinUpgrader3',
    'Room2MinUpgrader4',
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
        } else if (creepName.includes('Miner')) {
          role = 'miner';
        } else if (creepName.includes('Repairer')) {
          role = 'repairer';
        } else {
          continue;
        }
        // TODO: 替换，造一个基础body

        let body: BodyPartConstant[] = generatorRoleBody([
          { body: WORK, count: 4 },
          { body: CARRY, count: 6 },
          { body: MOVE, count: 5 },
        ]);
        if (creepName.includes('MinMiner')) {
          body = generatorRoleBody([
            { body: WORK, count: 6 },
            { body: MOVE, count: 3 },
          ]);
        }

        if (creepName.includes('MinHarvester')) {
          body = generatorRoleBody([
            { body: WORK, count: 2 },
            { body: CARRY, count: 7 },
            { body: MOVE, count: 5 },
          ]);
        }

        const memoryOpts: { role?: CustomRoleType; task?: CustomRoleTaskType } = {};
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
          console.log(`[临时任务] 在Spawn2造出 ${creepName} (${role})`);
        }
      }
      break;
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
    let target = Game.getObjectById<Source>(SourceIds[0]);

    if (creep.memory.role === 'harvester') {
      // 先检查周围是否有resource，如果有则直接采集
      const resource = creep.room
        .find(FIND_DROPPED_RESOURCES, {
          filter: (resource) => resource.resourceType === RESOURCE_ENERGY,
        })
        .sort((a, b) => a.pos.getRangeTo(creep.pos) - b.pos.getRangeTo(creep.pos));
      if (resource.length > 0 && creep.pickup(resource[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(resource[0]);
        return;
      }
      // 再检查周围Container是否已满，如果已满则直接采集
      const container = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0,
      });
      if (container.length > 0 && creep.withdraw(container[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(container[0]);
        return;
      }
    }

    if (creep.memory.role === 'upgrader' || creep.memory.role === 'miner') {
      if (creep.name === 'Room2MinMiner2') {
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
        (structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_SPAWN ||
          structure.structureType === STRUCTURE_STORAGE) &&
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

const repairTask = (creep: Creep) => {
  // 专门给塔传能量
  const towers = creep.room.find(FIND_MY_STRUCTURES, {
    filter: (structure) =>
      structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  }) as StructureTower[];
  if (towers.length > 0) {
    const tower = towers[0];
    if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(tower);
    }
  }
};

/**
 * 自动防御塔逻辑：自动攻击敌人、修理己方建筑、为己方creep治疗
 * @param room 需要自动防御的房间
 */
const autoTowerDefend = (room: Room) => {
  const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, {
    filter: (s): s is StructureTower => s.structureType === STRUCTURE_TOWER,
  });

  for (const tower of towers) {
    // 1. 优先攻击敌人
    const hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (hostile) {
      tower.attack(hostile);
      continue;
    }

    // 2. 治疗受伤的友方creep
    const injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: (c) => c.hits < c.hitsMax,
    });
    if (injured) {
      tower.heal(injured);
      continue;
    }

    // 3. 修理受损的建筑（不修墙和rampart，防止浪费能量）
    const damagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART,
    });
    if (damagedStructure) {
      tower.repair(damagedStructure);
    }
  }
};
