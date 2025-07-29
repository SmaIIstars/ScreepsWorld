// 以下是Memory都有简写
// creeps -> Memory.creeps
// powerCreeps -> Memory.powerCreeps
// flags -> Memory.flags
// rooms -> Memory.rooms
// spawns -> Memory.spawns

interface Memory {
  flags: Record<string, FlagMemory>;
  rooms: Record<string, RoomMemory>;
}

// Creep Memory
interface CreepMemory {
  role: CustomRoleType;
  currentTask?: string; // 当前执行的任务ID
  targetId?: string;

  /**
   * @deprecated 仅在 tempTask 中 Min 相关用法，后续不推荐使用
   */
  task?: TaskType;
}

// Room Memory
type RoomSourceType = LOOK_SOURCES | LOOK_MINERALS | LOOK_RESOURCES | LOOK_RUINS | LOOK_TOMBSTONES;
interface RoomMemory {
  taskMap?: Record<string, import('@/lib/utils/taskMap').Task>; // New Map-based structure
  taskMapVersion?: number; // New Map-based version
  creepsCount?: Record<CustomRoleType, number>;
  sources?: Partial<Record<RoomSourceType, string[]>>;
  visible?: boolean;
  sourceRooms?: string[];
}

// flag Memory
type FlagType = 'sourceRoom';
interface FlagMemory {
  type: FlagType;
  mainRooms?: string[];
}
