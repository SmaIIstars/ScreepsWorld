import { StrategyType } from ".";

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 4,
      body: [
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
      ],
    },
    builder: {
      count: 2,
      body: [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    },
    upgrader: {
      count: 14,
      body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    },
    miner: {
      count: 4,
      body: [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE],
    },
    minerStore: {
      count: 0,
      body: [
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        CARRY,
        MOVE,
      ],
    },
  },
};

export default strategy;
