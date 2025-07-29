export enum TaskStatusEnum {
  'inProgress',
  'completed',
  'failed',
  'published',
}

export type TaskPublisherType =
  | STRUCTURE_SPAWN
  | STRUCTURE_EXTENSION
  | STRUCTURE_ROAD
  | STRUCTURE_WALL
  | STRUCTURE_RAMPART
  | STRUCTURE_KEEPER_LAIR
  | STRUCTURE_PORTAL
  | STRUCTURE_CONTROLLER
  | STRUCTURE_LINK
  | STRUCTURE_STORAGE
  | STRUCTURE_TOWER
  | STRUCTURE_OBSERVER
  | STRUCTURE_POWER_BANK
  | STRUCTURE_POWER_SPAWN
  | STRUCTURE_EXTRACTOR
  | STRUCTURE_LAB
  | STRUCTURE_TERMINAL
  | STRUCTURE_CONTAINER
  | STRUCTURE_NUKER
  | STRUCTURE_FACTORY
  | STRUCTURE_INVADER_CORE
  | LOOK_SOURCES
  | LOOK_RUINS
  | LOOK_TOMBSTONES
  | LOOK_MINERALS
  | LOOK_RESOURCES;

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
  publisherType: TaskPublisherType; // 发布者
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
};

export class TaskMap {
  private taskMap: Map<string, Task> = new Map();
  private roomName: string;

  constructor(roomName: string) {
    this.roomName = roomName;

    if (!global.rooms?.[roomName]) {
      global.rooms[roomName] = Memory.rooms?.[roomName] ? { ...Memory.rooms[roomName] } : { ...defaultRoomMemory };
    }

    // 从内存加载任务到 Map
    const taskMapData = global.rooms?.[roomName]?.taskMap ?? {};
    for (const [taskId, task] of Object.entries(taskMapData)) {
      this.taskMap.set(taskId, task as Task);
    }

    if (Game.time % 10 === 0) {
      this.saveToMemory();
    }
  }

  /**
   * 保存任务Map
   */
  private save(): void {
    const taskMapObj: Record<string, Task> = {};
    for (const [key, value] of this.taskMap) {
      taskMapObj[key] = value;
    }
    global.rooms[this.roomName].taskMap = taskMapObj;
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
   * 任务优先级队列
   */
  taskPriorityQueue(targetTaskType: TaskType, targetPriorityList?: TaskPublisherType[]): Task[] {
    const availableTaskList = Array.from(this.taskMap.values()).filter((task) => {
      if (task.status === TaskStatusEnum.completed) return false;
      if (task.status === TaskStatusEnum.failed) return false;
      if (task.assignedTo?.length && task.needCreepCount && task.assignedTo.length === task.needCreepCount)
        return false;
      return true;
    });

    if (!targetPriorityList) {
      // 如果targetPriorityList为空，则只需要将目标类型任务优先级提高
      return availableTaskList.sort((a, b) => {
        if (a.type === targetTaskType && b.type !== targetTaskType) {
          return -1;
        } else if (a.type !== targetTaskType && b.type === targetTaskType) {
          return 1;
        } else {
          return (a.timestamp ?? 0) - (b.timestamp ?? 0);
        }
      });
    } else {
      // 如果targetPriorityList不为空，则除了将目标类型任务优先级提高，还要按照targetPriorityList的顺序进行排序
      return availableTaskList.sort((a, b) => {
        // 首先按任务类型排序
        if (a.type === targetTaskType && b.type !== targetTaskType) {
          return -1;
        } else if (a.type !== targetTaskType && b.type === targetTaskType) {
          return 1;
        }

        // 然后按发布者类型优先级排序
        const idxA = targetPriorityList.indexOf(a.publisherType);
        const idxB = targetPriorityList.indexOf(b.publisherType);
        if (idxA !== idxB) {
          return idxA - idxB; // 升序
        }

        // 最后按时间戳排序
        return (a.timestamp ?? 0) - (b.timestamp ?? 0);
      });
    }
  }

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
    this.save();
  }

  /**
   * 添加任务
   * @param task 任务对象
   */
  add(task: Task) {
    if (this.taskMap.has(task.id)) return;
    this.taskMap.set(task.id, task);
    this.save();
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
  getByStatus(status: TaskStatusEnum[]): Task[] {
    return Array.from(this.taskMap.values()).filter((t) => status.includes(t.status ?? TaskStatusEnum.published));
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
    this.save();
  }
}
