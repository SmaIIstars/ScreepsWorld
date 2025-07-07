import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 5,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
    builder: {
      count: 8,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
    upgrader: {
      count: 5,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
  },
};

export default strategy;
