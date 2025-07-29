import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

class Builder extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'builder'> = 'builder';
  constructor() {
    super(Builder.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, taskId: string) {
    const task = global.rooms[creep.room.name]?.taskMap?.[taskId];
    if (!task) return TaskExecuteStatusEnum.failed;

    if (task.type === 'harvesting') {
      return this.baseHarvestTask(creep, task as Task<'harvesting'>);
    } else if (task.type === 'building') {
      return this.roleTask(creep, task as Task<'building'>);
    }
    return TaskExecuteStatusEnum.failed;
  }

  // 建筑任务
  roleTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    if (creep.store.energy === 0) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    }

    const targetStructure = Game.getObjectById<ConstructionSite>(task.toId);
    if (!targetStructure) return TaskExecuteStatusEnum.failed;

    const repairResult = creep.build(targetStructure);
    if (repairResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetStructure);
    } else if (repairResult === OK) {
      if (targetStructure.progress >= targetStructure.progressTotal) {
        this.baseSubmitTask(creep, task.id);
        return TaskExecuteStatusEnum.completed;
      }
      return TaskExecuteStatusEnum.inProgress;
    }
    return TaskExecuteStatusEnum.failed;
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store.energy === 0) {
      const harvestingTasks = taskMap.taskPriorityQueue('harvesting', [
        LOOK_RESOURCES,
        LOOK_RUINS,
        LOOK_TOMBSTONES,
        STRUCTURE_CONTAINER,
        STRUCTURE_TERMINAL,
        STRUCTURE_STORAGE,
        LOOK_SOURCES,
      ]);
      return harvestingTasks[0]?.id;
    }

    // 2. 有能量则认领建造任务
    else {
      const buildingTasks = taskMap.taskPriorityQueue('building');
      return buildingTasks[0]?.id;
    }
  }
}
export default new Builder();
