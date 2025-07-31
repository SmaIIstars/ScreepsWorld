import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap, TaskPublisherType } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

export class Harvester extends BaseRole {
  static readonly role: CustomRoleType = 'harvester';

  constructor(role: CustomRoleType = Harvester.role) {
    super(role);
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

  claimTask(creep: Creep, taskMap: TaskMap): string | undefined {
    // 1. 如果没有能量，先认领获取能量的任务
    if (creep.store[RESOURCE_ENERGY] === 0) {
      let harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type !== 'harvesting') return false;
          if (task.payload) {
            if (
              ([STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL] as TaskPublisherType[]).includes(
                task.publisherType
              )
            )
              return (
                ((task as Task<'harvesting'>)?.payload?.[RESOURCE_ENERGY] ?? 0) >
                creep.store.getFreeCapacity(RESOURCE_ENERGY) >> 1
              );

            let allSourceAmount = 0;
            for (const amount of Object.values(task.payload)) {
              allSourceAmount += amount;
            }
            if (allSourceAmount > creep.store.getFreeCapacity() >> 1) return true;
          }
          if (task.toRoomName === creep.room.name) return true;
          return false;
        },
        targetPriorityList: [
          LOOK_RESOURCES,
          LOOK_RUINS,
          LOOK_TOMBSTONES,
          STRUCTURE_CONTAINER,
          STRUCTURE_TERMINAL,
          STRUCTURE_STORAGE,
        ],
      });

      // 如果没有WORK组件，则不能认领Source或者Mineral任务
      if (!creep.body.some((part) => part.type === WORK)) {
        harvestingTasks = harvestingTasks.filter((task) => task.publisherType !== LOOK_SOURCES);
        harvestingTasks = harvestingTasks.filter((task) => task.publisherType !== LOOK_MINERALS);
      }

      const targetType = harvestingTasks[0]?.publisherType;
      // 按距离排序
      harvestingTasks
        .filter((task) => {
          if (task.publisherType !== targetType) return false;
          return true;
        })
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
        filter: (task) => {
          if (task.type !== 'transferring') return false;
          if (task.assignedTo?.length && task.needCreepCount && task.assignedTo?.length >= task.needCreepCount)
            return false;
          return true;
        },
        targetPriorityList: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
      });
      return transferringTasks[0]?.id;
    }
  }
}

export default new Harvester();
