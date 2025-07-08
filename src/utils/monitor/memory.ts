import { ROOM_ID_ENUM } from '@/constant';
import { set } from 'lodash';

export type AvailableSourceType = Source | Resource<ResourceConstant> | Tombstone | Ruin;

export const memory = () => {
  clearCreepMemory();
  resources();
  creepsCount();
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
const creepsCount = () => {
  const creepTypeCount: Record<CustomRoleType, number> = {
    harvester: 0,
    builder: 0,
    upgrader: 0,
    miner: 0,
    minerStore: 0,
    repairer: 0,
  };
  for (const creep of Object.values(Game.creeps)) {
    if (creep.memory.role) {
      creepTypeCount[creep.memory.role] = (creepTypeCount[creep.memory.role] ?? 0) + 1;
    }
  }
  Memory.creepsCount = creepTypeCount;
};

// 资源监控
export const resources = () => {
  getEnergySource();
};

// 地图固定资源, 获取能量源(能源点和矿)
const getEnergySource = () => {
  const room = Game.rooms[ROOM_ID_ENUM.MainRoom];
  if (!room) return;
  // Source和Mineral资源是恒定的, 只需要初始化
  if (!Memory.sources?.Source) {
    const sources = room.find(FIND_SOURCES);
    set(
      Memory,
      'sources.Source',
      sources.map((s) => s.id)
    );
  }
  if (!Memory.sources?.Mineral) {
    const minerals = room.find(FIND_MINERALS);
    set(
      Memory,
      'sources.Mineral',
      minerals.map((mine) => mine.id)
    );
  }

  // 掉落资源
  const resources = room.find(FIND_DROPPED_RESOURCES);
  set(
    Memory,
    'sources.Resource',
    resources.map((resource) => resource.id)
  );

  // 遗迹
  const ruins = room.find(FIND_RUINS);
  set(
    Memory,
    'sources.Ruin',
    ruins.map((ruin) => ruin.id)
  );

  // 墓碑
  const tombstones = room.find(FIND_TOMBSTONES);
  set(
    Memory,
    'sources.Tombstone',
    tombstones.map((tombstone) => tombstone.id)
  );
};
