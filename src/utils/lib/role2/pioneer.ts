import { BASE_ID_ENUM, ROOM_ID_ENUM } from '@/constant';
import EMOJI from '@/constant/emoji';
import { intervalSleep } from '@/utils';
import { EnergyStoreTargetType } from '@/utils/query';
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
    if (creep.store.getFreeCapacity() === 0 && creep.memory.task === 'harvesting') {
      creep.memory.task = 'pioneering';
    }

    if (creep.memory.task === 'harvesting') {
      this.harvestingTask(creep);
    }
    this.buildingTask(creep);
    if (creep.memory.task === 'pioneering') {
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
        // 每15tick更新一次
        if ((creep.ticksToLive && creep.ticksToLive % 10 === 0) || !creep.memory.cacheTargetStoreId) {
          // 优先找掉落能量、废墟、墓碑
          const cacheTargetStore = this.getEnergyFromStore(creep, ['resource', 'ruin', 'tombstone', 'source']);
          creep.memory.cacheTargetStoreId = cacheTargetStore?.id;
        } else {
          const cacheTargetStore: EnergyStoreTargetType = Game.getObjectById(creep.memory.cacheTargetStoreId) ?? null;
          this.getEnergyFromStore(creep, ['resource', 'ruin', 'tombstone', 'source'], cacheTargetStore);
        }
        // // 且在目标房间，则寻找能量源
        // this.getEnergyFromStore(creep, ['resource', 'ruin', 'tombstone', 'source']);

        // const allAvailableStores = this.getAllAvailableStores(creep, ['source']).filter((s) => s instanceof Source);
        // let targetStore: Source | null = null;
        // for (const store of allAvailableStores) {
        //   const pos = getAvailableMiningPosition(store);
        //   if (pos.length > 0) {
        //     targetStore = store;
        //     break;
        //   }
        // }

        // if (!targetStore) return;
        // if (creep.harvest(targetStore) === ERR_NOT_IN_RANGE) {
        //   creep.moveTo(targetStore);
        // } else if (creep.harvest(targetStore) === OK) {
        //   intervalSleep(10, () => creep.say(EMOJI.harvesting), { time: creep.ticksToLive });
        // }
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
    const roads = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (structure) => structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax,
    });

    const constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
      filter: (constructionSite) => constructionSite.structureType === STRUCTURE_ROAD,
    });

    // 边走边修
    if (constructionSites.length) {
      creep.build(constructionSites[0]);
    }
    if (roads.length) {
      creep.repair(roads[0]);
    }
  }

  // 侦查任务
  roleTask(creep: Creep): void {
    // 满能源，则返回主房间
    harvester.roleTask(creep, Game.rooms[ROOM_ID_ENUM.MainRoom]);
  }
}

export default new Pioneer();
