import Builder from "./builder";
import Harvester from "./harvester";
import Miner from "./miner";
import MinerStore from "./miner/store";
import Upgrader from "./upgrader";

export const role: Record<string, BaseRole> = {
  harvester: Harvester,
  builder: Builder,
  upgrader: Upgrader,
  miner: Miner,
  minerStore: MinerStore,
};
