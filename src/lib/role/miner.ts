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
    // 检查周围是否有能量未满的creep
    const targetCreep = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: (creep) => creep.memory.role !== 'miner' && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });
    // 如果有则传能量给它
    if (targetCreep.length) {
      creep.transfer(targetCreep[0], RESOURCE_ENERGY);
    }

    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
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
      return TaskExecuteStatusEnum.inProgress;
    } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    } else if (harvestResult === OK) {
      return TaskExecuteStatusEnum.inProgress;
    }

    console.log(`${creep.name}: Task(${task.id}) failed, return ${harvestResult}`);
    return TaskExecuteStatusEnum.failed;
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    // 如果已经有目标，则直接等待直接该目标的采集任务
    if (creep.memory.targetId) {
      const task = taskMap.taskPriorityQueue('harvesting', {
        filter: (task) => task.type === 'harvesting' && task.publisher === creep.memory.targetId,
      });
      return task[0]?.id;
    }

    // 获取其他矿工的目标ID
    const minerTargetIds = Object.values(Game.creeps)
      .filter((c) => c.memory.role === 'miner' && c.name !== creep.name)
      .map((c) => c.memory.targetId)
      .filter((id) => id);

    // 过滤掉已被其他矿工占用的任务
    const harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
      targetPriorityList: [LOOK_SOURCES, LOOK_MINERALS],
      filter: (task) => {
        if (task.type !== 'harvesting') return false;
        if (task.publisherType !== LOOK_SOURCES && task.publisherType !== LOOK_MINERALS) return false;
        if (minerTargetIds.includes(task.toId)) return false;
        return true;
      },
    });

    const task = harvestingTasks[0];
    if (task?.assignedTo?.length) {
      // 让其他creep取消任务
      for (const creepName of task.assignedTo) {
        const creep = Game.creeps[creepName];
        if (creep) {
          delete creep.memory.currentTask;
        }
      }
    }

    return task?.id;
  }
}

export default new Miner();
