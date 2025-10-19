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
  const MAX_COST = 255;
  const goals: Array<RoomPosition | { pos: RoomPosition; range: number }> = [];
  if (Array.isArray(goal))
    goals.push(...goal.map((i) => (i instanceof RoomPosition ? { pos: i, range: opts?.range ?? 1 } : i)));
  else goals.push({ pos: goal instanceof RoomPosition ? goal : goal.pos, range: opts?.range ?? 1 });

  return PathFinder.search(origin, goals, {
    // 我们需要把默认的移动成本设置的更高一点
    // 这样我们就可以在 roomCallback 里把道路移动成本设置的更低
    plainCost: 2,
    swampCost: 10,
    maxOps: 6400,
    roomCallback: (roomName) => {
      let room = Game.rooms[roomName];
      if (!room) return false;
      const roomMemory = global.rooms[roomName];
      if (!roomMemory) return false;
      if (roomMemory?.costMatrix && roomMemory?.costMatrixVer === Game.time)
        return PathFinder.CostMatrix.deserialize(roomMemory.costMatrix);
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
      roomMemory.costMatrix = costs.serialize();
      roomMemory.costMatrixVer = Game.time;
      return costs;
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
