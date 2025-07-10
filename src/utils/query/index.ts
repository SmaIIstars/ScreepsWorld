import { ROOM_ID_ENUM } from '@/constant';

/**
 * 检测指定坐标周围的空位（非墙、非source、无占用单位），用于拥塞控制。
 * @param x 起点x坐标
 * @param y 起点y坐标
 * @param range 检查范围（默认为1）
 * @returns 可用空位的坐标数组 [{x, y}]
 */
export function findAvailableNearbyPositionsWithMinerExpand(
  x: number,
  y: number,
  range: number = 1,
  room: Room = Game.rooms[ROOM_ID_ENUM.MainRoom]
): Array<{ x: number; y: number }> {
  if (!room) return [];
  const availablePositionMap: Record<string, boolean> = {};

  room.lookAtArea(y - range, x - range, y + range, x + range, true).forEach((pos) => {
    if (availablePositionMap[`${pos.x},${pos.y}`] === false) return;
    // 默认为可用位置
    if (availablePositionMap[`${pos.x},${pos.y}`] === undefined) {
      availablePositionMap[`${pos.x},${pos.y}`] = true;
    }

    // 如果是墙或者creep等不可通行单位，则不可用
    if (pos.type === 'terrain' && pos.terrain === 'wall') {
      availablePositionMap[`${pos.x},${pos.y}`] = false;
      return;
    }
    if (pos.type === 'creep') {
      availablePositionMap[`${pos.x},${pos.y}`] = false;
      return;
    }
    if (pos.type === 'structure' && pos.structure) {
      // 游戏中可以通过的几种结构
      if (
        !(pos.structure instanceof StructureContainer) &&
        !(pos.structure instanceof StructureRoad) &&
        !(pos.structure instanceof StructureRampart)
      ) {
        availablePositionMap[`${pos.x},${pos.y}`] = false;
      }
      return;
    }
  });

  return Object.entries(availablePositionMap)
    .filter(([_, value]) => value === true)
    .map(([key]) => {
      const [x, y] = key.split(',');
      return { x: Number(x), y: Number(y) };
    });
}

export type EnergyStoreType =
  | 'deposit'
  | 'mineral'
  | 'source'
  | 'miner'
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
  if (targetType === 'miner') {
    return closest
      ? creep.pos.findClosestByRange(FIND_MY_CREEPS, {
          filter: (creep) => creep.memory.role === 'miner' && creep.store[RESOURCE_ENERGY] > 0,
        })
      : creep.room.find(FIND_MY_CREEPS, {
          filter: (creep) => creep.memory.role === 'miner' && creep.store[RESOURCE_ENERGY] > 0,
        });
  }

  // Container 建筑不能使用 FIND_MY_STRUCTURES 查询
  if (targetType === 'container') {
    return closest
      ? (creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (structure: StructureContainer) =>
            structure.structureType === 'container' && structure.store[RESOURCE_ENERGY] > 0,
        }) as StructureStorage | StructureContainer | null)
      : (creep.room.find(FIND_STRUCTURES, {
          filter: (structure: StructureContainer) =>
            structure.structureType === 'container' && structure.store[RESOURCE_ENERGY] > 0,
        }) as unknown as StructureContainer | null);
  }

  if (targetType === 'storage') {
    return closest
      ? (creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: (structure: StructureStorage) =>
            structure.structureType === 'storage' && structure.store[RESOURCE_ENERGY] > 0,
        }) as StructureStorage | null)
      : (creep.room.find(FIND_MY_STRUCTURES, {
          filter: (structure: StructureStorage) =>
            structure.structureType === 'storage' && structure.store[RESOURCE_ENERGY] > 0,
        }) as unknown as StructureStorage | null);
  }

  if (targetType === 'source') {
    return closest
      ? creep.pos.findClosestByRange(FIND_SOURCES, {
          filter: (structure) => structure.energy > 0,
        })
      : creep.room.find(FIND_SOURCES, { filter: (source) => source.energy > 0 });
  }

  if (targetType === 'mineral') {
    return closest
      ? creep.pos.findClosestByRange(FIND_MINERALS, {
          filter: (mineral) => mineral.mineralAmount > 0,
        })
      : creep.room.find(FIND_MINERALS, {
          filter: (mineral) => mineral.mineralAmount > 0,
        });
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

export function getAvailableMiningPosition(source: Source): { x: number; y: number }[] {
  const room = source.room;
  const lookArea = room.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
  const availablePositions = lookArea.filter(
    (pos) =>
      !lookArea.some(
        (other) => other.x === pos.x && other.y === pos.y && (other.type === 'structure' || other.type === 'creep')
      )
  );
  return availablePositions.map((pos) => ({ x: pos.x, y: pos.y }));
}
