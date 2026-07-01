const configs: Record<number, LevelConfig> = {
  1: {
    level: 1,
    roles: [
      {
        type: 'harvester',
        body: [WORK, WORK, CARRY, MOVE],
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: [WORK, CARRY, MOVE],
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 1,
      },
    ],
  },
  2: {
    level: 2,
    roles: [
      {
        type: 'harvester',
        body: [WORK, WORK, CARRY, MOVE],
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: [WORK, CARRY, MOVE],
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 1,
      },
      {
        type: 'builder',
        body: [WORK, WORK, CARRY, MOVE],
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 5,
      },
    ],
  },
};

export function getStrategyConfig(level: number): LevelConfig {
  // Use exact level config if exists, otherwise highest available below this level
  for (let lvl = level; lvl >= 1; lvl--) {
    if (configs[lvl]) return configs[lvl];
  }
  return configs[1];
}
