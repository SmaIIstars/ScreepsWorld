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
  taskMap?: Map<string, import('@/lib/utils/taskMap').Task>;
  taskMapObj?: Record<string, import('@/lib/utils/taskMap').Task>;
  taskMapVersion?: number; // New Map-based version
  creepsCount?: Record<CustomRoleType, number>;
  sources?: Partial<Record<RoomSourceType, string[]>>;
  visible?: boolean;
  sourceRooms?: string[];
}

// flag Memory
type FlagType = 'remoteRoom' | 'sourceRoom';
type remoteRoomPayload = {
  baseRoom: string; // 主基地房间
  // priority: number; // 优先级
  // maxHarvesters: number; // 最大挖矿者数量
  // maxHaulers: number; // 最大运输者数量
  // autoDefense: boolean; // 是否自动防御
  status: 'active' | 'paused' | 'abandoned';
};

type flagPayloadMap = {
  remoteRoom: remoteRoomPayload;
  sourceRoom: { a: 1 };
};

interface FlagMemory<T extends FlagType = 'remoteRoom'> {
  type: T;
  payload: flagPayloadMap[T];
}
