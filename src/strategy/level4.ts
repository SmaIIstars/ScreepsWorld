import { generatorRoleBody } from '@/utils/lib/base/role';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 5,
      body: generatorRoleBody([
        { body: CARRY, count: 13 },
        { body: MOVE, count: 13 },
      ]),
    },
    builder: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 8 },
      ]),
    },
    upgrader: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 8 },
      ]),
    },
    repairer: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 8 },
      ]),
    },
  },
};

export default strategy;
