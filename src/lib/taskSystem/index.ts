import { TaskMap } from '../utils/taskMap';
import { TaskExecutor } from './executor';
import { TaskMonitor } from './monitor';
import { TaskPublisher } from './publisher';

export type TaskSystemType = {
  taskMap: TaskMap;
};

/**
 * 任务系统主入口
 * 负责协调任务的发布、分配和执行
 */
export class TaskSystem {
  private taskMap: TaskMap;
  private publisher: TaskPublisher;
  private executor: TaskExecutor;
  private monitor: TaskMonitor;
  // private remoteTaskGenerator: RemoteTaskGenerator;

  constructor(roomName: string) {
    this.taskMap = new TaskMap(roomName);
    this.monitor = new TaskMonitor(this.taskMap);
    this.publisher = new TaskPublisher(this.taskMap);
    this.executor = new TaskExecutor(this.taskMap);
  }

  /**
   * 运行任务系统
   * @param room 房间对象
   */
  run(room: Room): void {
    // 1. 监控房间状态
    this.monitor.monitorRoom(room);
    // 2. 发布任务
    this.publisher.publishTasks(room);
    // 3. 闲置的creep认领任务
    this.claimTasks(room);
    // 4. 执行任务
    this.executor.executeTasks(room);
    // 5. 清理任务
    this.cleanupTasks();
    // 6. 保存任务Map到Memory
    if (Game.time % 10 === 0) {
      this.taskMap.saveToMemory();
    }
  }

  /**
   * 清理过期任务
   */
  private cleanupTasks(): void {
    // 1.过期任务
    this.taskMap.cleanupExpired(1000);
    // 2.已完成任务
    this.taskMap.cleanupCompleted();
    // 3.任务发布者不再的任务
    this.taskMap.cleanupInvalid();
  }

  /**
   * 获取任务Map状态
   */
  getStatus(): { totalTasks: number; publishedTasks: number; assignedTasks: number; completedTasks: number } {
    const stats = this.taskMap.getStats();
    return {
      totalTasks: stats.total,
      publishedTasks: stats.published,
      assignedTasks: stats.assigned,
      completedTasks: stats.completed,
    };
  }

  /**
   * 让creep主动认领任务
   * @param room 房间对象
   */
  private claimTasks(room: Room): void {
    const availableCreeps = room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        // Specify Min Group
        // if (creep.name.includes('Room2Min')) return false;
        // Idle creeps
        if (creep.memory.currentTask) return false;
        // in spawning
        if (creep.spawning) return false;
        return true;
      },
    });

    for (const creep of availableCreeps) {
      if (!creep.memory.role) continue;
      // 让creep自己选择任务
      const claimedTaskId = utils.roles[creep.memory.role]?.claimTask(creep, this.taskMap);
      if (claimedTaskId) creep.memory.currentTask = claimedTaskId;
    }
  }
}

/**
 * 任务系统入口函数
 * @param room 房间对象
 */
export function runTaskSystem(room: Room): void {
  const taskSystem = new TaskSystem(room.name);
  taskSystem.run(room);
}
