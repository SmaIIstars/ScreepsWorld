import { StrategyType } from ".";

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 4,
      body: [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    },
    builder: {
      count: 8,
      body: [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    },
    upgrader: {
      count: 10,
      body: [WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    },
    miner: {
      count: 4,
      body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
    },
  },
};

export default strategy;
