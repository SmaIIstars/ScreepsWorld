import { roomCostMatrix } from '../monitor/roomMemory';

type PathFinderToOpts = {
  range?: number;
} & PathFinderOpts;

export const pathFinderTo = (
  origin: RoomPosition,
  goal:
    | RoomPosition
    | { pos: RoomPosition; range: number }
    | Array<RoomPosition | { pos: RoomPosition; range: number }>,
  opts?: PathFinderToOpts
): PathFinderPath => {
  const goals: Array<RoomPosition | { pos: RoomPosition; range: number }> = [];
  if (Array.isArray(goal))
    goals.push(...goal.map((i) => (i instanceof RoomPosition ? { pos: i, range: opts?.range ?? 1 } : i)));
  else goals.push({ pos: goal instanceof RoomPosition ? goal : goal.pos, range: opts?.range ?? 1 });

  return PathFinder.search(origin, goals, {
    plainCost: 2,
    swampCost: 10,
    maxOps: 6400,
    roomCallback: (roomName) => {
      let room = Game.rooms[roomName];
      if (!room) return false;
      const roomMemory = global.rooms[roomName];
      if (!roomMemory) return false;
      if (roomMemory?.costMatrix && Game.time - roomMemory.time < 5) {
        return PathFinder.CostMatrix.deserialize(roomMemory.costMatrix);
      }
      return roomCostMatrix(Game.rooms[roomName]);
    },
    ...opts,
  });
};

export const serializePath = (
  positions: RoomPosition[],
  curPosition?: RoomPosition
): `${DirectionConstant}` | undefined => {
  if (positions.length == 0) return;
  if (curPosition && !positions[0].isEqualTo(curPosition)) positions.splice(0, 0, curPosition);

  return positions
    .map((pos, index) => {
      // 最后一个位置就不用再移动
      if (index >= positions.length - 1) return null;
      // 由于房间边缘地块会有重叠，所以这里筛除掉重叠的步骤
      if (pos.roomName != positions[index + 1].roomName) return null;
      // 获取到下个位置的方向
      return pos.getDirectionTo(positions[index + 1]);
    })
    .join('') as `${DirectionConstant}`;
};
