/**
 * CPU 优化器
 * 提供任务驱动系统的性能优化策略
 */
export class CPUOptimizer {
  private static cpuUsage: number = 0;
  private static lastTick: number = 0;

  /**
   * 开始 CPU 计时
   */
  static startTimer(): void {
    this.cpuUsage = Game.cpu.getUsed();
    this.lastTick = Game.time;
  }

  /**
   * 结束 CPU 计时并输出
   * @param label 标签
   */
  static endTimer(label: string): void {
    const used = Game.cpu.getUsed() - this.cpuUsage;
    if (Game.time % 100 === 0) {
      console.log(`[CPU] ${label}: ${used.toFixed(2)} CPU`);
    }
  }

  /**
   * 检查 CPU 使用情况
   * @param threshold 阈值
   * @returns 是否超过阈值
   */
  static checkCPUUsage(threshold: number = 15): boolean {
    const used = Game.cpu.getUsed();
    return used < threshold;
  }

  /**
   * 优化房间查找
   * @param roomName 房间名
   * @returns 房间对象或null
   */
  static getRoomOptimized(roomName: string): Room | null {
    // 使用缓存减少重复查找
    if (!Memory.roomCache) Memory.roomCache = {};

    const cache = Memory.roomCache[roomName];
    if (cache && cache.tick === Game.time) {
      return Game.rooms[roomName] || null;
    }

    const room = Game.rooms[roomName];
    if (room) {
      Memory.roomCache[roomName] = { tick: Game.time };
    }

    return room || null;
  }

  /**
   * 优化 creep 查找
   * @param room 房间对象
   * @param filter 过滤器
   * @returns creep数组
   */
  static findCreepsOptimized(room: Room, filter?: (creep: Creep) => boolean): Creep[] {
    // 使用房间内的查找而不是全局查找
    const creeps = room.find(FIND_MY_CREEPS);

    if (filter) {
      return creeps.filter(filter);
    }

    return creeps;
  }

  /**
   * 批量处理优化
   * @param items 项目数组
   * @param processor 处理器函数
   * @param batchSize 批次大小
   */
  static batchProcess<T>(items: T[], processor: (item: T) => void, batchSize: number = 10): void {
    const startIndex = (Game.time % Math.ceil(items.length / batchSize)) * batchSize;
    const endIndex = Math.min(startIndex + batchSize, items.length);

    for (let i = startIndex; i < endIndex; i++) {
      if (items[i]) {
        processor(items[i]);
      }
    }
  }

  /**
   * 条件执行优化
   * @param condition 条件
   * @param action 动作
   * @param frequency 频率
   */
  static conditionalExecute(condition: boolean, action: () => void, frequency: number = 1): void {
    if (condition && Game.time % frequency === 0) {
      action();
    }
  }

  /**
   * 内存缓存优化
   * @param key 缓存键
   * @param generator 生成器函数
   * @param ttl 生存时间
   * @returns 缓存值
   */
  static getCached<T>(key: string, generator: () => T, ttl: number = 10): T {
    if (!Memory.cache) Memory.cache = {};

    const cached = Memory.cache[key];
    if (cached && Game.time - cached.tick < ttl) {
      return cached.value as T;
    }

    const value = generator();
    Memory.cache[key] = { value, tick: Game.time };

    return value;
  }

  /**
   * 清理过期缓存
   */
  static cleanupCache(): void {
    if (!Memory.cache) return;

    const currentTime = Game.time;
    for (const key in Memory.cache) {
      const cached = Memory.cache[key];
      if (currentTime - cached.tick > 100) {
        delete Memory.cache[key];
      }
    }
  }

  /**
   * 获取性能报告
   */
  static getPerformanceReport(): {
    cpuUsed: number;
    cpuLimit: number;
    cpuPercentage: number;
    bucket: number;
  } {
    const cpuUsed = Game.cpu.getUsed();
    const cpuLimit = Game.cpu.limit;
    const cpuPercentage = (cpuUsed / cpuLimit) * 100;
    const bucket = Game.cpu.bucket;

    return {
      cpuUsed,
      cpuLimit,
      cpuPercentage,
      bucket,
    };
  }
}

// 扩展 Memory 接口
declare global {
  interface Memory {
    roomCache?: Record<string, { tick: number }>;
    cache?: Record<string, { value: any; tick: number }>;
  }
}
