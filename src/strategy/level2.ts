import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 6,
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
      count: 10,
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
