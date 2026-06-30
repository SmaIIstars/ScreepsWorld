import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap } from '../utils/taskMap';
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
      const resource = Object.entries(task.payload ?? {}).filter(([k, v]) => {
        return v > 0;
      })[0][0] as ResourceConstant;

      return this.baseHarvestTask(creep, task as Task<'harvesting'>, resource);
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
    const transferringTasks = taskMap.taskPriorityQueue('transferring', {
      filter: (task) => {
        if (task.needCreepCount >= 0 && task.assignedTo.length >= task.needCreepCount) return false;
        return true;
      },
      targetPriorityList: [
        STRUCTURE_SPAWN,
        STRUCTURE_EXTENSION,
        STRUCTURE_POWER_SPAWN,
        STRUCTURE_LAB,
        STRUCTURE_STORAGE,
        STRUCTURE_CONTAINER,
      ],
    });
    // 先判断是否有存储任务认领
    if (!transferringTasks.length) return;
    // 判断是否已经填满生产需要的能量，优先级最高
    const isProductEnergyFull = !['spawn', 'extension'].includes(transferringTasks[0].publisherType);
    // 如果现在是空状态则可以认领采集任务
    if (creep.store.getFreeCapacity() === creep.store.getCapacity()) {
      // 如果首个传输任务不是Extension或Spawn，则表明可以采集能量之外的资源
      let harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type !== 'harvesting') return false;
          if (task.toRoomName !== creep.room.name) return false;
          if (!isProductEnergyFull) {
            // 如果生产能量没满则优先采集能量
            return (
              ((task as Task<'harvesting'>)?.payload?.[RESOURCE_ENERGY] ?? 0) >
              creep.store.getFreeCapacity(RESOURCE_ENERGY) >> 1
            );
          } else {
            const allSourceAmount = Object.values(task.payload ?? {}).reduce((pre, cur) => {
              pre += cur;
              return pre;
            }, 0);
            if (allSourceAmount > creep.store.getFreeCapacity() >> 1) return true;
          }

          // const target = Game.getObjectById(task.publisher);
          // if (target instanceof Source) return !!target.energy;
          // if (target instanceof Mineral) return !!target.mineralAmount && isProductEnergyFull;
          // if (!target || !('store' in target)) return false;
          // if ((target.store as StoreDefinition).getUsedCapacity() > creep.store.getFreeCapacity() >> 1) return true;
          return false;
        },
        targetPriorityList: [
          LOOK_RESOURCES,
          LOOK_RUINS,
          LOOK_TOMBSTONES,
          STRUCTURE_LINK,
          STRUCTURE_CONTAINER,
          STRUCTURE_STORAGE,
          STRUCTURE_TERMINAL,
          STRUCTURE_LAB,
        ],
      }) as Task<'harvesting'>[];

      // if (creep.room.name === 'E13N15') {
      //   console.log(JSON.stringify(harvestingTasks.length));
      // }

      // 如果没有WORK组件，则不能认领Source或者Mineral任务
      if (!creep.body.some((part) => part.type === WORK)) {
        harvestingTasks = harvestingTasks.filter((task) => task.publisherType !== LOOK_SOURCES);
        harvestingTasks = harvestingTasks.filter((task) => task.publisherType !== LOOK_MINERALS);
      }

      const targetType = harvestingTasks[0]?.publisherType;
      // 按距离排序
      const curClaimTask = harvestingTasks
        .filter((task) => {
          if (task.publisherType !== targetType) return false;
          return true;
        })
        .sort((a, b) => {
          const targetA = Game.getObjectById<Structure>(a.toId);
          const targetB = Game.getObjectById<Structure>(b.toId);
          if (!targetA || !targetB) return 0;
          return creep.pos.getRangeTo(targetA) - creep.pos.getRangeTo(targetB);
        })[0];

      if (!curClaimTask) return;
      taskMap.updateTask(curClaimTask.id, { assignedTo: [...curClaimTask.assignedTo, creep.name] });
      return curClaimTask.id;
    } else {
      // 如果现在有除能量外的资源，则先存入到store
      if (creep.store[RESOURCE_ENERGY] === 0) {
        return transferringTasks.filter((task) => task.publisherType === STRUCTURE_STORAGE)[0]?.id;
      } else {
        // 有资源则认领传输任务
        const currentTargetType = transferringTasks[0]?.publisherType;
        return transferringTasks
          .filter((task) => task.publisherType === currentTargetType)
          .sort((a, b) => {
            const targetA = Game.getObjectById<Structure>(a.toId);
            const targetB = Game.getObjectById<Structure>(b.toId);
            if (!targetA || !targetB) return 0;
            return creep.pos.getRangeTo(targetA) - creep.pos.getRangeTo(targetB);
          })[0]?.id;
      }
    }
  }
}

export default new Harvester();
