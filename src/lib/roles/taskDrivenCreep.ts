import { Task, TaskQueue } from '../utils/taskQueue';

/**
 * 任务驱动的Creep角色系统
 * 让creep能够执行任务系统分配的任务
 */
export class TaskDrivenCreep {
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  /**
   * 运行creep逻辑
   * @param creep creep对象
   */
  run(creep: Creep): void {
    // 如果creep没有当前任务，尝试获取任务
    if (!creep.memory.currentTask) {
      this.tryGetTask(creep);
      return;
    }

    // 执行当前任务
    this.executeCurrentTask(creep);
  }

  /**
   * 尝试获取任务
   * @param creep creep对象
   */
  private tryGetTask(creep: Creep): void {
    const availableTasks = this.taskQueue
      .getAll()
      .filter((task) => task.status === 'published' && task.allowedCreepRoles.includes(creep.memory.role || ''));

    if (availableTasks.length > 0) {
      // 选择第一个可用任务
      const task = availableTasks[0];
      creep.memory.currentTask = task.id;
      task.status = 'assigned';
      task.assignedTo = task.assignedTo || [];
      task.assignedTo.push(creep.name);

      console.log(`[任务驱动] ${creep.name} 获取任务: ${task.id}`);
    }
  }

  /**
   * 执行当前任务
   * @param creep creep对象
   */
  private executeCurrentTask(creep: Creep): void {
    const task = this.taskQueue.getAll().find((t) => t.id === creep.memory.currentTask);
    if (!task) {
      // 任务不存在，清除任务
      delete creep.memory.currentTask;
      return;
    }

    // 根据任务类型执行相应逻辑
    switch (task.type) {
      case 'harvest':
        this.executeHarvestTask(creep, task);
        break;
      case 'upgrade':
        this.executeUpgradeTask(creep, task);
        break;
      case 'build':
        this.executeBuildTask(creep, task);
        break;
      case 'repair':
        this.executeRepairTask(creep, task);
        break;
      case 'transfer':
        this.executeTransferTask(creep, task);
        break;
      default:
        // 未知任务类型，清除任务
        delete creep.memory.currentTask;
        break;
    }
  }

  /**
   * 执行采集任务
   */
  private executeHarvestTask(creep: Creep, task: Task): void {
    const source = Game.getObjectById(task.fromId as Id<Source>);
    if (!source) {
      this.completeTask(creep, task);
      return;
    }

    // 如果creep满了，任务完成
    if (creep.store.getFreeCapacity() === 0) {
      this.completeTask(creep, task);
      return;
    }

    // 如果source没能量了，任务完成
    if (source.energy === 0) {
      this.completeTask(creep, task);
      return;
    }

    // 执行采集
    const result = creep.harvest(source);
    switch (result) {
      case OK:
        creep.say('⛏️');
        break;
      case ERR_NOT_IN_RANGE:
        creep.moveTo(source);
        break;
      default:
        this.failTask(creep, task);
        break;
    }
  }

  /**
   * 执行升级任务
   */
  private executeUpgradeTask(creep: Creep, task: Task): void {
    const controller = Game.getObjectById(task.fromId as Id<StructureController>);
    if (!controller) {
      this.completeTask(creep, task);
      return;
    }

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      this.getEnergy(creep);
      return;
    }

    // 执行升级
    const result = creep.upgradeController(controller);
    switch (result) {
      case OK:
        creep.say('⚡');
        break;
      case ERR_NOT_IN_RANGE:
        creep.moveTo(controller);
        break;
      default:
        this.failTask(creep, task);
        break;
    }
  }

  /**
   * 执行建造任务
   */
  private executeBuildTask(creep: Creep, task: Task): void {
    const site = Game.getObjectById(task.fromId as Id<ConstructionSite>);
    if (!site) {
      this.completeTask(creep, task);
      return;
    }

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      this.getEnergy(creep);
      return;
    }

    // 执行建造
    const result = creep.build(site);
    switch (result) {
      case OK:
        creep.say('🚧');
        break;
      case ERR_NOT_IN_RANGE:
        creep.moveTo(site);
        break;
      default:
        this.failTask(creep, task);
        break;
    }
  }

  /**
   * 执行维修任务
   */
  private executeRepairTask(creep: Creep, task: Task): void {
    const structure = Game.getObjectById(task.fromId as Id<Structure>);
    if (!structure) {
      this.completeTask(creep, task);
      return;
    }

    // 如果建筑已经修好了，任务完成
    if (structure.hits === structure.hitsMax) {
      this.completeTask(creep, task);
      return;
    }

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      this.getEnergy(creep);
      return;
    }

    // 执行维修
    const result = creep.repair(structure);
    switch (result) {
      case OK:
        creep.say('🔧');
        break;
      case ERR_NOT_IN_RANGE:
        creep.moveTo(structure);
        break;
      default:
        this.failTask(creep, task);
        break;
    }
  }

  /**
   * 执行传输任务
   */
  private executeTransferTask(creep: Creep, task: Task): void {
    const target = Game.getObjectById(task.toId as Id<AnyOwnedStructure>);
    if (!target) {
      this.completeTask(creep, task);
      return;
    }

    // 如果目标已经满了，任务完成
    if ('store' in target && (target as any).store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      this.completeTask(creep, task);
      return;
    }

    // 如果creep没能量了，需要重新获取能量
    if (creep.store[RESOURCE_ENERGY] === 0) {
      this.getEnergy(creep);
      return;
    }

    // 执行传输
    const result = creep.transfer(target, RESOURCE_ENERGY);
    switch (result) {
      case OK:
        creep.say('🔄');
        break;
      case ERR_NOT_IN_RANGE:
        creep.moveTo(target);
        break;
      default:
        this.failTask(creep, task);
        break;
    }
  }

  /**
   * 获取能量
   * @param creep creep对象
   */
  private getEnergy(creep: Creep): void {
    // 寻找能量源
    const sources = creep.room.find(FIND_SOURCES);
    if (sources.length > 0) {
      const source = sources[0];
      const result = creep.harvest(source);
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    }
  }

  /**
   * 完成任务
   * @param creep creep对象
   * @param task 任务对象
   */
  private completeTask(creep: Creep, task: Task): void {
    task.status = 'completed';
    delete creep.memory.currentTask;
    console.log(`[任务驱动] ${creep.name} 完成任务: ${task.id}`);
  }

  /**
   * 任务失败
   * @param creep creep对象
   * @param task 任务对象
   */
  private failTask(creep: Creep, task: Task): void {
    task.status = 'published';
    delete creep.memory.currentTask;
    console.log(`[任务驱动] ${creep.name} 任务失败: ${task.id}`);
  }
}
