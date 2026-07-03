import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

const REMOTE_SCAN_INTERVAL = 100;

const REMOTE_MINER_BODY: BodyPartConstant[] = [];
for (let i = 0; i < 10; i++) REMOTE_MINER_BODY.push(WORK);
REMOTE_MINER_BODY.push(CARRY);
for (let i = 0; i < 4; i++) REMOTE_MINER_BODY.push(MOVE);

const REMOTE_HAULER_BODY: BodyPartConstant[] = [];
for (let i = 0; i < 16; i++) REMOTE_HAULER_BODY.push(CARRY);
for (let i = 0; i < 8; i++) REMOTE_HAULER_BODY.push(MOVE);

function countLiving(role: string, homeRoom: string, targetRoom: string): number {
  let count = 0;
  for (const name in Game.creeps) {
    const mem = Memory.creeps[name];
    if (mem?.role === role && mem?.homeRoom === homeRoom && mem?.targetRoom === targetRoom && (Game.creeps[name]?.ticksToLive ?? 0) >= 100) count++;
  }
  return count;
}

export function runRemoteLifecycle(): void {
  for (const flagName in Game.flags) {
    const flag = Game.flags[flagName];
    if (!flag) continue;
    const mem = flag.memory;

    // Validate flag config
    if (mem.role !== 'remote_mine') continue;
    if (!mem.enabled) continue;
    const homeRoom = mem.homeRoom as string;
    if (!homeRoom || !Game.rooms[homeRoom]?.controller?.my) continue;

    // Source discovery (cached, interval)
    if (!mem.sourceIds || (Game.time - (mem.lastScan || 0)) > REMOTE_SCAN_INTERVAL) {
      const targetRoom = Game.rooms[flag.pos.roomName];
      if (targetRoom) {
        mem.sourceIds = targetRoom.find(FIND_SOURCES).map(s => s.id);
        mem.lastScan = Game.time;
      }
    }

    const sourceIds = (mem.sourceIds as string[]) || [];
    const desiredMiners = Math.min((mem.miners as number) || 0, sourceIds.length);
    const desiredHaulers = (mem.haulers as number) || 0;

    // remoteMiner
    const minerKey = buildDedupKey('spawn_req', homeRoom, 'remoteMiner_' + flagName);
    const livingMiners = countLiving('remoteMiner', homeRoom, flag.pos.roomName);
    if (livingMiners < desiredMiners) {
      Guild.post({
        type: 'spawn_req',
        room: homeRoom,
        targetId: 'remoteMiner_' + flagName,
        requiredTags: ['spawner'],
        priority: 45,
        data: {
          role: 'remoteMiner',
          body: REMOTE_MINER_BODY,
          tags: ['harvest', 'move'],
          minCapacities: { harvest: 1 },
          count: desiredMiners,
          homeRoom: homeRoom,
          targetRoom: flag.pos.roomName,
        },
      });
    } else {
      Guild.cancel(minerKey);
    }

    // remoteHauler
    const haulerKey = buildDedupKey('spawn_req', homeRoom, 'remoteHauler_' + flagName);
    const livingHaulers = countLiving('remoteHauler', homeRoom, flag.pos.roomName);
    if (livingHaulers < desiredHaulers) {
      Guild.post({
        type: 'spawn_req',
        room: homeRoom,
        targetId: 'remoteHauler_' + flagName,
        requiredTags: ['spawner'],
        priority: 45,
        data: {
          role: 'remoteHauler',
          body: REMOTE_HAULER_BODY,
          tags: ['transport', 'move'],
          minCapacities: { carry: 50 },
          count: desiredHaulers,
          homeRoom: homeRoom,
          targetRoom: flag.pos.roomName,
        },
      });
    } else {
      Guild.cancel(haulerKey);
    }
  }
}
