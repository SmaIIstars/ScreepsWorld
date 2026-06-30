import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';

export enum TaskExecuteStatusEnum {
  'inProgress',
  'completed',
  'failed',
}

/**
 * 任务执行器
 * 负责将任务分配给creep并执行任务
 */
export class TaskExecutor {
  private taskMap: TaskMap;

  constructor(taskMap: TaskMap) {
    this.taskMap = taskMap;
  }

  /**
   * 执行任务
   * @param room 房间对象
   */
  executeTasks(room: Room): void {
    const creeps = room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.currentTask });

    for (const creep of creeps) {
      if (!creep.memory.currentTask) continue;
      let task = undefined;
      if (creep.memory.targetRoom) {
        task = new TaskMap(creep.memory.targetRoom).get(creep.memory.currentTask);
      } else {
        task = this.taskMap.getAll().find((t: Task) => t.id === creep.memory.currentTask);
      }
      if (!task) {
        // 任务不存在，清除creep的任务
        delete creep.memory.currentTask;
        continue;
      }
      // 执行任务
      const result = this.executeTask(creep, task.id);

      if (result === TaskExecuteStatusEnum.completed) {
        // 任务完成
        this.taskMap.updateTask(task.id, { status: TaskStatusEnum.completed });
        delete creep.memory.currentTask;
      } else if (result === TaskExecuteStatusEnum.failed) {
        // 任务失败，重新分配
        this.taskMap.remove(task.id);
        delete creep.memory.currentTask;
        console.log(`${creep.name}[${creep.pos}] 的任务 ${task.id} 失败，删除任务`);
      }
    }
  }

  /**
   * 执行单个任务
   * @param creep creep对象
   * @param task 任务对象
   * @returns 执行结果
   */
  private executeTask(creep: Creep, taskId: string): TaskExecuteStatusEnum {
    const creepRole = utils?.roles?.[creep.memory.role];
    if (creepRole) {
      return creepRole.run(creep, taskId);
    }
    return TaskExecuteStatusEnum.failed;
  }
}
