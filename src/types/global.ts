declare global {
  var utils: {
    role: Record<string, BaseRole>;
    task: {
      register: (task: LoopTask) => void;
      unregister: (task: LoopTask) => void;
      getList: () => LoopTask[];
      run: () => void;
    };
  };
}

export {};
