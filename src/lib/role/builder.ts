import { EnergyStoreTargetType } from '@/constant';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import { Task } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

class Builder extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'builder'> = 'builder';

  constructor() {
    super(Builder.role);
  }

  create(spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode {
    const { body, name, memoryRoleOpts = { role: this.role } } = params;
    return this.baseCreate(spawn, body, name, { memory: memoryRoleOpts });
  }

  run(creep: Creep, task: Task) {
    switch (task.type) {
      case 'building': {
        return this.roleTask(creep, task);
      }

      case 'harvesting': {
        const harvestResult = this.baseHarvestTask(creep, task);
        if (harvestResult === ERR_NOT_IN_RANGE) {
          const targetStore = Game.getObjectById<NonNullable<EnergyStoreTargetType>>(task.toId);
          if (!targetStore) return TaskExecuteStatusEnum.failed;
          this.baseMoveTo(creep, targetStore);
        }
      }
      default:
        return TaskExecuteStatusEnum.inProgress;
    }
  }

  // 建筑任务
  roleTask(creep: Creep, task: Task): TaskExecuteStatusEnum {
    const targetStructure = Game.getObjectById<ConstructionSite>(task.toId);
    if (!targetStructure) return TaskExecuteStatusEnum.failed;
    const repairResult = creep.build(targetStructure);
    switch (repairResult) {
      case ERR_NOT_IN_RANGE: {
        this.baseMoveTo(creep, targetStructure);
        break;
      }
    }
    if (creep.store.energy === 0) {
      this.baseSubmitTask(creep, task);
    }
    return TaskExecuteStatusEnum.inProgress;
  }
}

export default new Builder();
