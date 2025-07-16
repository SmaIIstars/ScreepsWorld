import { TaskQueue } from '../utils/taskQueue';
import { TaskMonitor } from './monitor';

import { cloneDeep } from 'lodash';

export type TaskSystemType = {
  taskQueue: TaskQueue['queue'];
};

const defaultRoomMemory: RoomMemory = {
  name: '',
  structures: {},
  taskQueue: [],
};

/**
 * 任务系统主入口
 * 负责协调任务的发布、分配和执行
 */
export class TaskSystem {
  private taskQueue: TaskQueue;
  // private publisher: TaskPublisher;
  // private executor: TaskExecutor;
  private monitor: TaskMonitor;

  constructor(roomName: string) {
    if (!global.rooms?.[roomName]) {
      global.rooms[roomName] = Memory.rooms?.[roomName]
        ? cloneDeep(Memory.rooms[roomName])
        : { ...defaultRoomMemory, name: roomName };
    }
    // 确保 taskQueue 存在
    if (!global.rooms[roomName].taskQueue) global.rooms[roomName].taskQueue = [];

    // 用房间的 taskQueue 初始化 TaskQueue 实例
    this.taskQueue = new TaskQueue(roomName);
    this.monitor = new TaskMonitor(this.taskQueue);
    // this.publisher = new TaskPublisher(this.taskQueue);
    // this.executor = new TaskExecutor(this.taskQueue);
  }

  /**
   * 运行任务系统
   * @param room 房间对象
   */
  run(room: Room): void {
    // 1. 监控房间状态
    this.monitor.monitorRoom(room);
    // 2. 发布任务
    // this.publisher.publishTasks(room);
    // 3. 分配任务给creep
    // this.executor.assignTasks(room);
    // 4. 执行任务
    // this.executor.executeTasks(room);
    // 5. 清理过期任务
    // this.cleanupExpiredTasks();
  }

  /**
   * 清理过期任务
   */
  private cleanupExpiredTasks(): void {
    const cleanedCount = this.taskQueue.cleanupExpired(1000);
    if (cleanedCount > 0) {
      console.log(`[任务系统] 清理了 ${cleanedCount} 个过期任务`);
    }
  }

  /**
   * 获取任务队列状态
   */
  getStatus(): { totalTasks: number; publishedTasks: number; assignedTasks: number; completedTasks: number } {
    const stats = this.taskQueue.getStats();
    return {
      totalTasks: stats.total,
      publishedTasks: stats.published,
      assignedTasks: stats.assigned,
      completedTasks: stats.completed,
    };
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
