import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap } from '../utils/taskMap';
import { BaseRoleCreateParams } from './base';
import { Miner } from './miner';

class RemoteMiner extends Miner {
  static readonly role: Extract<CustomRoleType, 'remoteMiner'> = 'remoteMiner';

  constructor() {
    super(RemoteMiner.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, taskId: string) {
    // if (creep.memory.targetRoom === creep.room.name && taskId.startsWith('scout_')) {
    //   this.baseSubmitTask(creep, taskId);
    //   return TaskExecuteStatusEnum.completed;
    // }

    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
    if (!task) return TaskExecuteStatusEnum.failed;
    if (task.type === 'scouting') return this.scoutTask(creep, task as Task<'scouting'>);

    // 检查周边建筑，有工地则修建
    const targetConstructionSite = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
      filter: (constructionSite) =>
        constructionSite.structureType === STRUCTURE_ROAD || constructionSite.structureType === STRUCTURE_CONTAINER,
    })[0];
    if (targetConstructionSite) {
      creep.build(targetConstructionSite);
    }
    // 检查周边建筑，有损坏则维修
    const targetStructure = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (structure) => structure.hits < structure.hitsMax,
    })[0];
    if (targetStructure) {
      creep.repair(targetStructure);
    }

    return super.run(creep, taskId);
  }

  // 侦查任务
  scoutTask(creep: Creep, task: Task<'scouting'>): TaskExecuteStatusEnum {
    if (creep.room.name !== task.toId) {
      const targetRoom = Game.flags[task.toId];
      const moveResult = this.baseMoveTo(creep, targetRoom);
      return moveResult === OK ? TaskExecuteStatusEnum.inProgress : TaskExecuteStatusEnum.failed;
    }

    creep.memory.targetRoom = task.toId;
    this.baseSubmitTask(creep, task.id);
    return TaskExecuteStatusEnum.completed;
  }

  // 采矿任务
  roleTask(creep: Creep, task: Task<'harvesting'>): TaskExecuteStatusEnum {
    return super.roleTask(creep, task);
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    if (!creep.memory.targetRoom) {
      const scoutingTasks = taskMap.taskPriorityQueue('scouting', {
        filter: (task) => task.type === 'scouting',
      });
      return scoutingTasks[0]?.id;
    } else {
      // 已经在侦查房间，非侦查房间不会有 scouting 任务，则找 harvesting 任务
      return super.claimTask(creep, taskMap);
    }
  }
}

export default new RemoteMiner();
