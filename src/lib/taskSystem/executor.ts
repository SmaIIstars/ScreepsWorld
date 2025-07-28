import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';

export enum TaskExecuteStatusEnum {
  'completed',
  'failed',
  'inProgress',
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
   * 分配任务给creep
   * @param room 房间对象
   */
  assignTasks(room: Room): void {
    const creeps = Object.values(Game.creeps).filter(
      (creep) => creep.room.name === room.name && !creep.memory.currentTask && !creep.name.includes('Min')
    );
    const tasks = this.taskMap.getByStatus(TaskStatusEnum.published);

    // TODO: 复杂度优化
    // 找到适合这个creep的任务
    for (const creep of creeps) {
      // 根据task的allowedCreepRoles中的顺序进行任务分配，优先分配匹配度高的任务
      let suitableTask: Task | undefined;
      let bestMatchScore = -1;
      if (creep.name === '1') {
        console.log(JSON.stringify(tasks));
      }
      for (const task of tasks) {
        if (['building', 'transferring', 'upgrading', 'repairing'].includes(task.type) && creep.store.energy === 0)
          continue;
        if (!creep.memory.role) continue;
        if (task.assignedTo?.length && task.needCreepCount && task.assignedTo?.length > task.needCreepCount) continue;
        const idx = task.allowedCreepRoles.indexOf(creep.memory.role);
        let matchScore: number;
        if (idx === -1) {
          // 如果allowedCreepRoles为空，表示所有职业都可以做，给最低优先级
          matchScore = task.allowedCreepRoles.length === 0 ? 0 : -1;
        } else {
          // 匹配度高的（index越小优先级越高）
          matchScore = 1000 - idx;
        }
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          suitableTask = task;
        }
      }

      if (suitableTask) {
        // 分配任务给creep
        creep.memory.currentTask = suitableTask.id;
        this.taskMap.updateTask(suitableTask.id, {
          status: TaskStatusEnum.assigned,
          assignedTo: [...(suitableTask.assignedTo || []), creep.name],
        });

        console.log(`[任务系统] 分配任务 ${suitableTask.id} 给 ${creep.name}`);
      }
    }
  }

  /**
   * 执行任务
   * @param room 房间对象
   */
  executeTasks(room: Room): void {
    const creeps = Object.values(Game.creeps).filter(
      (creep) => creep.room.name === room.name && creep.memory.currentTask
    );

    for (const creep of creeps) {
      const task = this.taskMap.getAll().find((t: Task) => t.id === creep.memory.currentTask);
      if (!task) {
        // 任务不存在，清除creep的任务
        delete creep.memory.currentTask;
        continue;
      }

      // 执行任务
      const result = this.executeTask(creep, task);

      if (result === TaskExecuteStatusEnum.completed) {
        // 任务完成
        this.taskMap.updateTask(task.id, { status: TaskStatusEnum.completed });
        delete creep.memory.currentTask;
        console.log(`[任务系统] 任务 ${task.id} 完成`);
      } else if (result === TaskExecuteStatusEnum.failed) {
        // 任务失败，重新分配
        this.taskMap.remove(task.id);
        delete creep.memory.currentTask;
        console.log(`[任务系统] 任务 ${task.id} 失败，删除任务`);
      }
    }
  }

  /**
   * 执行单个任务
   * @param creep creep对象
   * @param task 任务对象
   * @returns 执行结果
   */
  private executeTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    const creepRole = utils?.roles?.[creep.memory.role];
    if (creepRole) {
      return creepRole.run(creep, task);
    }
    return TaskExecuteStatusEnum.failed;
  }
}
