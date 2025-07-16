export type TaskStatus = 'published' | 'assigned' | 'completed' | 'expired';

export type Task = {
  room: string; // 任务所属房间
  id: string; // 任务唯一标识
  type: string; // 任务类型（如 'harvest', 'transfer', 'build' 等）
  fromId: string; // 来源对象的ID
  toId: string; // 目标对象的ID
  action: string; // 要做什么（如 'harvest', 'transfer', 'repair' 等）
  allowedCreepRoles: string[]; // 哪些类型的creep可以做（如 ['harvester', 'builder']）
  payload?: any; // 额外信息
  timestamp?: number; // 任务创建时间
  priority?: number; // 任务优先级
  needCreepCount?: number; // 需要几人
  assignedTo?: string[]; // 已被哪些creep领取（creep name数组），未领取则为undefined或空数组
  status?: TaskStatus; // 任务状态：发布、领取、完成、过期
};

export class TaskQueue {
  private queue: Task[] = [];
  private roomName: string;

  constructor(roomName: string) {
    this.roomName = roomName;
    this.queue = Memory.rooms?.[roomName]?.taskQueue ?? [];
  }

  /**
   * 保存任务队列
   */
  private save(): void {
    Memory.rooms[this.roomName].taskQueue = this.queue;
  }

  /**
   * 检查队列中是否已存在指定id的任务
   * @param taskId 任务ID
   * @returns 是否存在
   */
  hasTask(taskId: string): boolean {
    return this.queue.some((t) => t.id === taskId);
  }

  /**
   * 初始化队列
   */
  init() {
    this.queue = [];
    this.save();
  }

  /**
   * 添加任务
   * @param task 任务对象
   */
  add(task: Task) {
    if (this.queue.some((t) => t.id === task.id)) {
      // 已存在则不添加
      return;
    }
    this.queue.push(task);
  }

  /**
   * 取出（弹出）队首任务
   * @returns 任务对象或undefined
   */
  pop(): Task | undefined {
    const task = this.queue.shift();
    if (task) {
      this.save();
    }
    return task;
  }

  /**
   * 删除指定id的任务
   * @param taskId 任务ID
   * @returns 是否删除成功
   */
  remove(taskId: string): boolean {
    const idx = this.queue.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param updates 更新内容
   * @returns 是否更新成功
   */
  updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.queue.find((t) => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      return true;
    }
    return false;
  }

  /**
   * 获取队列长度
   * @returns 队列长度
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 查看队首任务但不移除
   * @returns 任务对象或undefined
   */
  peek(): Task | undefined {
    return this.queue[0];
  }

  /**
   * 获取所有任务
   * @returns 任务数组的副本
   */
  getAll(): Task[] {
    return [...this.queue];
  }

  /**
   * 根据状态获取任务
   * @param status 任务状态
   * @returns 任务数组
   */
  getByStatus(status: TaskStatus): Task[] {
    return this.queue.filter((t) => t.status === status);
  }

  /**
   * 根据类型获取任务
   * @param type 任务类型
   * @returns 任务数组
   */
  getByType(type: string): Task[] {
    return this.queue.filter((t) => t.type === type);
  }

  /**
   * 清理过期任务
   * @param maxAge 最大年龄（tick数）
   * @returns 清理的任务数量
   */
  cleanupExpired(maxAge: number = 1000): number {
    const currentTime = Game.time;
    const initialSize = this.queue.length;

    this.queue = this.queue.filter((task) => {
      if (task.timestamp && currentTime - task.timestamp > maxAge) {
        return false; // 移除过期任务
      }
      return true;
    });

    return initialSize - this.queue.length;
  }

  /**
   * 获取队列统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    total: number;
    published: number;
    assigned: number;
    completed: number;
    expired: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.queue.length,
      published: 0,
      assigned: 0,
      completed: 0,
      expired: 0,
      byType: {} as Record<string, number>,
    };

    for (const task of this.queue) {
      // 按状态统计
      const status = task.status || 'unknown';
      if (status in stats) {
        (stats as any)[status]++;
      }

      // 按类型统计
      const type = task.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }
}
