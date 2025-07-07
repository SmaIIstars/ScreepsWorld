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
