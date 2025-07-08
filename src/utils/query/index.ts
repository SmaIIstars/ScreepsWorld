import { ROOM_ID_ENUM } from '@/constant';

export const queryAvailableGetSourcePositions = (x: number, y: number, range: number = 1) => {
  const allPositions: Record<string, LookAtResultWithPos<LookConstant>[]> = {};
  const curRoom = Game.rooms[ROOM_ID_ENUM.MainRoom];
  if (!curRoom) return [];

  // 通过BFS的方式，查询可用的位置
  const queue: Array<{ x: number; y: number }> = [{ x, y }];
  const visited = new Set<string>();

  // BFS遍历，从miner/minerStore位置向外扩展
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(`${current.x}-${current.y}`)) continue;
    visited.add(`${current.x}-${current.y}`);

    // 查询范围内所有可用位置
    const rangeUnits = curRoom
      .lookAtArea(current.y - range, current.x - range, current.y + range, current.x + range, true)
      .filter((unit) => unit?.terrain !== 'wall' && unit.type !== 'source');

    // 从rangeUnits中找到miner或minerStore的位置作为起点
    for (const unit of rangeUnits) {
      if (unit?.type === 'creep' && unit.creep) {
        const placedCreep = Game.creeps[unit.creep?.name] as Creep;
        if (['miner', 'minerStore'].includes(placedCreep.memory.role ?? '')) {
          queue.push({ x: unit.x, y: unit.y });
        }
      } else {
        visited.add(`${unit.x}-${unit.y}`);
        if (!allPositions[`${unit.x}-${unit.y}`]) {
          allPositions[`${unit.x}-${unit.y}`] = [unit];
        } else {
          allPositions[`${unit.x}-${unit.y}`].push(unit);
        }
      }
    }
  }
  // 过滤坐标信息, 只保留可到达的坐标
  const availablePositions: Array<{ x: number; y: number }> = [];
  Object.entries(allPositions).forEach(([key, units]) => {
    const unitSet = new Array(...new Set(units));
    if (unitSet.every((item) => !['creep', 'structure'].includes(item.type))) {
      const [x, y] = key.split('-');
      availablePositions.push({ x: Number(x), y: Number(y) });
    }
  });

  return availablePositions;
};

export type EnergyStoreType =
  | 'deposit'
  | 'mineral'
  | 'source'
  | 'minerStore'
  | 'container'
  | 'storage'
  | 'ruin'
  | 'tombstone'
  | 'resource';
export type EnergyStoreTargetType =
  | Creep
  | StructureStorage
  | StructureContainer
  | Mineral
  | Source
  | Ruin
  | Tombstone
  | Resource
  | null;

export function findAvailableTargetByRange(
  creep: Creep,
  targetType: EnergyStoreType,
  closest: true
): EnergyStoreTargetType;
export function findAvailableTargetByRange(
  creep: Creep,
  targetType: EnergyStoreType,
  closest: false
): EnergyStoreTargetType[];
export function findAvailableTargetByRange(
  creep: Creep,
  targetType: EnergyStoreType,
  closest?: boolean
): EnergyStoreTargetType | EnergyStoreTargetType[] {
  if (targetType === 'minerStore') {
    return closest
      ? creep.pos.findClosestByRange(FIND_MY_CREEPS, {
          filter: (creep) => creep.memory.role === 'minerStore' && creep.store[RESOURCE_ENERGY] > 0,
        })
      : creep.room.find(FIND_MY_CREEPS, {
          filter: (creep) => creep.memory.role === 'minerStore' && creep.store[RESOURCE_ENERGY] > 0,
        });
  }
  if (['container', 'storage'].includes(targetType)) {
    return closest
      ? (creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: (structure: StructureStorage | StructureContainer) =>
            ['storage', 'container'].includes(structure.structureType) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        }) as StructureStorage | StructureContainer | null)
      : (creep.room.find(FIND_MY_STRUCTURES, {
          filter: (structure: StructureStorage | StructureContainer) =>
            ['storage', 'container'].includes(structure.structureType) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        }) as unknown as StructureStorage | StructureContainer | null);
  }

  if (['mineral', 'source'].includes(targetType)) {
    const sources: (Source | null)[] = closest
      ? [
          creep.pos.findClosestByRange(FIND_SOURCES, {
            filter: (structure) => structure.energy > 0,
          }),
        ]
      : creep.room.find(FIND_SOURCES, {
          filter: (structure) => structure.energy > 0,
        });

    const minerals: (Mineral | null)[] = closest
      ? [
          creep.pos.findClosestByRange(FIND_MINERALS, {
            filter: (mineral) => mineral.mineralAmount > 0,
          }),
        ]
      : creep.room.find(FIND_MINERALS, {
          filter: (mineral) => mineral.mineralAmount > 0,
        });

    return [...sources, ...minerals];
  }

  if (targetType === 'ruin') {
    return closest
      ? (creep.pos.findClosestByRange(FIND_RUINS, {
          filter: (ruin) => ruin.store[RESOURCE_ENERGY] > 0,
        }) as Ruin | null)
      : (creep.room.find(FIND_RUINS, {
          filter: (ruin) => ruin.store[RESOURCE_ENERGY] > 0,
        }) as unknown as Ruin | null);
  }

  if (targetType === 'tombstone') {
    return closest
      ? (creep.pos.findClosestByRange(FIND_TOMBSTONES, {
          filter: (tombstone) => tombstone.store[RESOURCE_ENERGY] > 0,
        }) as Tombstone | null)
      : (creep.room.find(FIND_TOMBSTONES, {
          filter: (tombstone) => tombstone.store[RESOURCE_ENERGY] > 0,
        }) as unknown as Tombstone | null);
  }

  if (targetType === 'resource') {
    return closest
      ? (creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (resource) => resource.amount > 0,
        }) as Resource | null)
      : (creep.room.find(FIND_DROPPED_RESOURCES, {
          filter: (resource) => resource.amount > 0,
        }) as unknown as Resource | null);
  }

  return null;
}
