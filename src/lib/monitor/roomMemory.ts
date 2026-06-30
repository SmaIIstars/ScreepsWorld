import { intervalSleep } from '@/utils';
import { TaskMap } from '../utils/taskMap';

export const roomMemory = (room: Room) => {
  if (!global.rooms[room.name]) global.rooms[room.name] = Memory.rooms[room.name] ?? {};
  const roomMemory = global.rooms[room.name];
  roomMemory.visible = Game.rooms[room.name] ? true : false;

  // clearMemoryKeys(room);
  clearCreepMemory();
  intervalSleep(10, () => resources(room));
  intervalSleep(50, () => structures(room));
  intervalSleep(10, () => enemies(room));
  intervalSleep(5, () => {
    if (room.find(FIND_MY_CREEPS).length) roomCostMatrix(room);
  });
  roomMemory.time = Game.time;
  intervalSleep(10, () => {
    Memory.rooms[room.name] = {
      taskMapObj: new TaskMap(room.name).getTaskMapObj(),
      ...global.rooms[room.name],
    };
  });
};

// 清理Memory中废弃的字段
const clearMemoryKeys = (room: Room) => {
  const abandonKeys = ['creepsCount', 'taskMapVersion', 'costMatrixVer'];
  for (const key of abandonKeys) {
    if (key in global.rooms[room.name]) {
      Reflect.set(global.rooms[room.name], key, undefined);
    }
  }
};

// 清理Memory中不存在的creep
const clearCreepMemory = () => {
  for (let name in Memory.creeps) {
    if (Game.creeps[name]) continue;
    delete Memory.creeps[name];
  }
};

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
  const myStructures = room.find(FIND_MY_STRUCTURES);
  global.rooms[room.name].structure = {
    [STRUCTURE_LINK]: myStructures
      .filter((s) => s.structureType === STRUCTURE_LINK)
      .map((cur) => {
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
    [STRUCTURE_OBSERVER]: myStructures.filter((s) => s.structureType === STRUCTURE_OBSERVER).map((s) => s.id),
    [STRUCTURE_STORAGE]: myStructures.filter((s) => s.structureType === STRUCTURE_STORAGE)[0]?.id ?? '',
    [STRUCTURE_FACTORY]: myStructures.filter((s) => s.structureType === STRUCTURE_FACTORY)[0]?.id ?? '',
    [STRUCTURE_TERMINAL]: myStructures.filter((s) => s.structureType === STRUCTURE_TERMINAL)[0]?.id ?? '',
    [STRUCTURE_NUKER]: myStructures.filter((s) => s.structureType === STRUCTURE_NUKER)[0]?.id ?? '',
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

  global.rooms[room.name].enemies = enemies.map((e) => e.id);
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
  room.find(FIND_CREEPS).forEach((creep) => costs.set(creep.pos.x, creep.pos.y, MAX_COST));
  room.find(FIND_CONSTRUCTION_SITES).forEach((creep) => costs.set(creep.pos.x, creep.pos.y, MAX_COST));
  global.rooms[room.name].costMatrix = costs.serialize();
  global.rooms[room.name].time = Game.time;
  return costs;
};
