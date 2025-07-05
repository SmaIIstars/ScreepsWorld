import { StrategyType } from ".";

const strategy: StrategyType = {
  roleMonitor: {
    harvester: { count: 5, body: [WORK, WORK, CARRY, MOVE] },
    builder: { count: 8, body: [WORK, CARRY, CARRY, MOVE, MOVE] },
    upgrader: { count: 5, body: [WORK, CARRY, CARRY, MOVE, MOVE] },
    miner: {
      count: 0,
      body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
    },
  },
};

export default strategy;
