import Builder from "./builder";
import Harvester from "./harvester";
import Miner from "./miner";
import Upgrader from "./upgrader";

export const role: Record<string, BaseRole> = {
  harvester: Harvester,
  builder: Builder,
  upgrader: Upgrader,
  miner: Miner,
};
