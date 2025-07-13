import { Task, TaskQueue } from '../utils/taskQueue';

/**
 * 任务发布器
 * 负责根据房间状态发布各种任务
 */
export class TaskPublisher {
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
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
    const sources = room.find(FIND_SOURCES);

    for (const source of sources) {
      if (source.energy > 0) {
        const taskId = `harvest_${source.id}`;

        if (!this.taskQueue.hasTask(taskId)) {
          const task: Task = {
            id: taskId,
            type: 'harvest',
            fromId: source.id,
            toId: '', // 采集不需要目标
            action: 'harvest',
            allowedCreepRoles: ['harvester', 'miner'],
            payload: {
              resourceType: RESOURCE_ENERGY,
              amount: source.energy,
            },
            timestamp: Game.time,
            status: 'published',
            room: room.name,
          };

          this.taskQueue.add(task);
        }
      }
    }
  }

  /**
   * 发布升级任务
   */
  private publishUpgradeTasks(room: Room): void {
    if (room.controller && room.controller.my) {
      const taskId = `upgrade_${room.controller.id}`;

      if (!this.taskQueue.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'upgrade',
          fromId: room.controller.id,
          toId: room.controller.id,
          action: 'upgradeController',
          allowedCreepRoles: ['upgrader'],
          payload: {
            progress: room.controller.progress,
            progressTotal: room.controller.progressTotal,
            level: room.controller.level,
          },
          timestamp: Game.time,
          status: 'published',
          room: room.name,
        };

        this.taskQueue.add(task);
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

      if (!this.taskQueue.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'build',
          fromId: site.id,
          toId: site.id,
          action: 'build',
          allowedCreepRoles: ['builder'],
          payload: {
            structureType: site.structureType,
            progress: site.progress,
            progressTotal: site.progressTotal,
          },
          timestamp: Game.time,
          status: 'published',
          room: room.name,
        };

        this.taskQueue.add(task);
      }
    }
  }

  /**
   * 发布维修任务
   */
  private publishRepairTasks(room: Room): void {
    const structures = room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.hits < structure.hitsMax &&
          structure.structureType !== STRUCTURE_WALL &&
          structure.structureType !== STRUCTURE_RAMPART
        );
      },
    });

    for (const structure of structures) {
      const taskId = `repair_${structure.id}`;

      if (!this.taskQueue.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'repair',
          fromId: structure.id,
          toId: structure.id,
          action: 'repair',
          allowedCreepRoles: ['repairer', 'builder'],
          payload: {
            structureType: structure.structureType,
            hits: structure.hits,
            hitsMax: structure.hitsMax,
          },
          timestamp: Game.time,
          status: 'published',
          room: room.name,
        };

        this.taskQueue.add(task);
      }
    }
  }

  /**
   * 发布传输任务
   */
  private publishTransferTasks(room: Room): void {
    // 检查需要能量的建筑
    const structures = room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return 'store' in structure && (structure as any).store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      },
    });

    for (const structure of structures) {
      const taskId = `transfer_${structure.id}`;

      if (!this.taskQueue.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'transfer',
          fromId: '', // 从任何有能量的地方
          toId: structure.id,
          action: 'transfer',
          allowedCreepRoles: ['harvester'],
          payload: {
            resourceType: RESOURCE_ENERGY,
            amount: (structure as any).store.getFreeCapacity(RESOURCE_ENERGY),
          },
          timestamp: Game.time,
          status: 'published',
          room: room.name,
        };

        this.taskQueue.add(task);
      }
    }
  }
}
