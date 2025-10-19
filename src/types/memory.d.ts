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
  currentTaskFromRoom?: string; // 当前执行的任务ID发布房间
  targetId?: string;
  targetRoom?: string;
  taskList?: string[]; // 接下来执行的任务IDs
  prePosition?: string; // 上一步位置
  movePath?: `${DirectionConstant}`;
  movePathIdx?: number;

  /**
   * @deprecated 仅在 tempTask 中 Min 相关用法，后续不推荐使用
   */
  task?: TaskType;
}

// Room Memory
type RoomSourceType = LOOK_SOURCES | LOOK_MINERALS | LOOK_RESOURCES | LOOK_RUINS | LOOK_TOMBSTONES;
type RoomStructureType = {
  [STRUCTURE_LINK]: StructureMemory[];
  [STRUCTURE_OBSERVER]: string[];
};

interface RoomMemory {
  taskMap?: Map<string, import('@/lib/utils/taskMap').Task>;
  taskMapObj?: Record<string, import('@/lib/utils/taskMap').Task>;
  taskMapVersion?: number; // New Map-based version

  creeps?: Record<CustomRoleType, string[]>;
  sources?: Partial<Record<RoomSourceType, string[]>>;
  structure?: Partial<RoomStructureType>;
  enemies?: string[];
  visible?: boolean;
  sourceRooms?: string[];
  mainRooms?: string[];
  costMatrix?: number[];
  costMatrixVer?: number;
}

// flag Memory
type FlagType = 'sourceRoom';
type RemoteSourceRoomPayload = {
  mainRoom: string; // 主基地房间
  creeps: Partial<Record<CustomRoleType, number>>;
};

type FlagPayloadMap = {
  sourceRoom: RemoteSourceRoomPayload;
};

interface CustomFlag<T extends FlagType = FlagType> extends Flag {
  memory: FlagMemory<T>;
}

interface FlagMemory<T extends FlagType = FlagType> {
  type: T;
  payload: Partial<FlagPayloadMap[T]>;
  status: 'active' | 'paused' | 'abandoned';
}

type StructureMemory = { id: string; type: 'source' | 'spawn' | 'controller' };
