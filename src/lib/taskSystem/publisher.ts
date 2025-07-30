import { EnergyStoreTargetType } from '@/constant';
import { HarvestingPayload, Task, TaskMap, TaskPublisherType, TaskStatusEnum } from '@/lib/utils/taskMap';
import { AllStoreStructure } from '@/types';

/**
 * 任务发布器
 * 负责根据房间状态发布各种任务
 */
export class TaskPublisher {
  private taskMap: TaskMap;

  constructor(taskMap: TaskMap) {
    this.taskMap = taskMap;
  }

  /**
   * 发布任务
   * @param room 房间对象
   */
  publishTasks(room: Room): void {
    this.publishHarvestTasks(room);
    this.publishUpgradeTasks(room);
    this.publishBuildTasks(room);
    this.publishRepairTasks(room);
    this.publishTransferTasks(room);
  }

  /**
   * 发布采集任务
   */
  private publishHarvestTasks(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory?.sources) return;

    // 资源开采类
    // 遍历所有资源类型并处理
    Object.entries(roomMemory.sources).forEach(([type, ids]) => {
      if (!ids) return;
      ids.forEach((id) => {
        const target = Game.getObjectById<Source | Resource | Ruin | Tombstone | Mineral>(id);
        // Mineral 暂不可采集
        if (target instanceof Mineral) return;
        if (!target) return;
        const roles = ['source', 'mineral'].includes(type) ? ['miner', 'harvester'] : ['harvester'];
        this.createHarvestTask(target, room, roles);
      });
    });

    // 存储容器获取类
    const sourceStores: (StructureContainer | StructureStorage | StructureTerminal)[] = room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        if (structure.structureType === STRUCTURE_CONTAINER) return true;
        if (structure.structureType === STRUCTURE_STORAGE) return true;
        if (structure.structureType === STRUCTURE_TERMINAL) return true;
        return false;
      },
    });
    sourceStores.forEach((structure) => {
      this.createHarvestTask(structure, room, ['harvester']);
    });
  }

  /**
   * 创建采集任务
   */
  private createHarvestTask(
    target:
      | Source
      | Resource
      | Ruin
      | Tombstone
      | Mineral
      | StructureContainer
      | StructureStorage
      | StructureTerminal
      | StructureLink,
    room: Room,
    allowedRoles: string[]
  ): void {
    const taskId = `harvest_${target.id}`;
    if (this.taskMap.hasTask(taskId)) return;

    const payload: HarvestingPayload = {};
    let publisherType: TaskPublisherType = LOOK_SOURCES;
    if (target instanceof Source) {
      payload[RESOURCE_ENERGY] = target.energy;
      publisherType = LOOK_SOURCES;
    } else if (target instanceof Resource) {
      publisherType = LOOK_RESOURCES;
      payload[target.resourceType] = target.amount;
    } else if (target instanceof Mineral) {
      publisherType = LOOK_MINERALS;
      payload[target.mineralType] = target.mineralAmount;
    } else if (
      target instanceof Ruin ||
      target instanceof Tombstone ||
      target instanceof StructureContainer ||
      target instanceof StructureStorage ||
      target instanceof StructureTerminal ||
      target instanceof StructureLink
    ) {
      if (target instanceof Ruin) {
        publisherType = LOOK_RUINS;
      } else if (target instanceof Tombstone) {
        publisherType = LOOK_TOMBSTONES;
      } else if (target instanceof StructureContainer) {
        publisherType = STRUCTURE_CONTAINER;
      } else if (target instanceof StructureStorage) {
        publisherType = STRUCTURE_STORAGE;
      } else if (target instanceof StructureTerminal) {
        publisherType = STRUCTURE_TERMINAL;
      } else if (target instanceof StructureLink) {
        publisherType = STRUCTURE_LINK;
      }

      for (const resourceType in target.store) {
        payload[resourceType as ResourceConstant] = target.store[resourceType as ResourceConstant];
      }
    }

    const hasSource = Object.values(payload).reduce((a, b) => a + b, 0) > 0;

    if (this.taskMap.hasTask(taskId)) {
      if (hasSource) {
        this.taskMap.updateTask(taskId, { status: TaskStatusEnum.completed });
      } else {
        this.taskMap.updateTask(taskId, { payload });
      }
    } else {
      if (hasSource) {
        const task: Task<'harvesting'> = {
          id: taskId,
          publisherType,
          publisher: target.id,
          type: 'harvesting',
          toId: target.id,
          allowedCreepRoles: allowedRoles,
          payload,
          timestamp: Game.time,
          status: TaskStatusEnum.published,
          room: room.name,
          needCreepCount: 1,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布升级任务
   */
  private publishUpgradeTasks(room: Room): void {
    if (room.controller && room.controller.my) {
      const taskId = `upgrade_${room.controller.id}`;

      if (!this.taskMap.hasTask(taskId)) {
        const task: Task<'upgrading'> = {
          id: taskId,
          type: 'upgrading',
          publisherType: STRUCTURE_CONTROLLER,
          publisher: room.controller.id,
          toId: room.controller.id,
          allowedCreepRoles: ['upgrader'],
          payload: {
            progress: room.controller.progress,
            progressTotal: room.controller.progressTotal,
            level: room.controller.level,
          },
          room: room.name,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布建造任务
   */
  private publishBuildTasks(room: Room): void {
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

    for (const site of constructionSites) {
      const taskId = `build_${site.id}`;

      if (!this.taskMap.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          publisherType: site.structureType,
          type: 'building',
          publisher: site.id,
          toId: site.id,
          allowedCreepRoles: ['builder'],
          payload: {
            structureType: site.structureType,
            progress: site.progress,
            progressTotal: site.progressTotal,
          },
          room: room.name,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布维修任务
   */
  private publishRepairTasks(room: Room): void {
    const structures = room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        //  return (
        //   structure.hits < structure.hitsMax * 0.6 &&
        //   structure.structureType !== STRUCTURE_WALL &&
        //   structure.structureType !== STRUCTURE_RAMPART
        // );
        if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
          return structure.hits < 300000;
        } else {
          return structure.hits < structure.hitsMax * 0.6;
        }
      },
    });

    for (const structure of structures) {
      const taskId = `repair_${structure.id}`;

      if (!this.taskMap.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'repairing',
          publisherType: structure.structureType,
          publisher: structure.id,
          toId: structure.id,
          allowedCreepRoles: ['repairer', 'builder'],
          payload: {
            structureType: structure.structureType,
            hits: structure.hits,
            hitsMax: structure.hitsMax,
          },
          room: room.name,
        };

        this.taskMap.publish(task);
      }
    }
  }

  /**
   * 发布传输任务
   */
  private publishTransferTasks(room: Room): void {
    // TODO:可以优化只遍历一次就确定类型，使用一个Map存储，减少后续发布任务再遍历判断
    const allStoreStructures = room.find<AllStoreStructure>(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        if (
          [STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_STORAGE].some(
            (type) => structure.structureType === type
          )
        ) {
          return true;
        }

        // if (structure instanceof StructureLink) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        // if (structure instanceof StructureTerminal) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        // if (structure instanceof StructureLab) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        // if (structure instanceof StructureNuker) return structure.store.getFreeCapacity(RESOURCE_ENERGY);
        return false;
      },
    });

    // 遍历所有存储结构并发布传输任务
    for (const structure of allStoreStructures) {
      const taskId = `transfer_${structure.id}`;
      const freeCapacity = structure.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

      if (this.taskMap.hasTask(taskId)) {
        if (freeCapacity === 0) {
          this.taskMap.updateTask(taskId, { status: TaskStatusEnum.completed });
        } else {
          const task = this.taskMap.get<'transferring'>(taskId);
          if (!task) continue;
          this.taskMap.updateTask(taskId, {
            payload: { ...task.payload, freeCapacity },
          });
        }
        continue;
      } else if (freeCapacity > 0) {
        let resourceTypes: ResourceConstant[] | undefined = undefined;
        if ([StructureTower, StructureSpawn, StructureExtension].some((type) => structure instanceof type)) {
          resourceTypes = [RESOURCE_ENERGY];
        }

        // 发布任务
        const task: Task<'transferring'> = {
          id: taskId,
          type: 'transferring',
          publisherType: structure.structureType,
          publisher: structure.id,
          toId: structure.id,
          allowedCreepRoles: ['harvester'],
          payload: { resourceTypes, freeCapacity },
          timestamp: Game.time,
          status: TaskStatusEnum.published,
          room: room.name,
        };

        this.taskMap.publish(task);
      }
    }
  }
}
