import { BASE_ID_ENUM } from "@/constant";

export const querySourceAvailablePositions = (
  source: Source | Resource<ResourceConstant> | Tombstone | Ruin
  // opts?: { findType: FindConstant; range: number }
) => {
  // const { findType = TERRAIN_MASK_WALL, range = 1 } = opts ?? {};
  // const aroundUnits = source.pos.findInRange(findType, range);
  const availablePositions: { x: number; y: number }[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const x = source.pos.x + dx;
      const y = source.pos.y + dy;

      if (
        Game.spawns[BASE_ID_ENUM.MainBase].room.getTerrain().get(x, y) !==
        TERRAIN_MASK_WALL
      ) {
        availablePositions.push({ x, y });
      }
    }
  }

  return availablePositions;
};
