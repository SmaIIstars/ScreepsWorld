import { BaseRole } from '@/utils/lib/base/BaseRole';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: BaseRole.generatorRoleBody([
        { body: CARRY, count: 17 },
        { body: MOVE, count: 9 },
      ]),
    },
    // pioneer: {
    //   count: 3,
    //   body: BaseRole.generatorRoleBody([
    //     { body: WORK, count: 6 },
    //     { body: CARRY, count: 7 },
    //     { body: MOVE, count: 7 },
    //   ]),
    // },
    builder: {
      count: 1,
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
        { body: MOVE, count: 4 },
      ]),
    },
    upgrader: {
      count: 6,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
    repairer: {
      count: 2,
      body: BaseRole.generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
  },
};

export default strategy;
