import { BaseRole } from '@/utils/lib/base/BaseRole';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: CARRY, count: 13 },
        { body: MOVE, count: 13 },
      ]),
    },
    builder: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 4 },
        { body: MOVE, count: 10 },
      ]),
    },
    miner: {
      count: 2,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: MOVE, count: 2 },
      ]),
    },
    upgrader: {
      count: 6,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 4 },
        { body: MOVE, count: 10 },
      ]),
    },
    repairer: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 4 },
        { body: MOVE, count: 10 },
      ]),
    },
  },
};

export default strategy;
