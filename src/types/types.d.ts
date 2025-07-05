type ResourceMemory = {
  availablePositions: { x: number; y: number }[];
  creepsNearSource: Creep[];
  source: Source;
};

interface CreepMemory {
  role?: CustomRoleType;
  task?: CustomTaskType;
  targetSourceId?: string;
}

interface Memory {
  resources: Record<string, ResourceMemory>;
}
