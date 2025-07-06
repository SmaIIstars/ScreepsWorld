import { StrategyType } from ".";

const strategy: StrategyType = {
  roleMonitor: {
    harvester: { count: 5, body: [WORK, WORK, CARRY, MOVE] },
    builder: { count: 8, body: [WORK, WORK, CARRY, MOVE] },
    upgrader: { count: 5, body: [WORK, WORK, CARRY, MOVE] },
    miner: { count: 0, body: [] },
  },
};

export default strategy;
