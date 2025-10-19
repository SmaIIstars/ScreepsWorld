import { intervalSleep } from '@/utils';

export const roomMemory = (room: Room) => {
  if (!global.rooms[room.name]) global.rooms[room.name] = Memory.rooms[room.name] ?? {};
  const roomMemory = global.rooms[room.name];
  roomMemory.visible = Memory.rooms[room.name] ? true : false;

  clearCreepMemory();
  // intervalSleep(5, () => creepsCount(room));
  intervalSleep(10, () => resources(room));
  intervalSleep(50, () => structures(room));
  intervalSleep(10, () => enemies(room));
  intervalSleep(100, () => roomCostMatrix(room));
};

// 清理Memory中不存在的creep
const clearCreepMemory = () => {
  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }
};

// Creeps 类型计数
// const creepsCount = (room: Room) => {
//   const creepTypeCount: Record<CustomRoleType, number> = {
//     harvester: 0,
//     builder: 0,
//     upgrader: 0,
//     miner: 0,
//     repairer: 0,
//     pioneer: 0,
//     claimer: 0,
//     remoteMiner: 0,
//     remoteHarvester: 0,
//     attacker: 0,
//   };

//   const allCreeps = Object.values(Game.creeps);
//   for (const creep of allCreeps) {
//     if (!creep.memory.role) continue;
//     // 最小组不参与计数
//     if (creep.name.includes('Room2Min')) continue;
//     // 要死了的不计数
//     if (creep.ticksToLive && creep.ticksToLive < 100) continue;

//     if (creep.room.name === room.name) {
//       creepTypeCount[creep.memory.role] = (creepTypeCount[creep.memory.role] ?? 0) + 1;
//     } else {
//       if (creep.memory.targetRoom === room.name)
//         creepTypeCount[creep.memory.role] = (creepTypeCount[creep.memory.role] ?? 0) + 1;
//     }
//   }

//   global.rooms[room.name].creepsCount = creepTypeCount;
// };

// 资源监控
export const resources = (room: Room) => {
  // 获取所有资源
  const sources = room.find(FIND_SOURCES);
  const minerals = room.find(FIND_MINERALS);
  const droppedResources = room.find(FIND_DROPPED_RESOURCES);
  const ruins = room.find(FIND_RUINS);
  const tombstones = room.find(FIND_TOMBSTONES);

  // 更新房间记忆中的资源信息
  global.rooms[room.name].sources = {
    source: sources.map((s) => s.id),
    mineral: minerals.map((m) => m.id),
    resource: droppedResources.map((r) => r.id),
    ruin: ruins.map((r) => r.id),
    tombstone: tombstones.map((t) => t.id),
  };
};

// 建筑监控
export const structures = (room: Room) => {
  const links = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_LINK });

  global.rooms[room.name].structure = {
    link: links.map((cur) => {
      // 判断 link 离 spawn, controller, source 哪一个更近，type 就是什么
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      const controller = room.controller;
      const sources = room.find(FIND_SOURCES);

      let minDist = Infinity;
      let closestType: 'source' | 'spawn' | 'controller' = 'source';

      if (spawn) {
        const dist = cur.pos.getRangeTo(spawn.pos);
        if (dist < minDist) {
          minDist = dist;
          closestType = 'spawn';
        }
      }
      if (controller) {
        const dist = cur.pos.getRangeTo(controller.pos);
        if (dist < minDist) {
          minDist = dist;
          closestType = 'controller';
        }
      }
      for (const source of sources) {
        const dist = cur.pos.getRangeTo(source.pos);
        if (dist < minDist) {
          minDist = dist;
          closestType = 'source';
        }
      }
      return { id: cur.id, type: closestType };
    }),
    observer: room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_OBSERVER }).map((s) => s.id),
  };
};

// 敌人监控
export const enemies = (room: Room) => {
  const enemies: Array<AnyCreep | StructureInvaderCore> = [];
  const creeps = room.find(FIND_HOSTILE_CREEPS, {
    filter: (e) => e.body.some((part) => part.type === ATTACK || part.type === RANGED_ATTACK || part.type === HEAL),
  });
  const structures = room.find(FIND_HOSTILE_STRUCTURES, {
    filter: (s) => s.structureType === STRUCTURE_INVADER_CORE,
  });
  enemies.push(...creeps, ...structures);

  Memory.rooms[room.name].enemies = enemies.map((e) => e.id);
};

export const roomCostMatrix = (room: Room) => {
  const MAX_COST = 255;
  let costs = new PathFinder.CostMatrix();
  room.find(FIND_STRUCTURES).forEach((struct) => {
    if (struct.structureType === STRUCTURE_ROAD) {
      costs.set(struct.pos.x, struct.pos.y, 1);
    } else if (
      struct.structureType !== STRUCTURE_CONTAINER &&
      (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
    ) {
      costs.set(struct.pos.x, struct.pos.y, MAX_COST);
    }
  });

  // console.log(123, room.name, costs);
  global.rooms[room.name].costMatrixVer = Game.time;
  global.rooms[room.name].costMatrix = costs.serialize();
  return costs;
};
