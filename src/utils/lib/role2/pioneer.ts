import { BASE_ID_ENUM, ROOM_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { BaseRole, BaseRoleCreateParams } from '../base/BaseRole';
import harvester from './harvester';

class Pioneer extends BaseRole {
  static readonly role: Extract<CustomRoleType, 'pioneer'> = 'pioneer';

  constructor() {
    super(Pioneer.role);
  }

  create = (params: BaseRoleCreateParams) => {
    const { baseId = BASE_ID_ENUM.MainBase, body, name, memoryRoleOpts } = params;
    const curName = name ?? `${this.role}-${Game.time}`;
    return Game.spawns[baseId].spawnCreep(body, curName, {
      memory: {
        role: 'pioneer',
        task: 'harvesting',
        targetRoomName: memoryRoleOpts?.targetRoomName ?? ROOM_ID_ENUM.TargetRoomFlag,
        ...memoryRoleOpts,
      },
    });
  };

  run(creep: Creep): void {
    // 1. 如果身上没有能量，且正在执行探索任务，则切换到采集任务
    if (creep.store[RESOURCE_ENERGY] === 0 && creep.memory.task !== 'harvesting') {
      creep.memory.task = 'harvesting';
    }

    // 2. 如果身上能量满了
    if (creep.store.getFreeCapacity() === 0) {
      // 在目标房间，则切换到建筑任务
      if (creep.room.name === creep.memory?.targetRoomName && creep.memory.task === 'harvesting') {
        creep.memory.task = 'building';
      } else {
        // 不在目标房间，则切换到侦查任务
        creep.memory.task = 'pioneering';
      }
    }

    // 3. 如果身上有能量，且没有执行采集任务，则判断是否有建筑任务
    if (creep.store[RESOURCE_ENERGY] > 0 && creep.memory.task !== 'harvesting') {
      this.buildingTask(creep);
    }

    if (creep.memory.task === 'harvesting') {
      this.harvestingTask(creep);
    } else if (creep.memory.task === 'building') {
      this.buildingTask(creep);
    } else if (creep.memory.task === 'pioneering') {
      this.roleTask(creep);
    }
  }

  // 找目标房间 + 采集任务
  harvestingTask(creep: Creep): void {
    let targetRoom: Room | null = null;
    // 1. 先判断是否有目标房间 且 房间可见
    if (creep.memory.targetRoomName && Game.rooms[creep.memory.targetRoomName]) {
      targetRoom = Game.rooms[creep.memory.targetRoomName];
    } else {
      // 没有目标房间则寻找目标房间旗
      const targetRoomFlag = Game.flags[creep.memory.targetRoomName ?? ROOM_ID_ENUM.TargetRoomFlag];
      if (!targetRoomFlag) {
        // 也没有旗子, 则在当前房间做Harvesting任务
        this.getEnergyFromStore(creep, ['source']);
        return;
      }
      // 如果目标房间旗存在且房间不可见，则向旗子移动
      if (!targetRoomFlag.room) {
        creep.moveTo(targetRoomFlag, { visualizePathStyle: { stroke: '#ffaa00' } });
        intervalSleep(10, () => creep.say(EMOJI.moving), { time: creep.ticksToLive });
        return;
      } else {
        // 一直到房间可见
        targetRoom = targetRoomFlag.room;
      }
    }

    // 找到目标房间
    if (targetRoom) {
      if (creep.room.name === targetRoom.name) {
        // 且在目标房间，则寻找能量源
        this.getEnergyFromStore(creep, ['source']);
      } else {
        // 先去目标房间
        creep.moveTo(targetRoom.find(FIND_SOURCES)[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        intervalSleep(10, () => creep.say(EMOJI.moving), { time: creep.ticksToLive });
      }
      // 设置targetRoomName
      creep.memory.targetRoomName = targetRoom.name;
    }
  }

  buildingTask(creep: Creep): void {
    // 1. 先判断周围是否有road
    const roads = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (structure) => structure.structureType === STRUCTURE_ROAD,
    });
    // 再判断周围是否有constructionSite
    const constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
      filter: (constructionSite) => constructionSite.structureType === STRUCTURE_ROAD,
    });

    // 如果周围没有road和constructionSite，则建一个road
    // if (!roads.length && !constructionSites.length) {
    //   const result = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
    //   if (result === OK) {
    //     creep.say(EMOJI.building);
    //   }
    //   return;
    // }

    // 2. 如果有constructionSite需要修，则修constructionSite
    if (constructionSites.length) {
      const buildResult = creep.build(constructionSites[0]);
      if (buildResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(constructionSites[0]);
      } else if (buildResult === OK) {
        intervalSleep(10, () => creep.say(EMOJI.building), { time: creep.ticksToLive });
      }
      return;
    }

    // 3. 如果周围有road，且road需要修，则修road
    if (roads.length && roads[0].hits < roads[0].hitsMax) {
      const repairResult = creep.repair(roads[0]);
      if (repairResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(roads[0]);
      } else if (repairResult === OK) {
        intervalSleep(10, () => creep.say(EMOJI.repairing), { time: creep.ticksToLive });
      }
      return;
    }

    creep.memory.task = 'pioneering';
  }

  // 侦查任务
  roleTask(creep: Creep): void {
    // 满能源，则返回主房间
    harvester.roleTask(creep, Game.rooms[ROOM_ID_ENUM.MainRoom]);
  }
}

export default new Pioneer();
