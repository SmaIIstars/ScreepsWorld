interface CreepMemory {
  role?: CustomRoleType;
  task?: CustomRoleTaskType;
  /**
   * @deprecated 已弃用，请勿再使用，使用targetId替代。
   */
  targetSourceId?: string;
  // creep专注目标的id
  targetId?: string;
  targetRoomName?: string;
  // 任务系统相关
  currentTask?: string; // 当前执行的任务ID
  cacheTargetStoreId?: string;
}

interface Memory {
  sources: Record<'Source' | 'Mineral', Array<string>>;
  creepsCount: Record<CustomRoleType, number>;
}
