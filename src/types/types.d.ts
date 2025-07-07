type ResourceMemory = {
  // availablePositions: { x: number; y: number }[];
  // creepsNearSource: Creep[];
  source: Source | Resource<ResourceConstant> | Tombstone | Ruin;
};

interface CreepMemory {
  role?: CustomRoleType;
  task?: CustomTaskType;
  targetSourceId?: string;
}

interface Memory {
  resources: Record<string, ResourceMemory>;
  taskList: LoopTask[];
  rooms: Record<string, CustomRoomType>;
  sources: Record<'Source' | 'Mineral', Array<string>>;
}
