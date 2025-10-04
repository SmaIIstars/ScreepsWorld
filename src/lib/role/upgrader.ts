import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import type { Task, TaskMap } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

class Upgrader extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'upgrader'> = 'upgrader';

  constructor() {
    super(Upgrader.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, taskId: string) {
    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
    if (!task) return TaskExecuteStatusEnum.failed;
    if (task.type === 'harvesting') {
      return this.baseHarvestTask(creep, task as Task<'harvesting'>);
    } else if (task.type === 'upgrading') {
      return this.roleTask(creep, task as Task<'upgrading'>);
    }

    return TaskExecuteStatusEnum.failed;
  }

  // 升级任务
  roleTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    // TODO: 可以优化，OK 是纳入计划，这时候还有能量，但是如果通过 -6 状态码判断，又会多触发一次操作, 需要判断这次OK之后能量是否归零，可以减少一个tick
    if (creep.store.energy === 0) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    }

    const targetController = Game.getObjectById<StructureController>(task.toId);
    if (!targetController) return TaskExecuteStatusEnum.failed;

    const upgradeResult = creep.upgradeController(targetController);
    if (upgradeResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetController);
      return TaskExecuteStatusEnum.inProgress;
    } else if (upgradeResult === OK) {
      return TaskExecuteStatusEnum.inProgress;
    } else {
      console.log(`${creep.name}: Task(${task.id}) failed, return ${upgradeResult}`);
      return TaskExecuteStatusEnum.failed;
    }
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      const harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type !== 'harvesting') return false;
          if (task.toRoomName !== creep.room.name) return false;
          if (
            ((task as Task<'harvesting'>).payload?.[RESOURCE_ENERGY] ?? 0) <
            creep.store.getFreeCapacity(RESOURCE_ENERGY) >> 1
          )
            return false;
          return true;
        },
        targetPriorityList: [
          LOOK_RESOURCES,
          LOOK_RUINS,
          LOOK_TOMBSTONES,
          STRUCTURE_LINK,
          STRUCTURE_CONTAINER,
          STRUCTURE_TERMINAL,
          STRUCTURE_STORAGE,
          LOOK_SOURCES,
        ],
      });
      return harvestingTasks[0]?.id;
    }

    // 2. 有能量则认领升级任务
    else {
      const upgradingTasks = taskMap.taskPriorityQueue('upgrading', {
        filter: (task) => task.type === 'upgrading' && task.toRoomName === creep.room.name,
      });
      return upgradingTasks[0]?.id;
    }
  }
}

export default new Upgrader();
