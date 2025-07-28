import { BASE_ID_ENUM, ROOM_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';

class Claimer extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'claimer'> = 'claimer';

  constructor() {
    super(Claimer.role);
  }

  create(params: BaseRoleCreateParams): ScreepsReturnCode {
    const { baseId = BASE_ID_ENUM.MainBase, body, name, memoryRoleOpts } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return Game.spawns[baseId].spawnCreep(body, curName, {
      memory: {
        role: 'claimer',
        task: 'moving',
        targetRoomName: memoryRoleOpts?.targetRoomName ?? ROOM_ID_ENUM.TargetRoomFlag,
        ...memoryRoleOpts,
      },
    });
  }

  run(creep: Creep): void {
    // 如果creep没有目标房间，直接返回
    if (!creep.memory.targetRoomName) {
      if (Game.time % 10 === 0) {
        creep.say('No target');
      }
      return;
    }

    if (creep.memory.task === 'moving') {
      this.moveTask(creep);
    } else {
      this.roleTask(creep);
    }
  }

  moveTask(creep: Creep): void {
    let targetRoom: Room | null = null;

    // 1. 先判断是否有目标房间 且 房间可见
    if (creep.memory.targetRoomName && Game.rooms[creep.memory.targetRoomName]) {
      targetRoom = Game.rooms[creep.memory.targetRoomName];
    } else {
      // 没有目标房间则寻找目标房间旗
      const targetRoomFlag = Game.flags[creep.memory.targetRoomName!];
      if (!targetRoomFlag) {
        if (Game.time % 10 === 0) {
          creep.say('No flag');
        }
        return;
      }
      // 如果目标房间旗存在且房间不可见，则向旗子移动
      if (!targetRoomFlag.room) {
        creep.moveTo(targetRoomFlag, { visualizePathStyle: { stroke: '#ffaa00' } });
        intervalSleep(10, () => creep.say(EMOJI.moving));
        return;
      } else {
        // 一直到房间可见
        targetRoom = targetRoomFlag.room;
      }
    }

    // 找到目标房间
    if (targetRoom) {
      if (creep.room.name === targetRoom.name) {
        // 在目标房间，查找控制器
        const controller = creep.room.controller;
        if (!controller) {
          if (Game.time % 10 === 0) {
            creep.say('No ctrl');
          }
          return;
        }

        // 到达控制器附近，切换到 reserve 任务
        if (creep.pos.isNearTo(controller)) {
          creep.memory.task = 'idle';
        } else {
          creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
          intervalSleep(10, () => creep.say(EMOJI.moving));
        }
      } else {
        // 先去目标房间
        creep.moveTo(targetRoom.find(FIND_SOURCES)[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        intervalSleep(10, () => creep.say(EMOJI.moving), { time: creep.ticksToLive });
      }
      // 设置targetRoomName
      creep.memory.targetRoomName = targetRoom.name;
    }
  }

  roleTask(creep: Creep): void {
    const controller = creep.room.controller;
    if (!controller) {
      creep.memory.task = 'moving';
      return;
    }

    // 如果控制器已经是自己的，任务完成
    if (controller.my) {
      if (Game.time % 10 === 0) {
        creep.say('OK');
      }
      return;
    }

    // 执行 reserve 操作
    const reserveResult = creep.reserveController(controller);
    if (reserveResult === OK) {
      intervalSleep(10, () => creep.say('Reserve'));
    }
  }
}

export default new Claimer();
