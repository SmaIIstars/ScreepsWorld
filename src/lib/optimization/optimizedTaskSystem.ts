import { Task, TaskQueue } from '../utils/taskQueue';
import { CPUOptimizer } from './cpuOptimizer';

/**
 * 优化后的任务系统
 * 展示如何降低 CPU 开销
 */
export class OptimizedTaskSystem {
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  /**
   * 优化后的任务发布
   * @param room 房间对象
   */
  publishTasksOptimized(room: Room): void {
    CPUOptimizer.startTimer();

    // 使用缓存减少重复查找
    const sources = CPUOptimizer.getCached(
      `sources_${room.name}`,
      () => room.find(FIND_SOURCES),
      50 // 缓存50 tick
    );

    const constructionSites = CPUOptimizer.getCached(
      `constructionSites_${room.name}`,
      () => room.find(FIND_CONSTRUCTION_SITES),
      10 // 缓存10 tick
    );

    // 批量处理任务发布
    this.publishHarvestTasksOptimized(room, sources);
    this.publishBuildTasksOptimized(room, constructionSites);
    this.publishUpgradeTasksOptimized(room);

    CPUOptimizer.endTimer('Task Publishing');
  }

  /**
   * 优化后的采集任务发布
   */
  private publishHarvestTasksOptimized(room: Room, sources: Source[]): void {
    // 只处理有能量的源
    const activeSources = sources.filter((source) => source.energy > 0);

    for (const source of activeSources) {
      const taskId = `harvest_${source.id}_${Math.floor(Game.time / 10)}`; // 每10 tick更新一次

      if (!this.taskQueue.hasTask(taskId)) {
        const task: Task = {
          id: taskId,
          type: 'harvest',
          fromId: source.id,
          toId: '',
          action: 'harvest',
          allowedCreepRoles: ['harvester', 'miner'],
          payload: { resourceType: RESOURCE_ENERGY, amount: source.energy },
          timestamp: Game.time,
          status: 'published',
          room: room.name,
        };

        this.taskQueue.add(task);
      }
    }
  }

  /**
   * 优化后的建造任务发布
   */
  private publishBuildTasksOptimized(room: Room, sites: ConstructionSite[]): void {
    // 批量处理建筑工地
    CPUOptimizer.batchProcess(
      sites,
      (site) => {
        const taskId = `build_${site.id}_${Math.floor(Game.time / 5)}`; // 每5 tick更新一次

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
      },
      5
    ); // 每tick处理5个建筑工地
  }

  /**
   * 优化后的升级任务发布
   */
  private publishUpgradeTasksOptimized(room: Room): void {
    // 条件执行，只在需要时发布升级任务
    CPUOptimizer.conditionalExecute(
      !!(room.controller && room.controller.my),
      () => {
        const taskId = `upgrade_${room.controller!.id}_${Math.floor(Game.time / 20)}`; // 每20 tick更新一次

        if (!this.taskQueue.hasTask(taskId)) {
          const task: Task = {
            id: taskId,
            type: 'upgrade',
            fromId: room.controller!.id,
            toId: room.controller!.id,
            action: 'upgradeController',
            allowedCreepRoles: ['upgrader'],
            payload: {
              progress: room.controller!.progress,
              progressTotal: room.controller!.progressTotal,
              level: room.controller!.level,
            },
            timestamp: Game.time,
            status: 'published',
            room: room.name,
          };

          this.taskQueue.add(task);
        }
      },
      20 // 每20 tick执行一次
    );
  }

  /**
   * 优化后的任务分配
   * @param room 房间对象
   */
  assignTasksOptimized(room: Room): void {
    CPUOptimizer.startTimer();

    // 使用优化的creep查找
    const creeps = CPUOptimizer.findCreepsOptimized(room);
    const availableTasks = this.taskQueue.getAll().filter((task) => task.status === 'published');

    // 批量处理任务分配
    CPUOptimizer.batchProcess(
      creeps,
      (creep) => {
        if (creep.memory.currentTask) return; // 跳过已有任务的creep

        // 找到适合的任务
        const suitableTask = availableTasks.find((task) => task.allowedCreepRoles.includes(creep.memory.role || ''));

        if (suitableTask) {
          creep.memory.currentTask = suitableTask.id;
          suitableTask.status = 'assigned';
          suitableTask.assignedTo = suitableTask.assignedTo || [];
          suitableTask.assignedTo.push(creep.name);
        }
      },
      8
    ); // 每tick处理8个creep

    CPUOptimizer.endTimer('Task Assignment');
  }

  /**
   * 优化后的任务执行
   * @param room 房间对象
   */
  executeTasksOptimized(room: Room): void {
    CPUOptimizer.startTimer();

    const creeps = CPUOptimizer.findCreepsOptimized(room, (creep) => !!creep.memory.currentTask);

    // 批量处理任务执行
    CPUOptimizer.batchProcess(
      creeps,
      (creep) => {
        const task = this.taskQueue.getAll().find((t) => t.id === creep.memory.currentTask);
        if (!task) {
          delete creep.memory.currentTask;
          return;
        }

        // 执行任务
        const result = this.executeTaskOptimized(creep, task);

        if (result === 'completed') {
          task.status = 'completed';
          delete creep.memory.currentTask;
        } else if (result === 'failed') {
          task.status = 'published';
          delete creep.memory.currentTask;
        }
      },
      6
    ); // 每tick处理6个creep

    CPUOptimizer.endTimer('Task Execution');
  }

  /**
   * 优化后的任务执行
   */
  private executeTaskOptimized(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    // 使用缓存减少重复的对象查找
    const target = CPUOptimizer.getCached(
      `target_${task.fromId}`,
      () => Game.getObjectById(task.fromId as any),
      5 // 缓存5 tick
    );

    if (!target) return 'failed';

    switch (task.type) {
      case 'harvest':
        return this.executeHarvestTaskOptimized(creep, target as Source);
      case 'upgrade':
        return this.executeUpgradeTaskOptimized(creep, target as StructureController);
      case 'build':
        return this.executeBuildTaskOptimized(creep, target as ConstructionSite);
      default:
        return 'failed';
    }
  }

  /**
   * 优化后的采集任务执行
   */
  private executeHarvestTaskOptimized(creep: Creep, source: Source): 'completed' | 'failed' | 'in_progress' {
    if (creep.store.getFreeCapacity() === 0 || source.energy === 0) {
      return 'completed';
    }

    const result = creep.harvest(source);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(source);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 优化后的升级任务执行
   */
  private executeUpgradeTaskOptimized(
    creep: Creep,
    controller: StructureController
  ): 'completed' | 'failed' | 'in_progress' {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      // 简化的能量获取逻辑
      const sources = creep.room.find(FIND_SOURCES);
      if (sources.length > 0) {
        creep.moveTo(sources[0]);
      }
      return 'in_progress';
    }

    const result = creep.upgradeController(controller);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(controller);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 优化后的建造任务执行
   */
  private executeBuildTaskOptimized(creep: Creep, site: ConstructionSite): 'completed' | 'failed' | 'in_progress' {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      const sources = creep.room.find(FIND_SOURCES);
      if (sources.length > 0) {
        creep.moveTo(sources[0]);
      }
      return 'in_progress';
    }

    const result = creep.build(site);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(site);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 清理过期任务和缓存
   */
  cleanupOptimized(): void {
    // 清理过期任务
    const currentTime = Game.time;
    const tasks = this.taskQueue.getAll();

    for (const task of tasks) {
      if (task.timestamp && currentTime - task.timestamp > 1000) {
        this.taskQueue.remove(task.id);
      }
    }

    // 清理过期缓存
    CPUOptimizer.cleanupCache();
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): void {
    const report = CPUOptimizer.getPerformanceReport();

    if (Game.time % 100 === 0) {
      console.log(
        `[性能报告] CPU使用: ${report.cpuUsed.toFixed(2)}/${report.cpuLimit} (${report.cpuPercentage.toFixed(1)}%)`
      );
      console.log(`[性能报告] CPU桶: ${report.bucket}`);

      const taskStats = this.taskQueue.getAll().reduce((acc, task) => {
        acc[task.status || 'unknown'] = (acc[task.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`[性能报告] 任务状态:`, taskStats);
    }
  }
}
