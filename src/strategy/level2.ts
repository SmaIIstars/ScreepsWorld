import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: generatorRoleBody([
        { body: CARRY, count: 7 },
        { body: MOVE, count: 4 },
      ]),
    },
    builder: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 4 },
        { body: MOVE, count: 3 },
      ]),
    },
    upgrader: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 3 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 4 },
        { body: MOVE, count: 3 },
      ]),
    },
  },
};

export default strategy;
