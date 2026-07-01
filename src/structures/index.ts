import { SourceLifecycle } from './source';
import { ControllerLifecycle } from './controller';
import { SiteLifecycle } from './site';
import { SpawnLifecycle } from './spawn';
import { runWorkforceLifecycle } from './workforce';

export function runStructureLifecycles(room: Room): void {
  // Sources
  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    new SourceLifecycle(source).runLifecycle();
  }

  // Controller
  if (room.controller) {
    new ControllerLifecycle(room.controller).runLifecycle();
  }

  // Construction sites
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
  for (const site of sites) {
    new SiteLifecycle(site).runLifecycle();
  }

  // Spawns
  const spawns = room.find(FIND_MY_SPAWNS);
  for (const spawn of spawns) {
    new SpawnLifecycle(spawn).runLifecycle();
  }

  // Workforce (room-level)
  runWorkforceLifecycle(room);
}
