// Project-specific memory type extensions
// Augments @types/screeps global interfaces with custom fields

declare global {
  interface CreepMemory {
    role?: string;
    currentEventId?: string;
    currentTask?: string;
    targetId?: string;
    targetRoomName?: string;
    [key: string]: any;
  }

  interface RoomMemory {
    minerAssignments?: Record<string, string>; // sourceId → minerName
    _world?: {
      resources: Record<string, import('../structures/world').ResourceSnapshot>;
      tombs: Record<string, import('../structures/world').ResourceSnapshot>;
      ruins: Record<string, import('../structures/world').ResourceSnapshot>;
      hostileIds: string[];
      lastScan: number;
    };
    [key: string]: any;
  }

  interface Memory {
    // note: creep runtime data stored in Memory.creeps
    events: Record<string, Record<string, Event>>;
    rooms: Record<string, RoomMemory>;
    [key: string]: any;
  }
}

export {};
