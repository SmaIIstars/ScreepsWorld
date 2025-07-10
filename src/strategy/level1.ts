import { BaseRole } from '@/utils/lib/base/BaseRole';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 5,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
    builder: {
      count: 8,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
    upgrader: {
      count: 5,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 1 },
      ]),
    },
    pioneer: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 2 },
      ]),
    },
  },
};

export default strategy;
