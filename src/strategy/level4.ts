import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 5,
      body: generatorRoleBody([
        { body: CARRY, count: 11 },
        { body: MOVE, count: 5 },
      ]),
    },
    builder: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
  },
};

export default strategy;
