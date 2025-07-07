import { ROOM_ID_ENUM } from '@/constant';
import { set } from 'lodash';

export type AvailableSourceType = Source | Resource<ResourceConstant> | Tombstone | Ruin;

export const memory = () => {
  clearCreepMemory();
  resources();
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

// 资源监控
export const resources = () => {
  getEnergySource();
  // checkResourceCongestion();
};

const availableSourcesTypes = [FIND_DROPPED_RESOURCES, FIND_SOURCES, FIND_TOMBSTONES, FIND_RUINS];

// const checkResourceCongestion = () => {
//   const sources: (Source | Resource<ResourceConstant> | Tombstone | Ruin)[] = [];

//   for (const type of availableSourcesTypes) {
//     sources.push(...Game.spawns[BASE_ID_ENUM.MainBase].room.find(type));
//   }

//   const resourceMemory: Record<string, ResourceMemory> = {};
//   for (const source of sources) {
//     // const availablePositions = querySourceAvailablePositions(source);
//     // const creepsNearSource = source.pos.findInRange(FIND_MY_CREEPS, 1);

//     resourceMemory[source.id] = { source };

//     // const availableCount = availablePositions.length;
//     // const occupiedCount = creepsNearSource.length;
//     // const vacancyCount = availableCount - occupiedCount;

//     // let text = "";
//     // if (source instanceof Source) {
//     //   text = `${source[RESOURCE_ENERGY]}-${vacancyCount}`;
//     // } else if (source instanceof Resource) {
//     //   text = `${source.amount}-${vacancyCount}`;
//     // } else if (source instanceof Tombstone) {
//     //   text = `${source.store[RESOURCE_ENERGY]}-${vacancyCount}`;
//     // } else if (source instanceof Ruin) {
//     //   text = `${source.store[RESOURCE_ENERGY]}-${vacancyCount}`;
//     // }
//     let text = '';
//     if (source instanceof Source) {
//       text = `${source[RESOURCE_ENERGY]}`;
//     } else if (source instanceof Resource) {
//       text = `${source.amount}`;
//     } else if (source instanceof Tombstone) {
//       text = `${source.store[RESOURCE_ENERGY]}`;
//     } else if (source instanceof Ruin) {
//       text = `${source.store[RESOURCE_ENERGY]}`;
//     }

//     Game.spawns[BASE_ID_ENUM.MainBase].room.visual.text(text, source.pos.x, source.pos.y - 1, {
//       font: 0.5,
//       // color: vacancyCount > 0 ? "#00ff00" : "#ff0000",
//       color: '#00ff00',
//       stroke: '#000000',
//       strokeWidth: 0.1,
//     });
//   }

//   Memory.resources = resourceMemory;
// };

// const getBaseStatus = (baseId: string = BASE_ID_ENUM.MainBase) => {
//   const base = Game.spawns[baseId];

//   if (base.spawning) {
//     base.room.visual.text(`${base.spawning.name}`, base.pos.x, base.pos.y + 1, {
//       font: 0.5,
//       color: '#00ff00',
//       stroke: '#000000',
//       strokeWidth: 0.1,
//     });
//   }
// };

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
      sources.map((s) => s.id),
    );
  }
  if (!Memory.sources?.Mineral) {
    const minerals = room.find(FIND_MINERALS);
    set(
      Memory,
      'sources.Mineral',
      minerals.map((mine) => mine.id),
    );
  }

  // 掉落资源
  const resources = room.find(FIND_DROPPED_RESOURCES);
  set(
    Memory,
    'sources.Resource',
    resources.map((resource) => resource.id),
  );

  // 遗迹
  const ruins = room.find(FIND_RUINS);
  set(
    Memory,
    'sources.Ruin',
    ruins.map((ruin) => ruin.id),
  );

  // 墓碑
  const tombstones = room.find(FIND_TOMBSTONES);
  set(
    Memory,
    'sources.Tombstone',
    tombstones.map((tombstone) => tombstone.id),
  );
};
