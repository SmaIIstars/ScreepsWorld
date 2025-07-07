type ResourceMemory = {
  // availablePositions: { x: number; y: number }[];
  // creepsNearSource: Creep[];
  source: Source | Resource<ResourceConstant> | Tombstone | Ruin;
};

interface CreepMemory {
  role?: CustomRoleType;
  task?: CustomTaskType;
  /**
   * @deprecated 已弃用，请勿再使用，使用targetId替代。
   */
  targetSourceId?: string;
  // creep专注目标的id
  targetId?: string;
}

interface Memory {
  resources: Record<string, ResourceMemory>;
  taskList: LoopTask[];
  rooms: Record<string, CustomRoomType>;
  sources: Record<'Source' | 'Mineral', Array<string>>;
}
