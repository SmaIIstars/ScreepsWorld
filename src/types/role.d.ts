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

type CustomRoleType =
  | "harvester"
  | "builder"
  | "upgrader"
  | "miner"
  | "minerStore"
  | "repairer";

type CustomTaskType =
  | "harvesting"
  | "mining"
  | "building"
  | "transferring"
  | "moving"
  | "upgrading"
  | "repairing"
  | "idle";
