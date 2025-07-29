import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

class Repairer extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'repairer'> = 'repairer';

  constructor() {
    super(Repairer.role);
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
    } else if (task.type === 'repairing') {
      return this.roleTask(creep, task as Task<'repairing'>);
    }

    return TaskExecuteStatusEnum.failed;
  }

  // 维修任务
  roleTask(creep: Creep, task: Task<'repairing'>): TaskExecuteStatusEnum {
    if (creep.store.energy === 0) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    }

    const targetStructure = Game.getObjectById<Structure>(task.toId);
    if (!targetStructure) return TaskExecuteStatusEnum.failed;

    const repairResult = creep.repair(targetStructure);
    if (repairResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetStructure);
      return TaskExecuteStatusEnum.inProgress;
    } else if (repairResult === OK) {
      if (targetStructure.hits >= targetStructure.hitsMax) {
        this.baseSubmitTask(creep, task.id);
        return TaskExecuteStatusEnum.completed;
      }
      return TaskExecuteStatusEnum.inProgress;
    } else {
      return TaskExecuteStatusEnum.failed;
    }
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

    // 2. 有能量则认领修复任务
    else {
      const repairingTasks = taskMap.taskPriorityQueue('repairing');
      return repairingTasks[0]?.id;
    }
  }
}

export default new Repairer();
