// Strategy system (event-driven architecture)
// stage-specific configurations will be added per RCL level

const defaultConfig: LevelConfig = {
  level: 1,
  roles: [],
};

export function getStrategyConfig(level: number): LevelConfig {
  return defaultConfig;
}
