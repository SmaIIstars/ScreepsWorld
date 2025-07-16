import { TaskQueue } from '../utils/taskQueue';

/**
 * 任务监控器
 * 负责监控任务系统的状态和性能
 */
export class TaskMonitor {
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  /**
   * 监控房间状态
   * @param room 房间对象
   */
  monitorRoom(room: Room): void {
    this.monitorTaskQueue(room);
    this.monitorCreepTasks(room);
    this.monitorRoomResources(room);
  }

  /**
   * 监控任务队列状态
   */
  private monitorTaskQueue(room: Room): void {
    const stats = this.taskQueue.getStats();

    // 每100 tick输出一次状态
    if (Game.time % 100 === 0) {
      console.log(`[任务监控][${room.name}] 任务队列状态:`);
      console.log(`  - 总任务数: ${stats.total}`);
      console.log(`  - 待分配: ${stats.published}`);
      console.log(`  - 执行中: ${stats.assigned}`);
      console.log(`  - 已完成: ${stats.completed}`);
      console.log(`  - 按类型:`, JSON.stringify(stats.byType));
    }

    // global.taskSystem = merge(global.taskSystem, { taskQueue: this.taskQueue.getAll() });
    // 每10 tick保存一次任务队列到Memory作为备份
    if (Game.time % 10 === 0) {
      // Memory.taskSystem.taskQueue = this.taskQueue.getAll();
    }
  }

  /**
   * 监控creep任务状态
   */
  private monitorCreepTasks(room: Room): void {
    const creeps = Object.values(Game.creeps).filter((creep) => creep.room.name === room.name);
    const creepsWithTasks = creeps.filter((creep) => creep.memory.currentTask);
    const creepsWithoutTasks = creeps.filter((creep) => !creep.memory.currentTask);

    // 每100 tick输出一次状态
    if (Game.time % 100 === 0) {
      console.log(`[任务监控][${room.name}] Creep任务状态:`);
      console.log(`  - 总creep数: ${creeps.length}`);
      console.log(`  - 有任务: ${creepsWithTasks.length}`);
      console.log(`  - 空闲: ${creepsWithoutTasks.length}`);

      // 按角色统计
      const roleStats: Record<string, { total: number; withTask: number }> = {};
      for (const creep of creeps) {
        const role = creep.memory.role || 'unknown';
        if (!roleStats[role]) {
          roleStats[role] = { total: 0, withTask: 0 };
        }
        roleStats[role].total++;
        if (creep.memory.currentTask) {
          roleStats[role].withTask++;
        }
      }

      for (const [role, stats] of Object.entries(roleStats)) {
        console.log(`    ${role}: ${stats.withTask}/${stats.total}`);
      }
    }
  }

  /**
   * 监控房间资源状态
   */
  private monitorRoomResources(room: Room): void {
    const energyAvailable = room.energyAvailable;
    const energyCapacity = room.energyCapacityAvailable;
    const sources = room.find(FIND_SOURCES);
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    const damagedStructures = room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.hits < structure.hitsMax,
    });

    // 每100 tick输出一次状态
    if (Game.time % 100 === 0) {
      console.log(`[任务监控][${room.name}] 资源状态:`);
      console.log(`  - 能量: ${energyAvailable}/${energyCapacity}`);
      console.log(`  - 能量源: ${sources.length}个`);
      console.log(`  - 建筑工地: ${constructionSites.length}个`);
      console.log(`  - 受损建筑: ${damagedStructures.length}个`);
    }
  }

  /**
   * 获取任务统计信息
   */
  getTaskStats(): {
    totalTasks: number;
    publishedTasks: number;
    assignedTasks: number;
    completedTasks: number;
    taskTypes: Record<string, number>;
  } {
    const stats = this.taskQueue.getStats();

    return {
      totalTasks: stats.total,
      publishedTasks: stats.published,
      assignedTasks: stats.assigned,
      completedTasks: stats.completed,
      taskTypes: stats.byType,
    };
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): {
    taskCompletionRate: number;
    averageTaskDuration: number;
    idleCreepRate: number;
  } {
    const tasks = this.taskQueue.getAll();
    const creeps = Object.values(Game.creeps);

    // 计算任务完成率
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // 计算平均任务持续时间
    const completedTasksWithTimestamp = tasks.filter((t) => t.status === 'completed' && t.timestamp);
    const totalDuration = completedTasksWithTimestamp.reduce((sum, task) => {
      return sum + (Game.time - (task.timestamp || 0));
    }, 0);
    const averageTaskDuration =
      completedTasksWithTimestamp.length > 0 ? totalDuration / completedTasksWithTimestamp.length : 0;

    // 计算空闲creep率
    const creepsWithTasks = creeps.filter((creep) => creep.memory.currentTask).length;
    const idleCreepRate = creeps.length > 0 ? (creeps.length - creepsWithTasks) / creeps.length : 0;

    return {
      taskCompletionRate,
      averageTaskDuration,
      idleCreepRate,
    };
  }
}
