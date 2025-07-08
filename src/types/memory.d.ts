interface CreepMemory {
  role?: CustomRoleType;
  task?: CustomRoleTaskType;
  /**
   * @deprecated 已弃用，请勿再使用，使用targetId替代。
   */
  targetSourceId?: string;
  // creep专注目标的id
  targetId?: string;
}

interface Memory {
  sources: Record<'Source' | 'Mineral', Array<string>>;
  creepsCount: Record<CustomRoleType, number>;
}
