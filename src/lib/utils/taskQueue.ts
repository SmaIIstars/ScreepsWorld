export type TaskStatus = 'published' | 'assigned' | 'completed' | 'expired';

export type Task = {
  id: string; // 任务唯一标识
  type: string; // 任务类型（如 'harvest', 'transfer', 'build' 等）
  fromId: string; // 来源对象的ID
  toId: string; // 目标对象的ID
  action: string; // 要做什么（如 'harvest', 'transfer', 'repair' 等）
  allowedCreepRoles: string[]; // 哪些类型的creep可以做（如 ['harvester', 'builder']）
  payload?: any; // 额外信息
  timestamp?: number; // 任务创建时间
  assignedTo?: string[]; // 已被哪些creep领取（creep name数组），未领取则为undefined或空数组
  status?: TaskStatus; // 任务状态：发布、领取、完成、过期
};

export class TaskQueue {
  private queue: Task[] = [];
  /**
   * 检查队列中是否已存在指定id的任务
   * @param taskId 任务ID
   * @returns 是否存在
   */
  hasTask(taskId: string): boolean {
    return this.queue.some((t) => t.id === taskId);
  }

  // 初始化队列
  init() {
    this.queue = [];
  }

  add(task: Task) {
    if (this.queue.some((t) => t.id === task.id)) {
      // 已存在则不添加
      return;
    }
    this.queue.push(task);
  }

  // 取出（弹出）队首任务
  pop(): Task | undefined {
    return this.queue.shift();
  }

  // 删除指定id的任务
  remove(taskId: string): boolean {
    const idx = this.queue.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return true;
    }
    return false;
  }

  // 获取队列长度
  size(): number {
    return this.queue.length;
  }

  // 查看队首任务但不移除
  peek(): Task | undefined {
    return this.queue[0];
  }

  // 获取所有任务
  getAll(): Task[] {
    return [...this.queue];
  }
}

export const taskQueue = new TaskQueue();
