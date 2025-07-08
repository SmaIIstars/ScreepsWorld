import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 8,
      body: generatorRoleBody([
        { body: CARRY, count: 10 },
        { body: MOVE, count: 6 },
      ]),
    },
    builder: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 10,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 5,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
  },
};

export default strategy;
