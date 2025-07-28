import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

class Miner extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'miner'> = 'miner';

  constructor() {
    super(Miner.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, task: Task) {
    return this.roleTask(creep, task);
  }

  // 采矿任务
  roleTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    const harvestResult = this.baseHarvestTask(creep, task);
    if (harvestResult === ERR_NOT_IN_RANGE) {
      const targetStore = Game.getObjectById<NonNullable<EnergyStoreTargetType>>(task.toId);
      if (!targetStore) return TaskExecuteStatusEnum.failed;
      this.baseMoveTo(creep, targetStore);
    }
    return TaskExecuteStatusEnum.inProgress;
  }
}

export default new Miner();
