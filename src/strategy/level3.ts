import { BaseRole } from '@/utils/lib/base/BaseRole';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 4,
      body: BaseRole.generatorRoleBody([
        { body: CARRY, count: 11 },
        { body: MOVE, count: 5 },
      ]),
    },
    builder: {
      count: 3,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 6,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 5,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
  },
};

export default strategy;
