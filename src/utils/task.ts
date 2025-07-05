const taskList = Memory.taskList ?? [];

const register = (task: LoopTask) => {
  taskList.push({ ...task, id: task.fn.name });
  Memory.taskList = taskList;
  console.log(`[Task] Register: ${task.id}`);
  return JSON.stringify(task);
};

const unregister = (task: LoopTask) => {
  taskList.splice(taskList.indexOf(task), 1);
  Memory.taskList = taskList;
};

const getList = () => taskList;

const run = () => {
  if (taskList.length === 0) return;
  for (let task of taskList) {
    console.log(`[Task] Run: ${JSON.stringify(task)}`);
    if (task.status === "completed" || task.status === "failed") {
      continue;
    }
    if (!task.status) task.status = "running";
    const result = task.fn(...task.args);
    console.log(`[Task] Result: ${result}`);
    if (result === OK) {
      task.status = "completed";
      unregister(task);
    } else {
      task.status = "failed";
    }
  }
  Memory.taskList = taskList;
};

export const task = {
  register,
  unregister,
  getList,
  run,
};
