import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap, TaskStatusEnum } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

class Harvester extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'harvester'> = 'harvester';

  constructor() {
    super(Harvester.role);
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
    } else if (task.type === 'transferring') {
      return this.roleTask(creep, task as Task<'transferring'>);
    }
    return TaskExecuteStatusEnum.failed;
  }

  // 传输任务
  roleTask(creep: Creep, task: Task<'transferring'>): TaskExecuteStatusEnum {
    const target = Game.getObjectById<Structure>(task.toId);
    if (!target) return TaskExecuteStatusEnum.failed;

    for (const resourceType of task.payload?.resourceTypes ?? []) {
      const transferResult = creep.transfer(target, resourceType);

      // 没在附近
      if (transferResult === ERR_NOT_IN_RANGE) {
        this.baseMoveTo(creep, target);
        return TaskExecuteStatusEnum.inProgress;
      } else if (transferResult === ERR_FULL) {
        // target 满了
        this.baseSubmitTask(creep, task.id);
        return TaskExecuteStatusEnum.completed;
      } else if (transferResult === OK) {
        // 检查是否还有其他需要转移的资源
        let hasMoreResources = false;
        for (const [resourceType, amount] of Object.entries(creep.store)) {
          if (amount > 0) {
            // 如果任务没有指定资源类型，则表示可以转移所有资源
            if (!task.payload?.resourceTypes) {
              hasMoreResources = true;
            } else if (task.payload?.resourceTypes.includes(resourceType as ResourceConstant)) {
              hasMoreResources = true;
            }
            break;
          }
        }
        if (!hasMoreResources) {
          this.baseSubmitTask(creep, task.id);
          return TaskExecuteStatusEnum.completed;
        } else {
          return TaskExecuteStatusEnum.inProgress;
        }
      }
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
      ]);
      return harvestingTasks[0]?.id;
    }

    // 2. 有能量则认领建造任务
    else {
      const transferringTasks = taskMap.taskPriorityQueue('transferring');
      return transferringTasks[0]?.id;
    }
  }
}

export default new Harvester();
