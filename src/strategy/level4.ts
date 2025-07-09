import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 2,
      body: generatorRoleBody([
        { body: CARRY, count: 17 },
        { body: MOVE, count: 9 },
      ]),
    },
    builder: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 8 },
      ]),
    },
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: MOVE, count: 2 },
      ]),
    },
    upgrader: {
      count: 6,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 8 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 8 },
      ]),
    },
  },
};

export default strategy;
