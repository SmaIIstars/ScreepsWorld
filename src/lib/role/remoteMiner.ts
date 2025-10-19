import { BASE_ID_ENUM } from '@/constant';
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
    const runCheck = this.baseRun(creep);
    if (!runCheck) return TaskExecuteStatusEnum.failed;

    if (taskId.startsWith('scout_')) return this.scoutTask(creep, taskId);

    // 检查周边建筑，有工地则修建
    const targetConstructionSite = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
      filter: (constructionSite) => constructionSite.my,
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
  scoutTask(creep: Creep, taskId: string): TaskExecuteStatusEnum {
    if (!creep.memory.targetRoom) {
      delete creep.memory.currentTaskFromRoom;
      this.baseMoveTo(creep, Game.spawns[BASE_ID_ENUM.MainBase].pos);
      return TaskExecuteStatusEnum.failed;
    }

    if (creep.room.name !== creep.memory.targetRoom) {
      const targetRoom = Game.flags[creep.memory.targetRoom];
      this.baseMoveTo(creep, targetRoom.pos);
      return TaskExecuteStatusEnum.inProgress;
    } else {
      delete creep.memory.currentTaskFromRoom;

      this.baseSubmitTask(creep, taskId);
      return TaskExecuteStatusEnum.completed;
    }
  }

  // 采矿任务
  roleTask(creep: Creep, task: Task<'harvesting'>): TaskExecuteStatusEnum {
    return super.roleTask(creep, task);
  }

  claimTask(creep: Creep, taskMap: TaskMap) {
    if (!creep.memory.targetRoom) {
      const scoutingTask = taskMap.taskPriorityQueue('scouting', {
        filter: (task) => {
          if (task.type !== 'scouting') return false;
          if ((task?.needCreepCount ?? 0) <= task?.assignedTo?.length) return false;
          return true;
        },
      })[0];
      if (!scoutingTask) return '';
      creep.memory.targetRoom = scoutingTask.toId;
      creep.memory.currentTaskFromRoom = scoutingTask.room;
      taskMap.updateTask(scoutingTask.id, { assignedTo: [...new Set([...scoutingTask.assignedTo, creep.name])] });
      return scoutingTask.id;
    }

    if (creep.memory.targetRoom !== creep.room.name) {
      const targetRoom = Game.flags[creep.memory.targetRoom];
      this.baseMoveTo(creep, targetRoom.pos);
      return '';
    }

    return super.claimTask(creep, taskMap);
  }
}

export default new RemoteMiner();
