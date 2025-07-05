export const querySourceAvailablePositions = (source: Source) => {
  const terrain = source.room.getTerrain();
  const availablePositions: { x: number; y: number }[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const x = source.pos.x + dx;
      const y = source.pos.y + dy;
      if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
        availablePositions.push({ x, y });
      }
    }
  }

  return availablePositions;
};
