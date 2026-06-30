import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task, TaskMap } from '../utils/taskMap';
import { BaseRoleCreateParams } from './base';
import { Harvester } from './harvester';

class RemoteHarvester extends Harvester {
  static readonly role: Extract<CustomRoleType, 'remoteHarvester'> = 'remoteHarvester';

  constructor() {
    super(RemoteHarvester.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, taskId: string) {
    if (!creep.memory.targetRoom) return TaskExecuteStatusEnum.failed;
    const task = global.rooms[creep.memory.targetRoom]?.taskMap?.get(taskId);
    if (!task) return TaskExecuteStatusEnum.failed;

    // 检查周边建筑，有工地则修建
    const targetConstructionSite = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
      filter: (constructionSite) => constructionSite.my,
    })[0];
    if (targetConstructionSite) {
      creep.build(targetConstructionSite);
    }
    // 检查周边建筑，有损坏则维修
    const targetStructure = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (structure) => structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax,
    })[0];
    if (targetStructure) {
      creep.repair(targetStructure);
    }

    if (task.room !== creep.room.name) {
      const targetPos = Game.getObjectById<AnyStructure>(task.publisher) ?? Game.flags[task.room];
      if (!targetPos?.pos) return TaskExecuteStatusEnum.failed;
      this.baseMoveTo(creep, targetPos.pos);
      return TaskExecuteStatusEnum.inProgress;
    }

    if (task.type === 'harvesting') {
      return this.baseHarvestTask(creep, task as Task<'harvesting'>);
    } else if (task.type === 'transferring') {
      return this.roleTask(creep, task as Task<'transferring'>);
    }
    return TaskExecuteStatusEnum.failed;
  }

  // 传输任务
  roleTask(creep: Creep, task: Task<'transferring'>): TaskExecuteStatusEnum {
    return super.roleTask(creep, task);
  }

  claimTask(creep: Creep) {
    // 接外矿的采集任务
    if (creep.store.getFreeCapacity() > creep.store.getCapacity() * 0.2) {
      if (!creep.memory.bornRoom) return;
      const taskRoomTaskMap = new TaskMap(creep.memory.bornRoom);
      if (!taskRoomTaskMap) return;
      const harvestingTasks = taskRoomTaskMap.taskPriorityQueue('harvesting', {
        filter: (task) => {
          if (task.type !== 'harvesting') return false;
          if (!task.payload) return false;
          if (!Object.values(task.payload).some((resource) => resource > 100)) return false;
          if (task?.assignedTo?.length > 1) return false;
          return true;
        },
        targetPriorityList: [LOOK_RESOURCES, LOOK_RUINS, LOOK_TOMBSTONES, STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
      }) as Task<'harvesting'>[];

      // 有采集任务
      const claimTask = harvestingTasks?.[0];
      if (!claimTask) return;
      taskRoomTaskMap.updateTask(claimTask.id, { assignedTo: [...new Set([...claimTask.assignedTo, creep.name])] });
      creep.memory.targetRoom = creep.memory.bornRoom;
      return claimTask.id;
    } else {
      const curRoomMemory = global.rooms[creep.room.name];
      // 确定主房
      const mainRoomName = creep.room.controller?.my ? creep.room.name : curRoomMemory?.mainRooms?.[0];
      if (!mainRoomName) return;

      const curRoomTaskMap = new TaskMap(mainRoomName);
      const transferringTasks = curRoomTaskMap.taskPriorityQueue('transferring', {
        filter: (task) => {
          if (task.type !== 'transferring') return false;
          if (task.needCreepCount >= 0 && task.assignedTo.length >= task.needCreepCount) return false;
          return true;
        },
        targetPriorityList: [
          STRUCTURE_STORAGE,
          STRUCTURE_NUKER,
          STRUCTURE_LAB,
          STRUCTURE_TOWER,
          STRUCTURE_SPAWN,
          STRUCTURE_EXTENSION,
          STRUCTURE_POWER_SPAWN,
          STRUCTURE_CONTAINER,
          STRUCTURE_FACTORY,
          STRUCTURE_TERMINAL,
        ],
      });

      let claimTask: Task<TaskType> | undefined = undefined;
      // 有 energy 之外的资源
      if (Object.entries(creep.store).some(([k, v]) => k !== RESOURCE_ENERGY && v > 0)) {
        claimTask = transferringTasks.filter((task) => task.publisherType === STRUCTURE_STORAGE)[0];
      } else {
        const currentTargetType = transferringTasks[0]?.publisherType;
        claimTask = transferringTasks
          .filter((task) => task.publisherType === currentTargetType)
          .sort((a, b) => {
            const targetA = Game.getObjectById<Structure>(a.toId);
            const targetB = Game.getObjectById<Structure>(b.toId);
            if (!targetA || !targetB) return 0;
            return creep.pos.getRangeTo(targetA) - creep.pos.getRangeTo(targetB);
          })[0];
      }
      if (!claimTask) return;
      creep.memory.targetRoom = mainRoomName;
      return claimTask?.id;
    }
  }
}

export default new RemoteHarvester();
