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
    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
    if (!task) return TaskExecuteStatusEnum.failed;
    if (task.type === 'harvesting') {
      return this.baseHarvestTask(creep, task as Task<'harvesting'>);
    } else if (task.type === 'repairing') {
      return this.roleTask(creep, task as Task<'repairing'>);
    } else if (task.type === 'transferring') {
      return this.baseTransferTask(creep, task as Task<'transferring'>);
    }

    return TaskExecuteStatusEnum.failed;
  }

  // 维修任务
  roleTask(creep: Creep, task: Task<'repairing'>): TaskExecuteStatusEnum {
    return this.baseRepairTask(creep, task);
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store.energy === 0) {
      const harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type !== 'harvesting') return false;
          if (task.toRoomName !== creep.room.name) return false;
          if (task.publisherType === STRUCTURE_STORAGE && !(task as Task<'harvesting'>).payload?.[RESOURCE_ENERGY])
            return false;
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

    // 2. 有能量则认领修复任务
    else {
      // 优先接塔的transferring任务
      const transferringTasks = taskMap.taskPriorityQueue('transferring', {
        filter: (task) => task.type === 'transferring' && task.publisherType === STRUCTURE_TOWER,
        targetPriorityList: [STRUCTURE_TOWER],
      });
      if (transferringTasks[0]) return transferringTasks[0]?.id;

      let repairingTasks = taskMap.taskPriorityQueue('repairing', {
        targetPriorityList: [STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTAINER, STRUCTURE_WALL],
        filter: (task) => {
          if (task.type !== 'repairing') return false;
          if (task.toRoomName !== creep.room.name) return false;
          if (task.assignedTo?.length && task.needCreepCount && task.assignedTo?.length >= task.needCreepCount)
            return false;
          return true;
        },
      });

      return repairingTasks[0]?.id;
    }
  }
}

export default new Repairer();
