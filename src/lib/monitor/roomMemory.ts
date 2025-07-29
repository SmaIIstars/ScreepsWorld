export const roomMemory = (room: Room) => {
  if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
  Memory.rooms[room.name].visible = Memory.rooms[room.name] ? true : false;

  clearCreepMemory();
  creepsCount(room);
  resources(room);
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
const creepsCount = (room: Room) => {
  const creepTypeCount: Record<CustomRoleType, number> = {
    harvester: 0,
    builder: 0,
    upgrader: 0,
    miner: 0,
    repairer: 0,
    pioneer: 0,
    claimer: 0,
  };
  for (const creep of Object.values(Game.creeps)) {
    // 最小组不参与计数
    if (creep.name.startsWith('Min') || creep.room.name !== room.name) continue;
    if (creep.memory.role) {
      creepTypeCount[creep.memory.role] = (creepTypeCount[creep.memory.role] ?? 0) + 1;
    }
  }

  Memory.rooms[room.name].creepsCount = creepTypeCount;
};

// 资源监控
export const resources = (room: Room) => {
  // 获取所有资源
  const sources = room.find(FIND_SOURCES, { filter: (source) => source.energy > 0 });
  const minerals = room.find(FIND_MINERALS, { filter: (mineral) => mineral.mineralAmount > 0 });
  const droppedResources = room.find(FIND_DROPPED_RESOURCES, { filter: (resource) => resource.amount > 0 });
  const ruins = room.find(FIND_RUINS, {
    filter: (ruin) => Object.values(ruin.store).some((amount) => amount > 0),
  });
  const tombstones = room.find(FIND_TOMBSTONES, {
    filter: (tombstone) => Object.values(tombstone.store).some((amount) => amount > 0),
  });

  // 更新房间记忆中的资源信息
  Memory.rooms[room.name].sources = {
    source: sources.map((s) => s.id),
    mineral: minerals.map((m) => m.id),
    resource: droppedResources.map((r) => r.id),
    ruin: ruins.map((r) => r.id),
    tombstone: tombstones.map((t) => t.id),
  };
};
