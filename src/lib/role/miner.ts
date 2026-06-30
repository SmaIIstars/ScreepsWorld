import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

export class Miner extends BaseRole {
  static readonly role: CustomRoleType = 'miner';

  constructor(role: CustomRoleType = Miner.role) {
    super(role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, taskId: string) {
    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
    if (!task) return TaskExecuteStatusEnum.failed;
    const targetSource = Game.getObjectById<Source>(task.toId);
    if (!targetSource) return TaskExecuteStatusEnum.failed;

    if (creep.pos.isNearTo(targetSource)) {
      const res = creep.room.lookAtArea(creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true);
      const targets = res.filter((i) => {
        if (i.type === LOOK_CREEPS) return creep.memory.role !== 'miner' && creep.store.getFreeCapacity() > 0;
        if (i.type === LOOK_STRUCTURES && i.structure instanceof StructureLink) {
          return i.structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
        return false;
      });

      const target = targets?.[0];
      if (target) {
        if (target.creep) creep.transfer(target.creep, RESOURCE_ENERGY);
        if (target.structure instanceof Structure && target.structure.structureType === STRUCTURE_LINK) {
          creep.transfer(target.structure, RESOURCE_ENERGY);
        }
      }

      creep.memory.targetId = task.toId;
    }
    return this.roleTask(creep, task as Task<'harvesting'>);
  }

  // 采矿任务
  roleTask(creep: Creep, task: Task<'harvesting'>): TaskExecuteStatusEnum {
    const targetSource = Game.getObjectById<Source>(task.toId);
    if (!targetSource) return TaskExecuteStatusEnum.failed;

    if (targetSource instanceof Mineral) {
      const executor = creep.room.find<StructureExtractor>(FIND_MY_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_EXTRACTOR,
      })?.[0];
      if (executor?.cooldown) return TaskExecuteStatusEnum.inProgress;
    }

    const harvestResult = creep.harvest(targetSource);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetSource.pos);
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

      // if (!task[0]) delete creep.memory.targetId;
      return task[0]?.id;
    }

    // 获取其他矿工的目标ID
    const minerTargetIds = Object.values(Game.creeps)
      .filter(
        (c) =>
          ['miner', 'remoteMiner'].includes(c.memory.role) && c.name !== creep.name && creep.room.name === c.room.name
      )
      .map((c) => c.memory.targetId)
      .filter((id) => id);

    // 过滤掉已被其他矿工占用的任务
    const harvestingTasks = taskMap.taskPriorityQueue('harvesting', {
      targetPriorityList: [LOOK_SOURCES, LOOK_MINERALS],
      filter: (task) => {
        if (task.type !== 'harvesting') return false;
        if (minerTargetIds.includes(task.toId)) return false;
        if (LOOK_MINERALS !== task.publisherType && LOOK_SOURCES !== task.publisherType) return false;
        // if (task.needCreepCount >= 0 && task.assignedTo.length >= task.needCreepCount) return false;
        return true;
      },
    });

    const task = harvestingTasks[0];
    if (task) {
      const taskSystem = new TaskMap(creep.room.name);
      if (!task.assignedTo.includes(creep.name)) {
        taskSystem.updateTask(task.id, { assignedTo: [...task.assignedTo, creep.name] });
      }
    }

    return task?.id;
  }
}

export default new Miner();
