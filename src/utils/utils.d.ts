type LoopTask = {
  id: string;
  fn: (...args: any[]) => any;
  args: any[];
  status?: "running" | "completed" | "failed";
};
