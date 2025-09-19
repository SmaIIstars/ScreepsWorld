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
  targetRoom?: string;
  taskList?: string[]; // 接下来执行的任务IDs
  movePath?:
    | string
    | Array<{
        x: number;
        y: number;
        dx: number;
        dy: number;
        direction: TOP | TOP_RIGHT | RIGHT | BOTTOM_RIGHT | BOTTOM | BOTTOM_LEFT | LEFT | TOP_LEFT;
      }>;

  /**
   * @deprecated 仅在 tempTask 中 Min 相关用法，后续不推荐使用
   */
  task?: TaskType;
}

// Room Memory
type RoomSourceType = LOOK_SOURCES | LOOK_MINERALS | LOOK_RESOURCES | LOOK_RUINS | LOOK_TOMBSTONES;
type RoomStructureType = STRUCTURE_LINK;

interface RoomMemory {
  taskMap?: Map<string, import('@/lib/utils/taskMap').Task>;
  taskMapObj?: Record<string, import('@/lib/utils/taskMap').Task>;
  taskMapVersion?: number; // New Map-based version
  creepsCount?: Record<CustomRoleType, number>;
  sources?: Partial<Record<RoomSourceType, string[]>>;
  structure?: Partial<Record<RoomStructureType, StructureMemory[]>>;
  enemies?: string[];
  visible?: boolean;
  sourceRooms?: string[];
  mainRooms?: string[];
}

// flag Memory
type FlagType = 'sourceRoom';
type RemoteSourceRoomPayload = {
  mainRoom: string; // 主基地房间
  remoteMiners: number; // 需要挖矿者数量
  remoteHarvesters: number; // 需要运输者数量
  remoteClaimers: number; // 需要claimer数量
  status: 'active' | 'paused' | 'abandoned';
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
}

type StructureMemory = { id: string; type: 'source' | 'spawn' | 'controller' };
