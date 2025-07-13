interface CreepMemory {
  role?: CustomRoleType;
  task?: CustomRoleTaskType;
  // creep专注目标的id
  targetId?: string;
  targetRoomName?: string;

  // 任务系统相关
  currentTask?: string; // 当前执行的任务ID
  cacheTargetStoreId?: string;
}

// 以下是Memory都有简写
// creeps -> Memory.creeps
// powerCreeps -> Memory.powerCreeps
// flags -> Memory.flags
// rooms -> Memory.rooms
// spawns -> Memory.spawns

interface Memory {
  sources: Record<'Source' | 'Mineral', string[]>;
  creepsCount: Record<CustomRoleType, number>;

  // 任务系统相关内存
  taskSystem: {
    taskQueue: import('@/lib/utils/taskQueue').Task[];
  };
}
