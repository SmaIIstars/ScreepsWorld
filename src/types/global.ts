declare global {
  var utils: {
    role: Record<string, BaseRole>;
    task: {
      registerTask: (task: LoopTask) => void;
      unregisterTask: (task: LoopTask) => void;
      getTaskList: () => LoopTask[];
      runTask: () => void;
    };
  };
}

export {};
