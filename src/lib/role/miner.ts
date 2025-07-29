import { EnergyStoreTargetType } from '@/constant';
import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';

class Miner extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'miner'> = 'miner';

  constructor() {
    super(Miner.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, taskId: string) {
    const task = global.rooms[creep.room.name]?.taskMap?.[taskId];
    if (!task) return TaskExecuteStatusEnum.failed;
    creep.memory.targetId = task.toId;
    return this.roleTask(creep, task as Task<'harvesting'>);
  }

  // 采矿任务
  roleTask(creep: Creep, task: Task<'harvesting'>): TaskExecuteStatusEnum {
    const targetSource = Game.getObjectById<Source>(task.toId);
    if (!targetSource) return TaskExecuteStatusEnum.failed;

    const harvestResult = creep.harvest(targetSource);
    if (harvestResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetSource);
    } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    } else if (harvestResult === OK) {
      return TaskExecuteStatusEnum.inProgress;
    }
    return TaskExecuteStatusEnum.failed;
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store.energy === 0) {
      const harvestingTasks = taskMap.taskPriorityQueue('harvesting', [LOOK_SOURCES, LOOK_MINERALS]);
      return harvestingTasks[0]?.id;
    }
  }
}

export default new Miner();
