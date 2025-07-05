type BaseRole<T = Record<string, any>> = {
  run: (creep: Creep, opts?: T) => void;
  create: (
    baseId?: string,
    spawnCreepParams?: Partial<{
      body: BodyPartConstant[];
      name: string;
      opts?: SpawnOptions;
    }>
  ) => ScreepsReturnCode;
};

type CustomRoleType = "harvester" | "builder" | "upgrader" | "miner";
type CustomTaskType =
  | "harvesting"
  | "building"
  | "upgrading"
  | "repairing"
  | "idle";
