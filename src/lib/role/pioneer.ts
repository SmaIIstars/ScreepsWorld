import { BASE_ID_ENUM, ROOM_ID_ENUM } from '@/constant';
import { generatorRoleBody } from '@/utils';

class Pioneer {
  static readonly role: Extract<CustomRoleType, 'pioneer'> = 'pioneer';

  create = (targetRoom: string, creepName: string) => {
    const curName = creepName;
    return Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
      generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 30 },
        { body: MOVE, count: 16 },
      ]),
      curName,
      {
        memory: {
          role: 'pioneer',
          task: 'harvesting',
          targetRoom,
        },
      }
    );
  };

  run(creep: Creep): void {
    // 1. 如果身上没有能量，且正在执行探索任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'pioneering';
    }

    if (creep.memory.task === 'harvesting') {
      this.harvestingTask(creep);
    }
    this.buildingTask(creep);
    if (creep.memory.task === 'pioneering') {
      this.roleTask(creep);
    }
  }

  // 找目标房间 + 采集任务
  harvestingTask(creep: Creep): void {
    let targetRoom: Room | null = null;
    // 1. 先判断是否有目标房间 且 房间可见
    if (creep.memory.targetRoom && Game.rooms[creep.memory.targetRoom]) {
      targetRoom = Game.rooms[creep.memory.targetRoom];
    } else {
      // 没有目标房间则寻找目标房间旗
      if (!creep.memory.targetRoom) return;
      const targetRoomFlag = Game.flags[creep.memory.targetRoom];
      if (!targetRoomFlag) return;
      // 如果目标房间旗存在且房间不可见，则向旗子移动
      if (!targetRoomFlag.room) {
        creep.moveTo(targetRoomFlag);
        return;
      } else {
        // 一直到房间可见
        targetRoom = targetRoomFlag.room;
      }
    }

    // 找到目标房间
    if (targetRoom) {
      if (creep.room.name === targetRoom.name) {
        // 在目标房间，查找能量源
        // 1. 先查找掉落资源
        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES, {
          filter: (resource) => resource.resourceType === RESOURCE_ENERGY,
        });
        if (droppedResources.length) {
          const targetResource = creep.pos.findClosestByPath(droppedResources);
          if (targetResource) {
            if (creep.pickup(targetResource) === ERR_NOT_IN_RANGE) {
              creep.moveTo(targetResource);
            }
            return;
          }
        }
        // 2. 查找有能量的建筑
        const containers = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            if (
              structure instanceof StructureContainer ||
              structure instanceof StructureStorage ||
              structure instanceof StructureTerminal ||
              structure instanceof StructureLink ||
              structure instanceof StructureNuker ||
              structure instanceof StructureTower ||
              structure instanceof StructurePowerSpawn ||
              structure instanceof StructureLab ||
              structure instanceof StructureFactory
            ) {
              if (!structure.store) return false;
              return structure.store[RESOURCE_ENERGY] > 0;
              // let totalAmount = 0;
              // for (const resourceType of Object.keys(structure.store)) {
              //   totalAmount += structure.store[resourceType as ResourceConstant];
              // }
              // return totalAmount > 0;
            }
            return false;
          },
        });
        if (containers.length) {
          const targetContainer = creep.pos.findClosestByPath(containers);
          if (targetContainer && 'store' in targetContainer) {
            for (const resourceType of Object.keys(targetContainer.store)) {
              if (creep.withdraw(targetContainer, resourceType as ResourceConstant) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetContainer);
              }
            }
            return;
          }
        }

        // 3. 自己挖
        const sources = creep.room.find(FIND_SOURCES);
        if (sources.length) {
          const targetSource = creep.pos.findClosestByPath(sources, {
            filter: (source) => source.energy > 0,
          });
          if (targetSource) {
            if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
              creep.moveTo(targetSource);
            }
            return;
          }
        }
      } else {
        // 先去目标房间
        creep.moveTo(targetRoom.controller!);
      }
      // 设置targetRoomName
      creep.memory.targetRoom = targetRoom.name;
    }
  }

  buildingTask(creep: Creep): void {
    const roads = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_ROAD || structure.structureType === STRUCTURE_CONTAINER) &&
        structure.hits < structure.hitsMax,
    });

    const constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);

    // 边走边修
    if (constructionSites.length) {
      creep.build(constructionSites[0]);
    }
    if (roads.length) {
      creep.repair(roads[0]);
    }
  }

  // 侦查任务
  roleTask(creep: Creep): void {
    // 满能源，则返回主房间
    if (creep.room.name === ROOM_ID_ENUM.MainRoom) {
      // 1. 找到storage
      const storage = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_STORAGE,
      })[0];

      if (storage) {
        if (!storage.pos.isNearTo(creep)) {
          creep.moveTo(storage);
        } else {
          for (const resourceType of Object.keys(creep.store)) {
            if (creep.store[resourceType as ResourceConstant] > 0) {
              creep.transfer(storage, resourceType as ResourceConstant);
            }
          }
        }
      }

      return;
    } else {
      creep.moveTo(Game.spawns[BASE_ID_ENUM.MainBase]);
    }
  }
}

export default new Pioneer();
