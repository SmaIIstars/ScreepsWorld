// 以下是Memory都有简写
// creeps -> Memory.creeps
// powerCreeps -> Memory.powerCreeps
// flags -> Memory.flags
// rooms -> Memory.rooms
// spawns -> Memory.spawns

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

interface RoomMemory {
  name: string;
  structures: Partial<Record<StructureConstant, string[]>>;
  taskQueue: import('@/lib/utils/taskQueue').Task[];
}

interface Memory {
  sources: Record<'Source' | 'Mineral', string[]>;
  creepsCount: Record<CustomRoleType, number>;
  rooms: Record<string, RoomMemory>;
}
