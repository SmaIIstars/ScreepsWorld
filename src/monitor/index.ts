import { energyMonitor } from './energyMonitor';
import { upgradeMonitor } from './upgradeMonitor';

export function roomMonitor(room: Room): void {
  energyMonitor(room);
  upgradeMonitor(room);
}
