import { BASE_ID_ENUM } from '@/constant';

/**
 * 检测指定坐标周围的空位（非墙、非source、无creep/structure），用于拥塞控制。
 * 如果周围的单位为miner或者minerStore，则继续向外扩展，直到找到所有可用空位。
 * @param room 房间对象
 * @param x 起点x坐标
 * @param y 起点y坐标
 * @param range 检查范围（默认为1）
 * @returns 可用空位的坐标数组 [{x, y}]
 */
export function findAvailableNearbyPositionsWithMinerExpand(
  x: number,
  y: number,
  range: number = 1
): Array<{ x: number; y: number }> {
  const room = Game.rooms[BASE_ID_ENUM.MainBase];
  if (!room) return [];

  const visited = new Set<string>();
  const availablePositions: Array<{ x: number; y: number }> = [];
  const queue: Array<{ x: number; y: number }> = [{ x, y }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x}-${current.y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // 检查当前点周围的区域
    const lookArea = room.lookAtArea(current.y - range, current.x - range, current.y + range, current.x + range, true);

    // 以坐标为key聚合所有look结果
    const posMap: Record<string, LookAtResultWithPos<LookConstant>[]> = {};
    for (const unit of lookArea) {
      const posKey = `${unit.x}-${unit.y}`;
      if (!posMap[posKey]) posMap[posKey] = [];
      posMap[posKey].push(unit);
    }

    for (const [posKey, units] of Object.entries(posMap)) {
      // 检查是否有墙或source
      if (units.some((u) => u.terrain === 'wall' || u.type === 'source')) continue;

      // 检查是否有creep
      const creepUnit = units.find((u) => u.type === 'creep');
      if (creepUnit && creepUnit.creep) {
        const creepObj = Game.creeps[creepUnit.creep.name];
        if (creepObj && ['miner', 'minerStore'].includes(creepObj.memory.role ?? '')) {
          // 如果是miner或minerStore，继续向外扩展
          const [px, py] = posKey.split('-').map(Number);
          if (!visited.has(posKey)) {
            queue.push({ x: px, y: py });
          }
          continue; // 不计入可用空位
        } else {
          continue; // 其他creep占用，跳过
        }
      }

      // 检查是否有structure
      if (units.some((u) => u.type === 'structure')) continue;

      // 该位置为空位
      const [px, py] = posKey.split('-').map(Number);
      // 避免重复添加
      if (!availablePositions.some((pos) => pos.x === px && pos.y === py)) {
        availablePositions.push({ x: px, y: py });
      }
    }
  }

  return availablePositions;
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

  if (targetType === 'source') {
    return closest
      ? creep.pos.findClosestByRange(FIND_SOURCES, {
          filter: (structure) =>
            structure.energy > 0 &&
            findAvailableNearbyPositionsWithMinerExpand(structure.pos.x, structure.pos.y).length > 1,
        })
      : creep.room.find(FIND_SOURCES, {
          filter: (structure) =>
            structure.energy > 0 &&
            findAvailableNearbyPositionsWithMinerExpand(structure.pos.x, structure.pos.y).length > 1,
        });
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
