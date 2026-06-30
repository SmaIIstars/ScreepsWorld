import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { pathFinderTo, serializePath } from '../utils/base';
import type { Task, TaskMap } from '../utils/taskMap';

export type BaseRoleType = {
  role: CustomRoleType;
  targetRoom: string;
};

export type BaseRoleCreateParams = {
  name?: string;
  body: BodyPartConstant[];
  memoryRoleOpts?: BaseRoleType;
};

export abstract class BaseRole {
  protected role: CustomRoleType;

  constructor(role: CustomRoleType) {
    this.role = role;
  }

  /**
   * 生成角色body
   * @param bodyWidgetConfig
   * @returns BodyPartConstant[]
   */
  static generatorRoleBody = (bodyWidgetConfig: { body: BodyPartConstant; count: number }[]) => {
    // flatMap 不兼容 es2019
    // bodyWidgetConfig.flatMap(({ body, count }) => Array(count).fill(body));
    return bodyWidgetConfig.reduce<BodyPartConstant[]>((acc, { body, count }) => {
      return acc.concat(Array(count).fill(body));
    }, []);
  };

  abstract create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode;
  abstract run(creep: Creep, taskId: string): TaskExecuteStatusEnum;
  abstract claimTask(creep: Creep, taskMap: TaskMap): string | undefined;

  // 所有角色都需要执行的内容，可以处理一些紧急，边界情况，检查
  baseRun = (creep: Creep): boolean => {
    // 血量检查
    if (creep.hits < creep.hitsMax) return false;
    return true;
  };

  baseCreate = (
    spawn: StructureSpawn,
    body: BodyPartConstant[],
    name?: string,
    opts?: SpawnOptions
  ): ScreepsReturnCode => {
    const curName = name ?? `${this.role}-${Game.time}`;
    return spawn.spawnCreep(body, curName, opts);
  };

  baseHarvestTask = (
    creep: Creep,
    task: Task<'harvesting'>,
    resourceType: ResourceConstant = RESOURCE_ENERGY
  ): TaskExecuteStatusEnum => {
    if (creep.store.getFreeCapacity() === 0) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    }

    const targetStore = Game.getObjectById<NonNullable<EnergyStoreTargetType>>(task.toId);
    if (!targetStore) return TaskExecuteStatusEnum.failed;

    let returnCode: ScreepsReturnCode = OK;
    if (targetStore instanceof Creep) {
      // Just wait creep transfer
      returnCode = creep.pos.isNearTo(targetStore) ? OK : ERR_NOT_IN_RANGE;
    } else if (targetStore instanceof Source || targetStore instanceof Mineral) {
      returnCode = creep.harvest(targetStore);
    } else if (targetStore instanceof Resource) {
      returnCode = creep.pickup(targetStore);
    } else {
      // targetStore instanceof Ruin ||
      // targetStore instanceof Tombstone ||
      // targetStore instanceof StructureStorage ||
      // targetStore instanceof StructureContainer ||
      // targetStore instanceof StructureLink ||
      // targetStore instanceof StructureTerminal
      returnCode = creep.withdraw(targetStore, resourceType);
    }

    if (returnCode === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetStore.pos);
      return TaskExecuteStatusEnum.inProgress;
    } else if (returnCode === OK) {
      return TaskExecuteStatusEnum.inProgress;
    } else {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.failed;
    }
  };

  baseRepairTask = (creep: Creep, task: Task<'repairing'>): TaskExecuteStatusEnum => {
    if (creep.store.energy === 0) {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.completed;
    }

    const targetStructure = Game.getObjectById<Structure>(task.toId);
    if (!targetStructure) return TaskExecuteStatusEnum.failed;

    const repairResult = creep.repair(targetStructure);
    if (repairResult === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetStructure.pos);
      return TaskExecuteStatusEnum.inProgress;
    } else if (repairResult === OK) {
      if (targetStructure.hits >= targetStructure.hitsMax) {
        this.baseSubmitTask(creep, task.id);
        return TaskExecuteStatusEnum.completed;
      }
      return TaskExecuteStatusEnum.inProgress;
    } else {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.failed;
    }
  };

  baseTransferTask = (creep: Creep, task: Task<'transferring'>): TaskExecuteStatusEnum => {
    const target = Game.getObjectById<Structure>(task.toId);
    if (!target) return TaskExecuteStatusEnum.failed;
    // 先走到附近
    if (!creep.pos.isNearTo(target)) {
      this.baseMoveTo(creep, target.pos);
      return TaskExecuteStatusEnum.inProgress;
    }

    const transferResourceList = task.payload?.resourceTypes?.length
      ? Object.entries(creep.store)
          .filter(([type]) => task.payload?.resourceTypes?.includes(type as ResourceConstant))
          .map(([type]) => type as ResourceConstant)
      : Object.entries(creep.store)
          .filter(([, amount]) => amount > 0)
          .map(([type]) => type as ResourceConstant);

    while (transferResourceList.length > 0) {
      const resourceType = transferResourceList.pop();
      if (!resourceType) break;
      const transferResult = creep.transfer(target, resourceType);
      // 没在附近
      if (transferResult === ERR_NOT_IN_RANGE) {
        this.baseMoveTo(creep, target.pos);
        return TaskExecuteStatusEnum.inProgress;
      } else if (transferResult === ERR_FULL) {
        // target 满了
        this.baseSubmitTask(creep, task.id);
        return TaskExecuteStatusEnum.completed;
      } else if (transferResult === OK) {
        return TaskExecuteStatusEnum.inProgress;
      } else {
        console.log(`${creep.name}: Task(${task.id}) failed, return ${transferResult}`);
        return TaskExecuteStatusEnum.failed;
      }
    }

    this.baseSubmitTask(creep, task.id);
    return TaskExecuteStatusEnum.completed;
  };

  baseMoveTo(
    creep: Creep,
    target:
      | RoomPosition
      | { pos: RoomPosition; range: number }
      | Array<RoomPosition | { pos: RoomPosition; range: number }>,
    opts?: FindPathOpts
  ): CreepMoveReturnCode | ERR_NOT_FOUND | ERR_INVALID_ARGS {
    const { movePath, movePathIdx, currentTask } = creep.memory;
    if (!movePath || movePathIdx === undefined || !movePath?.[movePathIdx] || !currentTask) {
      const newMovePath = pathFinderTo(creep.pos, target, opts);
      creep.memory.movePath = serializePath(newMovePath.path, creep.pos);
      creep.memory.movePathIdx = 0;
    }

    if (movePathIdx !== undefined && movePath?.[movePathIdx]) {
      const nextStep = Number(movePath[movePathIdx]) as DirectionConstant;
      const resp = this.baseMove(creep, nextStep);
      if (resp === OK) creep.memory.movePathIdx = movePathIdx + 1;
      return resp;
    }

    return ERR_NOT_FOUND;
  }

  baseMove(creep: Creep, direction: DirectionConstant): CreepMoveReturnCode | ERR_INVALID_ARGS {
    const curPos = creep.pos.getPosition();
    const moveRes = creep.move(direction);
    if (moveRes !== OK) return moveRes;

    if (creep.memory.prePosition === curPos) {
      delete creep.memory.movePath;
      delete creep.memory.movePathIdx;
      return ERR_INVALID_ARGS;
    }
    creep.memory.prePosition = curPos;
    return moveRes;
  }

  baseSubmitTask = (creep: Creep, taskId: string) => {
    const task = global.rooms[creep.room.name]?.taskMap?.get(taskId);
    if (!task) {
      delete creep.memory.currentTask;
      return;
    }

    if (task.id === creep.memory?.currentTask) {
      const idx = task.assignedTo?.indexOf(creep.name);
      if (idx !== undefined && idx !== -1) {
        task.assignedTo?.splice(idx, 1);
      }
      delete creep.memory.currentTask;
    }
  };
}
