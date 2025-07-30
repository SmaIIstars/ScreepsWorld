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
    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
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
    return this.baseTransferTask(creep, task);
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store[RESOURCE_ENERGY] === 0) {
      let harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type === 'harvesting') return true;
          if (task.payload) {
            let allSourceAmount = 0;
            for (const amount of Object.values(task.payload)) {
              allSourceAmount += amount;
            }
            if (allSourceAmount > creep.store.getCapacity() >> 1) return true;
          }
          return false;
        },
        targetPriorityList: [LOOK_RESOURCES, LOOK_RUINS, LOOK_TOMBSTONES, STRUCTURE_CONTAINER],
      });

      // 如果没有WORK组件，则不能认领Source或者Mineral任务
      if (!creep.body.some((part) => part.type === WORK)) {
        harvestingTasks = harvestingTasks.filter((task) => task.publisherType !== LOOK_SOURCES);
        harvestingTasks = harvestingTasks.filter((task) => task.publisherType !== LOOK_MINERALS);
      }

      const targetType = harvestingTasks[0]?.publisherType;
      // 按距离排序
      harvestingTasks
        .filter((task) => task.publisherType === targetType)
        .sort((a, b) => {
          const targetA = Game.getObjectById<Structure>(a.toId);
          const targetB = Game.getObjectById<Structure>(b.toId);
          if (!targetA || !targetB) return 0;
          return creep.pos.getRangeTo(targetA) - creep.pos.getRangeTo(targetB);
        });
      return harvestingTasks[0]?.id;
    }

    // 2. 有能量则认领传输任务
    else {
      const transferringTasks = taskMap.taskPriorityQueue('transferring', {
        filter: (task) => task.type === 'transferring',
        targetPriorityList: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
      });
      return transferringTasks[0]?.id;
    }
  }
}

export default new Harvester();
