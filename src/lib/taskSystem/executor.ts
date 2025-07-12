import { Task, TaskQueue } from '../utils/taskQueue';

/**
 * 任务执行器
 * 负责将任务分配给creep并执行任务
 */
export class TaskExecutor {
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  /**
   * 分配任务给creep
   * @param room 房间对象
   */
  assignTasks(room: Room): void {
    const creeps = Object.values(Game.creeps).filter((creep) => creep.room.name === room.name);
    const tasks = this.taskQueue.getAll().filter((task) => task.status === 'published');

    for (const creep of creeps) {
      // 如果creep已经有任务，跳过
      if (creep.memory.currentTask) continue;

      // 找到适合这个creep的任务
      const suitableTask = tasks.find((task) => task.allowedCreepRoles.includes(creep.memory.role || ''));

      if (suitableTask) {
        // 分配任务给creep
        creep.memory.currentTask = suitableTask.id;
        suitableTask.status = 'assigned';
        suitableTask.assignedTo = suitableTask.assignedTo || [];
        suitableTask.assignedTo.push(creep.name);

        console.log(`[任务系统] 分配任务 ${suitableTask.id} 给 ${creep.name}`);
      }
    }
  }

  /**
   * 执行任务
   * @param room 房间对象
   */
  executeTasks(room: Room): void {
    const creeps = Object.values(Game.creeps).filter((creep) => creep.room.name === room.name);

    for (const creep of creeps) {
      if (!creep.memory.currentTask) continue;

      const task = this.taskQueue.getAll().find((t) => t.id === creep.memory.currentTask);
      if (!task) {
        // 任务不存在，清除creep的任务
        delete creep.memory.currentTask;
        continue;
      }

      // 执行任务
      const result = this.executeTask(creep, task);

      if (result === 'completed') {
        // 任务完成
        task.status = 'completed';
        delete creep.memory.currentTask;
        console.log(`[任务系统] 任务 ${task.id} 完成`);
      } else if (result === 'failed') {
        // 任务失败，重新分配
        task.status = 'published';
        delete creep.memory.currentTask;
        console.log(`[任务系统] 任务 ${task.id} 失败，重新分配`);
      }
    }
  }

  /**
   * 执行单个任务
   * @param creep creep对象
   * @param task 任务对象
   * @returns 执行结果
   */
  private executeTask(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    switch (task.type) {
      case 'harvest':
        return this.executeHarvestTask(creep, task);
      case 'upgrade':
        return this.executeUpgradeTask(creep, task);
      case 'build':
        return this.executeBuildTask(creep, task);
      case 'repair':
        return this.executeRepairTask(creep, task);
      case 'transfer':
        return this.executeTransferTask(creep, task);
      default:
        return 'failed';
    }
  }

  /**
   * 执行采集任务
   */
  private executeHarvestTask(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    const source = Game.getObjectById(task.fromId as Id<Source>);
    if (!source) return 'failed';

    // 如果creep满了，任务完成
    if (creep.store.getFreeCapacity() === 0) {
      return 'completed';
    }

    // 如果source没能量了，任务完成
    if (source.energy === 0) {
      return 'completed';
    }

    // 执行采集
    const result = creep.harvest(source);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(source);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 执行升级任务
   */
  private executeUpgradeTask(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    const controller = Game.getObjectById(task.fromId as Id<StructureController>);
    if (!controller) return 'failed';

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      // 寻找能量源
      const energySource = creep.room.find(FIND_SOURCES)[0];
      if (energySource) {
        creep.moveTo(energySource);
      }
      return 'in_progress';
    }

    // 执行升级
    const result = creep.upgradeController(controller);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(controller);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 执行建造任务
   */
  private executeBuildTask(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    const site = Game.getObjectById(task.fromId as Id<ConstructionSite>);
    if (!site) return 'completed'; // 建筑完成

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      // 寻找能量源
      const energySource = creep.room.find(FIND_SOURCES)[0];
      if (energySource) {
        creep.moveTo(energySource);
      }
      return 'in_progress';
    }

    // 执行建造
    const result = creep.build(site);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(site);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 执行维修任务
   */
  private executeRepairTask(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    const structure = Game.getObjectById(task.fromId as Id<Structure>);
    if (!structure) return 'failed';

    // 如果建筑已经修好了，任务完成
    if (structure.hits === structure.hitsMax) {
      return 'completed';
    }

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      // 寻找能量源
      const energySource = creep.room.find(FIND_SOURCES)[0];
      if (energySource) {
        creep.moveTo(energySource);
      }
      return 'in_progress';
    }

    // 执行维修
    const result = creep.repair(structure);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(structure);
        return 'in_progress';
      default:
        return 'failed';
    }
  }

  /**
   * 执行传输任务
   */
  private executeTransferTask(creep: Creep, task: Task): 'completed' | 'failed' | 'in_progress' {
    const target = Game.getObjectById(task.toId as Id<AnyOwnedStructure>);
    if (!target) return 'failed';

    // 如果目标已经满了，任务完成
    if ('store' in target && (target as any).store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      return 'completed';
    }

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      // 寻找能量源
      const energySource = creep.room.find(FIND_SOURCES)[0];
      if (energySource) {
        creep.moveTo(energySource);
      }
      return 'in_progress';
    }

    // 执行传输
    const result = creep.transfer(target, RESOURCE_ENERGY);
    switch (result) {
      case OK:
        return 'in_progress';
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target);
        return 'in_progress';
      default:
        return 'failed';
    }
  }
}
