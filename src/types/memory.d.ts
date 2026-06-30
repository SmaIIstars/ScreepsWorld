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
  bornRoom?: string;
  taskList?: string[]; // 接下来执行的任务IDs
  prePosition?: string; // 上一步位置
  // movePath?: `${DirectionConstant}`;
  movePath?: string;
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
  [STRUCTURE_STORAGE]: string;
  [STRUCTURE_FACTORY]: string;
  [STRUCTURE_TERMINAL]: string;
  [STRUCTURE_NUKER]: string;
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
  time: number;
}

// flag Memory
type FlagType = 'sourceRoom' | 'mainRoom' | 'powerRoom';

type RoomPayload = {
  creeps: Partial<Record<CustomRoleType, number>>;
};
type RemoteSourceRoomPayload = {
  mainRoom: string; // 主基地房间
} & RoomPayload;

type MainRoomPayload = {
  factory: {
    run?: boolean;
    creepPosition: `${number},${number}`;
    sourceStructureType: STRUCTURE_TERMINAL | STRUCTURE_STORAGE;
    targetStructureType: STRUCTURE_TERMINAL | STRUCTURE_STORAGE;
    energyThreshold?: number;
    sourceType?: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM;
    sourceThreshold?: number;
    targetType?: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM;
  };
} & RoomPayload;

type FlagPayloadMap = {
  sourceRoom: RemoteSourceRoomPayload;
  mainRoom: MainRoomPayload;
  powerRoom: MainRoomPayload;
};

interface CustomFlag<T extends FlagType = FlagType> extends Flag {
  memory: FlagMemory<T>;
}

interface FlagMemory<T extends FlagType = FlagType> {
  type: T;
  payload: Partial<FlagPayloadMap[T]>;
  status: 'active' | 'paused' | 'abandoned';
  time: number;
}

type StructureMemory = { id: string; type: 'source' | 'spawn' | 'controller' };
