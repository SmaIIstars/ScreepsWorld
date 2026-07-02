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
        body: [WORK, WORK, CARRY, MOVE, CARRY, CARRY, MOVE],
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: [WORK, WORK, CARRY, MOVE, CARRY, CARRY, MOVE],
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'builder',
        body: [WORK, WORK, CARRY, MOVE, CARRY, CARRY, MOVE],
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 3,
      },
    ],
  },
  3: {
    level: 3,
    roles: [
      {
        type: 'miner',
        body: [WORK, WORK, WORK, WORK, CARRY, MOVE],
        tags: ['harvest', 'move'],
        minCapacities: { harvest: 1 },
        target: 2,
      },
      {
        type: 'harvester',
        body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: [WORK, WORK, CARRY, MOVE, CARRY, CARRY, MOVE],
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'builder',
        body: [WORK, WORK, CARRY, MOVE, CARRY, CARRY, MOVE],
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
