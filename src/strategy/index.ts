import defaultRoleMonitor from "./default";
import level1 from "./level1";
import level2 from "./level2";

const strategies: StrategyType[] = [level1, level2];

export type StrategyType = {
  roleMonitor: Partial<
    Record<CustomRoleType, { count: number; body: BodyPartConstant[] }>
  >;
};

export const getStrategy = (level: number) => {
  // 根据level获取strategy
  // 如果有当前策略则使用当前策略
  // 如果没有当前策略则降级使用上一级策略
  // 直到找到策略为止
  for (let i = level; i >= 1; i--) {
    const strategy = strategies[i - 1];
    if (strategy) {
      return strategy;
    }
  }

  return defaultRoleMonitor;
};

export default strategies;
