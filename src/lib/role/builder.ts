import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap } from '../utils/taskMap';
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
    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
    if (!task) return TaskExecuteStatusEnum.failed;

    if (task.type === 'harvesting') {
      return this.baseHarvestTask(creep, task as Task<'harvesting'>);
    } else if (task.type === 'building') {
      return this.roleTask(creep, task as Task<'building'>);
    } else if (task.type === 'repairing') {
      return this.baseRepairTask(creep, task as Task<'repairing'>);
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

    const buildResult = creep.build(targetStructure);
    if (buildResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetStructure);
      return TaskExecuteStatusEnum.inProgress;
    } else if (buildResult === OK) {
      if (targetStructure.progress >= targetStructure.progressTotal) {
        this.baseSubmitTask(creep, task.id);
        return TaskExecuteStatusEnum.completed;
      }
      return TaskExecuteStatusEnum.inProgress;
    }

    console.log(`${creep.name}: Task(${task.id}) failed, return ${buildResult}`);
    return TaskExecuteStatusEnum.failed;
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store.energy === 0) {
      const harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type !== 'harvesting') return false;
          if (task.toRoomName !== creep.room.name) return false;
          if (!(task as Task<'harvesting'>).payload?.[RESOURCE_ENERGY]) return false;
          if (
            task.publisherType === LOOK_RESOURCES &&
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
          STRUCTURE_CONTAINER,
          STRUCTURE_TERMINAL,
          STRUCTURE_STORAGE,
          LOOK_SOURCES,
        ],
      });
      return harvestingTasks[0]?.id;
    }

    // 2. 有能量则认领建造任务
    else {
      const buildingTasks = taskMap.taskPriorityQueue('building', {
        filter: (task) => ['building', 'repairing'].includes(task.type) && task.toRoomName === creep.room.name,
      });
      if (buildingTasks[0]) return buildingTasks[0]?.id;

      // 维修任务
      const repairingTasks = taskMap.taskPriorityQueue('repairing', {
        filter: (task) => task.type === 'repairing' && task.toRoomName === creep.room.name,
      });
      return repairingTasks[0]?.id;
    }
  }
}
export default new Builder();
