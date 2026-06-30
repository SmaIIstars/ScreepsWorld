import defaultRoleMonitor from './default';
import level1 from './level1';
import level2 from './level2';
import level3 from './level3';
import level4 from './level4';
import level5 from './level5';
import level6 from './level6';
import level7 from './level7';
import level8 from './level8';

// Old strategy system (unchanged, for backward compatibility)
export type StrategyType = {
  roleMonitor: Partial<Record<CustomRoleType, { count: number; body: BodyPartConstant[] }>>;
};

const strategies: StrategyType[] = [level1, level2, level3, level4, level5, level6, level7, level8];

export const getStrategy = (level: number): StrategyType => {
  for (let i = level; i >= 1; i--) {
    const strategy = strategies[i - 1];
    if (strategy) return strategy;
  }
  return defaultRoleMonitor;
};

// New strategy system (event-driven architecture)
const defaultConfig: LevelConfig = {
  level: 1,
  roles: [],
};

export function getStrategyConfig(level: number): LevelConfig {
  return defaultConfig;
}

export default strategies;
