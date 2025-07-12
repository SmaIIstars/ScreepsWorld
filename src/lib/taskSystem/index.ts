import { TaskQueue } from '../utils/taskQueue';
import { TaskExecutor } from './executor';
import { TaskMonitor } from './monitor';
import { TaskPublisher } from './publisher';

/**
 * 任务系统主入口
 * 负责协调任务的发布、分配和执行
 */
export class TaskSystem {
  private taskQueue: TaskQueue;
  private publisher: TaskPublisher;
  private executor: TaskExecutor;
  private monitor: TaskMonitor;

  constructor() {
    this.taskQueue = new TaskQueue();
    this.publisher = new TaskPublisher(this.taskQueue);
    this.executor = new TaskExecutor(this.taskQueue);
    this.monitor = new TaskMonitor(this.taskQueue);
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

    // 3. 分配任务给creep
    this.executor.assignTasks(room);

    // 4. 执行任务
    this.executor.executeTasks(room);

    // 5. 清理过期任务
    this.cleanupExpiredTasks();
  }

  /**
   * 清理过期任务
   */
  private cleanupExpiredTasks(): void {
    const currentTime = Game.time;
    const tasks = this.taskQueue.getAll();

    for (const task of tasks) {
      // 任务超过1000 tick未完成则过期
      if (task.timestamp && currentTime - task.timestamp > 1000) {
        this.taskQueue.remove(task.id);
        console.log(`[任务系统] 清理过期任务: ${task.id} (${task.type})`);
      }
    }
  }

  /**
   * 获取任务队列状态
   */
  getStatus(): { totalTasks: number; publishedTasks: number; assignedTasks: number; completedTasks: number } {
    const tasks = this.taskQueue.getAll();
    const publishedTasks = tasks.filter((t: any) => t.status === 'published').length;
    const assignedTasks = tasks.filter((t: any) => t.status === 'assigned').length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

    return {
      totalTasks: tasks.length,
      publishedTasks,
      assignedTasks,
      completedTasks,
    };
  }
}

// 导出单例实例
export const taskSystem = new TaskSystem();

/**
 * 任务系统入口函数
 * @param room 房间对象
 */
export function runTaskSystem(room: Room): void {
  taskSystem.run(room);
}
