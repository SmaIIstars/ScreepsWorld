import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';

/**
 * 任务监控器
 * 负责监控任务系统的状态和性能
 */
export class TaskMonitor {
  private taskMap: TaskMap;

  constructor(taskMap: TaskMap) {
    this.taskMap = taskMap;
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
   * 监控任务Map状态
   */
  private monitorTaskQueue(room: Room): void {
    const stats = this.taskMap.getStats();

    // 更新任务状态
    const tasks = this.taskMap.getAll();
    for (const task of tasks) {
      // 1. 采集任务
      if (task.type === 'harvesting' && task.payload && Object.values(task.payload).every((amount) => amount === 0)) {
        this.taskMap.updateTask(task.id, { status: TaskStatusEnum.completed });
      }

      if (task.type === 'generating' && ((task as Task<'generating'>).payload?.number ?? 0) <= 0) {
        this.taskMap.updateTask(task.id, { status: TaskStatusEnum.completed });
      }

      // 2. 分配者清理
      if (task.assignedTo) {
        this.taskMap.updateTask(task.id, { assignedTo: task.assignedTo.filter((name) => Game.creeps[name]) });
      }
    }

    // 打印任务状态
    // intervalSleep(50, () => {
    //   console.log(`[任务监控][${room.name}] 任务Map状态:`);
    //   console.log(`  - 总任务数: ${stats.total}`);
    //   console.log(`  - 待分配: ${stats.published}`);
    //   console.log(`  - 执行中: ${stats.assigned}`);
    //   console.log(`  - 已完成: ${stats.completed}`);
    // });
  }

  /**
   * 监控creep任务状态
   */
  private monitorCreepTasks(room: Room): void {
    const creeps = Object.values(Game.creeps).filter((creep) => creep.room.name === room.name);
    const creepsWithTasks: Creep[] = [];
    const creepsWithoutTasks: Creep[] = [];
    for (const creep of creeps) {
      if (creep.memory.currentTask) {
        creepsWithTasks.push(creep);
      } else {
        creepsWithoutTasks.push(creep);
      }
    }
  }

  /**
   * 监控房间资源状态
   */
  private monitorRoomResources(room: Room): void {
    // const energyAvailable = room.energyAvailable;
    // const energyCapacity = room.energyCapacityAvailable;
    // const sources = room.find(FIND_SOURCES);
    // const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    // const damagedStructures = room.find(FIND_STRUCTURES, {
    //   filter: (structure) => structure.hits < structure.hitsMax,
    // });
    // intervalSleep(50, () => {
    //   console.log(`[任务监控][${room.name}] 资源状态:`);
    //   console.log(`  - 能量: ${energyAvailable}/${energyCapacity}`);
    //   console.log(`  - 能量源: ${sources.length}个`);
    //   console.log(`  - 建筑工地: ${constructionSites.length}个`);
    //   console.log(`  - 受损建筑: ${damagedStructures.length}个`);
    // });
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
    const stats = this.taskMap.getStats();

    return {
      totalTasks: stats.total,
      publishedTasks: stats.published,
      assignedTasks: stats.assigned,
      completedTasks: stats.completed,
      taskTypes: stats.byType,
    };
  }
}
