import { StrategyType } from ".";

const strategy: StrategyType = {
  roleMonitor: {
    harvester: { count: 4, body: [WORK, WORK, CARRY, MOVE] },
    builder: { count: 3, body: [WORK, CARRY, CARRY, MOVE, MOVE] },
    upgrader: { count: 3, body: [WORK, CARRY, CARRY, MOVE, MOVE] },
    miner: {
      count: 0,
      body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
    },
  },
};

export default strategy;
