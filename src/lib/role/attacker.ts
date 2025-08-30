import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { TaskExecuteStatusEnum } from '../taskSystem/executor';
import type { TaskMap } from '../utils/taskMap';
import { BaseRole, BaseRoleCreateParams } from './base';

/**
 * 攻击者角色
 * 负责攻击敌对creep和建筑
 */
class Attacker extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'attacker'> = 'attacker';

  constructor() {
    super(Attacker.role);
  }

  /**
   * 创建攻击者creep
   */
  create = (spawn: StructureSpawn, params: BaseRoleCreateParams): ScreepsReturnCode => {
    const { body, name, memoryRoleOpts = { role: 'attacker', targetRoom: spawn.room.name } } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return spawn.spawnCreep(body, curName, { memory: memoryRoleOpts });
  };

  /**
   * 运行攻击者逻辑
   */
  run(creep: Creep, taskId: string): TaskExecuteStatusEnum {
    // 如果creep正在孵化，不执行任何操作
    if (creep.spawning) return TaskExecuteStatusEnum.inProgress;

    return this.attackTask(creep);
  }

  /**
   * 认领任务
   */
  claimTask(creep: Creep, taskMap: TaskMap): string | undefined {
    // 攻击者可以认领攻击任务
    const attackTasks = taskMap.getByType('attacking');
    if (attackTasks.length > 0) {
      // 选择最近的任务
      const taskPositions = attackTasks
        .map((task) => {
          const target = Game.getObjectById(task.toId);
          return target && 'pos' in target ? (target as any).pos : null;
        })
        .filter((pos) => pos !== null) as RoomPosition[];

      if (taskPositions.length > 0) {
        const closestPos = creep.pos.findClosestByRange(taskPositions);
        if (closestPos) {
          const task = attackTasks.find((t) => {
            const target = Game.getObjectById(t.toId);
            return target && 'pos' in target && (target as any).pos.isEqualTo(closestPos);
          });
          return task?.id;
        }
      }
    }
    return undefined;
  }

  /**
   * 攻击任务
   */
  private attackTask(creep: Creep): TaskExecuteStatusEnum {
    // 寻找攻击目标
    const target = this.findAttackTarget(creep);

    if (target) {
      this.executeAttack(creep, target);
      return TaskExecuteStatusEnum.inProgress;
    }

    return TaskExecuteStatusEnum.failed;
  }

  /**
   * 寻找攻击目标
   */
  private findAttackTarget(creep: Creep): Creep | Structure | null {
    // 优先攻击敌对creep
    const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
    if (hostileCreeps.length > 0) {
      // 优先攻击有攻击能力的敌人
      const priorityTargets = hostileCreeps.filter((enemy) =>
        enemy.body.some((part) => part.type === ATTACK || part.type === RANGED_ATTACK || part.type === HEAL)
      );

      if (priorityTargets.length > 0) {
        // 选择最近的优先目标
        return creep.pos.findClosestByRange(priorityTargets);
      }

      // 如果没有优先目标，选择最近的敌人
      return creep.pos.findClosestByRange(hostileCreeps);
    }

    // 如果没有敌对creep，攻击敌对建筑
    const hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
    if (hostileStructures.length > 0) {
      return creep.pos.findClosestByRange(hostileStructures);
    }

    return null;
  }

  /**
   * 执行攻击
   */
  private executeAttack(creep: Creep, target: Creep | Structure): void {
    // 检查是否在攻击范围内
    if (creep.pos.isNearTo(target)) {
      // 近战攻击
      if (creep.body.some((part) => part.type === ATTACK)) {
        const result = creep.attack(target);
        if (result === OK) {
          intervalSleep(5, () => creep.say(EMOJI.attacking));
        }
      }
    } else if (creep.pos.inRangeTo(target, 3)) {
      // 远程攻击
      if (creep.body.some((part) => part.type === RANGED_ATTACK)) {
        const result = creep.rangedAttack(target);
        if (result === OK) {
          intervalSleep(5, () => creep.say(EMOJI.attacking));
        }
      }
    } else {
      // 移动到目标附近
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
    }
  }

  /**
   * 检查是否需要撤退
   */
  private shouldRetreat(creep: Creep): boolean {
    // 生命值过低时撤退
    if (creep.hits < creep.hitsMax * 0.3) return true;

    // 被多个敌人包围时撤退
    const nearbyEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 2);
    if (nearbyEnemies.length > 2) return true;

    // 检查是否有强敌在附近
    const strongEnemies = nearbyEnemies.filter((enemy) =>
      enemy.body.some((part) => part.type === ATTACK || part.type === RANGED_ATTACK)
    );

    return strongEnemies.length > 1;
  }
}

export default new Attacker();
