import { cloneDeep, merge } from 'lodash';

export enum TaskStatusEnum {
  'published',
  'assigned',
  'completed',
  'expired',
}

export type HarvestingPayload = Partial<Record<ResourceConstant, number>>;

export type UpgradingPayload = {
  progress: number;
  progressTotal: number;
  level: number;
};

export type BuildingPayload = {
  structureType: BuildableStructureConstant;
  progress: number;
  progressTotal: number;
};

export type RepairingPayload = {
  structureType: StructureConstant;
  hits: number;
  hitsMax: number;
};

export type TransferringPayload = {
  // 如果为undefine则表示所有资源
  resourceTypes?: ResourceConstant[];
  freeCapacity: number;
};

export type TaskPayloadMap = {
  [K in TaskType]: K extends 'harvesting'
    ? HarvestingPayload
    : K extends 'upgrading'
    ? UpgradingPayload
    : K extends 'building'
    ? BuildingPayload
    : K extends 'repairing'
    ? RepairingPayload
    : K extends 'transferring'
    ? TransferringPayload
    : never;
};

export type Task<P extends TaskType = TaskType> = {
  room: string; // 任务所属房间
  publisher: string; // 发布者
  id: string; // 任务唯一标识
  type: P; // 任务类型
  toId: string; // 目标对象的ID
  toRoomName?: string; // 目标房间名称（跨房间任务时使用）
  allowedCreepRoles: string[]; // 哪些类型的creep可以做
  payload?: TaskPayloadMap[P]; // 额外信息
  timestamp?: number; // 任务创建时间
  priority?: number; // 任务优先级
  needCreepCount?: number; // 需要几人
  assignedTo?: string[]; // 已被哪些creep领取
  status?: TaskStatusEnum; // 任务状态
};

const defaultRoomMemory: RoomMemory = {
  taskMap: {},
  taskMapVersion: 0,
  sources: {},
};

export class TaskMap {
  private taskMap: Map<string, Task> = new Map();
  private priorityQueue: string[] = []; // 按优先级排序的任务ID队列
  private roomName: string;

  constructor(roomName: string) {
    this.roomName = roomName;

    if (!global.rooms?.[roomName]?.taskMap) {
      global.rooms[roomName] = Memory.rooms?.[roomName] ? cloneDeep(Memory.rooms[roomName]) : { ...defaultRoomMemory };
      // 确保 taskMap 存在
      if (!global.rooms[roomName].taskMap) global.rooms[roomName].taskMap = {};
    }

    // 从内存加载任务到 Map
    const taskMapData = global.rooms?.[roomName]?.taskMap ?? {};
    for (const [taskId, task] of Object.entries(taskMapData)) {
      this.taskMap.set(taskId, task as Task);
    }
    this.updatePriorityQueue();

    if (Game.time % 10 === 0) {
      this.saveToMemory();
    }
  }

  /**
   * 更新优先级队列
   */
  private updatePriorityQueue(): void {
    this.priorityQueue = Array.from(this.taskMap.values())
      .sort((a, b) => {
        // 按优先级排序，优先级高的在前
        const priorityA = a.priority ?? 0;
        const priorityB = b.priority ?? 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // 降序
        }
        // 优先级相同时，按时间戳排序
        const timeA = a.timestamp ?? 0;
        const timeB = b.timestamp ?? 0;
        return timeA - timeB; // 升序
      })
      .map((task) => task.id);
  }

  /**
   * 保存任务Map
   */
  private save(): void {
    const taskMapObject: Record<string, Task> = {};
    for (const [taskId, task] of this.taskMap) {
      taskMapObject[taskId] = task;
    }
    global.rooms[this.roomName].taskMap = taskMapObject;
    global.rooms[this.roomName].taskMapVersion = Game.time;
  }

  /**
   * 缓存任务Map到Memory
   */
  private saveToMemory = () => {
    console.log(`${Game.time}: Save TaskMap To Memory`);
    Memory.rooms[this.roomName].taskMap = global.rooms[this.roomName].taskMap;
    Memory.rooms[this.roomName].taskMapVersion = Game.time;
  };

  /**
   * 检查Map中是否已存在指定id的任务
   * @param taskId 任务ID
   * @returns 是否存在
   */
  hasTask(taskId: string): boolean {
    return this.taskMap.has(taskId);
  }

  /**
   * 初始化任务Map
   */
  init() {
    this.taskMap.clear();
    this.priorityQueue = [];
    this.save();
  }

  /**
   * 添加任务
   * @param task 任务对象
   */
  add(task: Task) {
    if (this.taskMap.has(task.id)) {
      // 已存在则不添加
      return;
    }
    this.taskMap.set(task.id, task);
    this.updatePriorityQueue();
    this.save();
  }

  /**
   * 取出（弹出）最高优先级任务
   * @returns 任务对象或undefined
   */
  pop(): Task | undefined {
    if (this.priorityQueue.length === 0) {
      return undefined;
    }
    const taskId = this.priorityQueue.shift()!;
    const task = this.taskMap.get(taskId);
    if (task) {
      this.taskMap.delete(taskId);
      this.save();
    }
    return task;
  }

  /**
   * 根据ID获取任务
   * @param taskId 任务ID
   * @returns 任务对象或undefined
   */
  get<T extends TaskType>(taskId: string): Task<T> | undefined {
    return this.taskMap.get(taskId) as Task<T> | undefined;
  }

  /**
   * 删除指定id的任务
   * @param taskId 任务ID
   * @returns 是否删除成功
   */
  remove(taskId: string): boolean {
    const task = this.taskMap.get(taskId);
    if (task) {
      if (task?.assignedTo?.length) {
        // 和任务相关的creep需要更新状态
        // 遍历所有creep，若其memory.taskId等于被删除的taskId，则清除其任务状态
        for (const name of task.assignedTo) {
          const creep = Game.creeps[name];
          if (creep?.memory?.currentTask === taskId) {
            delete creep.memory.currentTask;
          }
        }
      }
      this.taskMap.delete(taskId);
      this.updatePriorityQueue();
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 发布任务
   * @param type 任务类型
   * @param toId 目标ID
   * @param action 动作
   * @param allowedCreepRoles 允许的creep角色
   * @param options 可选参数
   * @returns 创建的任务对象
   */
  publish(task: Task): Task {
    const finalTask: Task = {
      timestamp: Game.time,
      status: TaskStatusEnum.published,
      toRoomName: this.roomName,
      ...task,
    };
    this.add(finalTask);
    return finalTask;
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param updates 更新内容
   * @returns 是否更新成功
   */
  updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.taskMap.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.updatePriorityQueue();
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 获取任务Map大小
   * @returns Map中任务的数量
   */
  size(): number {
    return this.taskMap.size;
  }

  /**
   * 查看最高优先级任务但不移除
   * @returns 任务对象或undefined
   */
  peek(): Task | undefined {
    if (this.priorityQueue.length === 0) {
      return undefined;
    }
    const taskId = this.priorityQueue[0];
    return this.taskMap.get(taskId);
  }

  /**
   * 获取所有任务
   * @returns 任务数组的副本
   */
  getAll(): Task[] {
    return Array.from(this.taskMap.values());
  }

  /**
   * 根据状态获取任务
   * @param status 任务状态
   * @returns 任务数组
   */
  getByStatus(status: TaskStatusEnum): Task[] {
    return Array.from(this.taskMap.values()).filter((t) => t.status === status);
  }

  /**
   * 根据类型获取任务
   * @param type 任务类型
   * @returns 任务数组
   */
  getByType(type: string): Task[] {
    return Array.from(this.taskMap.values()).filter((t) => t.type === type);
  }

  /**
   * 清理过期任务
   * @param maxAge 最大年龄（tick数）
   * @returns 清理的任务数量
   */
  cleanupExpired(maxAge: number = 1000): number {
    const currentTime = Game.time;
    const initialSize = this.taskMap.size;
    const expiredTasks: string[] = [];

    for (const [taskId, task] of this.taskMap) {
      if (task.timestamp && currentTime - task.timestamp > maxAge) {
        expiredTasks.push(taskId);
      }
    }

    for (const taskId of expiredTasks) {
      console.log(`(${taskId}) has been expired`);
      this.taskMap.delete(taskId);
    }

    const cleanedCount = initialSize - this.taskMap.size;
    if (cleanedCount) {
      this.updatePriorityQueue();
      this.save();
    }
    return cleanedCount;
  }

  /**
   * 清理已完成任务
   * @returns 清理的任务数量
   */
  cleanupCompleted(): number {
    const completedTasks: string[] = [];

    for (const [taskId, task] of this.taskMap) {
      if (task.status === TaskStatusEnum.completed) {
        completedTasks.push(taskId);
        const source = Game.getObjectById<Structure>(task.publisher);
        console.log(`${source?.structureType}[${source?.pos.x},${source?.pos.y}]: (${taskId}) has been completed`);
      }
    }

    for (const taskId of completedTasks) {
      this.remove(taskId);
    }

    if (completedTasks.length) {
      this.updatePriorityQueue();
      this.save();
    }
    return completedTasks.length;
  }

  /**
   * 清理无效任务
   * @returns 清理的任务数量
   */
  cleanupInvalid(): number {
    const invalidTasks: string[] = [];

    for (const [taskId, task] of this.taskMap) {
      if (!Game.getObjectById(task.publisher)) {
        invalidTasks.push(taskId);
      }
    }

    for (const taskId of invalidTasks) {
      console.log(`Publisher not found: (${taskId}) has been removed`);
      this.remove(taskId);
    }

    if (invalidTasks.length) {
      this.updatePriorityQueue();
      this.save();
    }
    return invalidTasks.length;
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
      total: this.taskMap.size,
      published: 0,
      assigned: 0,
      completed: 0,
      expired: 0,
      byType: {} as Record<string, number>,
    };

    for (const task of this.taskMap.values()) {
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

  /**
   * 获取 Map 实例（用于调试）
   */
  getMap(): Map<string, Task> {
    return this.taskMap;
  }

  /**
   * 获取优先级队列（用于调试）
   */
  getPriorityQueue(): string[] {
    return [...this.priorityQueue];
  }

  /**
   * 获取所有任务ID
   * @returns 任务ID数组
   */
  keys(): string[] {
    return Array.from(this.taskMap.keys());
  }

  /**
   * 获取所有任务值
   * @returns 任务数组
   */
  values(): Task[] {
    return Array.from(this.taskMap.values());
  }

  /**
   * 获取所有任务条目
   * @returns [taskId, task] 数组
   */
  entries(): [string, Task][] {
    return Array.from(this.taskMap.entries());
  }

  /**
   * 检查Map是否为空
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this.taskMap.size === 0;
  }

  /**
   * 清空所有任务
   */
  clear(): void {
    this.taskMap.clear();
    this.priorityQueue = [];
    this.save();
  }
}
