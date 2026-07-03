import { createBody } from '../utils/body';

const configs: Record<number, LevelConfig> = {
  1: {
    level: 1,
    roles: [
      {
        type: 'harvester',
        body: createBody({ work: 2, carry: 1, move: 1 }),
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: createBody({ work: 1, carry: 1, move: 1 }),
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
        body: createBody({ work: 2, carry: 3, move: 2 }),
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: createBody({ work: 2, carry: 3, move: 2 }),
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'builder',
        body: createBody({ work: 2, carry: 3, move: 2 }),
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
        body: createBody({ work: 6, carry: 1, move: 1 }),
        tags: ['harvest', 'move'],
        minCapacities: { harvest: 1 },
        target: 2,
      },
      {
        type: 'harvester',
        body: createBody({ carry: 10, move: 5 }),
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: createBody({ work: 4, carry: 4, move: 4 }),
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 10,
      },
      {
        type: 'builder',
        body: createBody({ work: 3, carry: 8, move: 2 }),
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 1,
      },
    ],
  },
  4: {
    level: 4,
    roles: [
      {
        type: 'miner',
        body: createBody({ work: 6, carry: 1, move: 1 }),
        tags: ['harvest', 'move'],
        minCapacities: { harvest: 1 },
        target: 2,
      },
      {
        type: 'harvester',
        body: createBody({ carry: 10, move: 5 }),
        tags: ['harvest', 'transport', 'move'],
        minCapacities: { harvest: 1, carry: 50 },
        target: 2,
      },
      {
        type: 'upgrader',
        body: createBody({ work: 4, carry: 4, move: 4 }),
        tags: ['work', 'transport', 'move'],
        minCapacities: { work: 1, carry: 50 },
        target: 5,
      },
      {
        type: 'builder',
        body: createBody({ work: 3, carry: 8, move: 2 }),
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
