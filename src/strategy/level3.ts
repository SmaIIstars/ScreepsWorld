import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: generatorRoleBody([
        { body: CARRY, count: 12 },
        { body: MOVE, count: 6 },
      ]),
    },
    builder: {
      count: 3,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 8,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
  },
};

export default strategy;
