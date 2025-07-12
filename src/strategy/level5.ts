import { BaseRole } from '@/utils/lib/base/BaseRole';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: CARRY, count: 23 },
        { body: MOVE, count: 12 },
      ]),
    },
    pioneer: {
      count: 0,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
    builder: {
      count: 0,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
    miner: {
      count: 2,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    upgrader: {
      count: 4,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 9 },
      ]),
    },
    repairer: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 1 },
        { body: CARRY, count: 15 },
        { body: MOVE, count: 4 },
      ]),
    },
  },
};

export default strategy;
