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

  interface Memory {
    workers: Record<string, WorkerMeta>;
    events: Record<string, Event[]>;
    rooms: Record<string, any>;
    [key: string]: any;
  }
}

export {};
