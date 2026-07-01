import { energyMonitor } from './energyMonitor';
import { upgradeMonitor } from './upgradeMonitor';
import { workforceMonitor } from './workforceMonitor';
import { constructionMonitor } from './constructionMonitor';

export function roomMonitor(room: Room): void {
  energyMonitor(room);
  upgradeMonitor(room);
  workforceMonitor(room);
  constructionMonitor(room);
}
