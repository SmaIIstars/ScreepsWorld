import { EnergyStoreTargetType } from '@/constant';
import type { Task, TaskMap } from '../utils/taskMap';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';

export type BaseRoleType = {
  role: CustomRoleType;
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

  baseCreate = (
    spawn: StructureSpawn,
    body: BodyPartConstant[],
    name?: string,
    opts?: SpawnOptions
  ): ScreepsReturnCode => {
    const curName = name ?? `${this.role}-${Game.time}`;
    return spawn.spawnCreep(body, curName, opts);
  };

  baseHarvestTask = (creep: Creep, task: Task<'harvesting'>): TaskExecuteStatusEnum => {
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
      returnCode = creep.withdraw(targetStore, RESOURCE_ENERGY);
    }

    if (returnCode === ERR_NOT_IN_RANGE) {
      this.baseMoveTo(creep, targetStore);
      return TaskExecuteStatusEnum.inProgress;
    } else if (returnCode === OK) {
      return TaskExecuteStatusEnum.inProgress;
    } else {
      this.baseSubmitTask(creep, task.id);
      return TaskExecuteStatusEnum.failed;
    }
  };

  // TODO: 做寻路优化
  baseMoveTo(
    creep: Creep,
    target: RoomPosition | { pos: RoomPosition },
    opts?: MoveToOpts
  ): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND;
  baseMoveTo(
    creep: Creep,
    x: number,
    y: number,
    opts?: MoveToOpts
  ): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET;
  baseMoveTo(
    creep: Creep,
    target: RoomPosition | { pos: RoomPosition } | number,
    y?: number | MoveToOpts,
    opts?: MoveToOpts
  ): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND {
    const defaultOpts = { visualizePathStyle: { stroke: '#ffffff' }, ...opts };
    if (typeof target === 'number' && typeof y === 'number') {
      if (creep.pos.isNearTo(target, y)) return OK;
      return creep.moveTo(target, y, defaultOpts);
    } else if (target instanceof RoomPosition || (typeof target !== 'number' && target?.pos instanceof RoomPosition)) {
      if (creep.pos.isNearTo(target)) return OK;
      return creep.moveTo(target, defaultOpts);
    }
    return OK;
  }

  baseSubmitTask = (creep: Creep, taskId: string) => {
    const task = global.rooms[creep.room.name]?.taskMap?.[taskId];
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
