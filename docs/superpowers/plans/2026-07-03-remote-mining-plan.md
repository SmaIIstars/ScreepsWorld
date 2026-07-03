# Remote Mining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flag-based remote mining — player places a flag named after a room, system spawns remoteMiner + remoteHauler to extract energy and bring it home.

**Architecture:** Three new files: `structures/remote.ts` scans flags and posts spawn_req to the home room, `creeps/remoteMiner.ts` stays at remote source harvesting and dropping, `creeps/remoteHauler.ts` runs round-trip logistics. Both creeps repair and build structures in their vicinity.

**Tech Stack:** TypeScript, Screeps API, existing Guild event system, BaseCreep pattern.

## Global Constraints

- Follow existing file patterns: BaseCreep subclass for creeps, standalone function for lifecycle
- Flag name = target room name, flag.memory contains role/enabled/homeRoom/miners/haulers
- remoteMiner body: WORK×10 + CARRY×1 + MOVE×4 (1050 energy)
- remoteHauler body: CARRY×16 + MOVE×8 (2800 energy)
- Spawn priority: 45 (below local harvester/miner, above builder/upgrader)
- Source discovery: use Game.rooms[roomName]?.find(FIND_SOURCES), scan interval 100 ticks

---
````

### Task 1: Remote Lifecycle — Flag Scanning and Spawn Requests

**Files:**
- Create: `src/structures/remote.ts`
- Modify: `src/main.ts:4-5` (import and call)

**Interfaces:**
- Consumes: `Guild.post`, `Guild.cancel`, `buildDedupKey` from `../core/Guild` and `../core/Event`
- Produces: `runRemoteLifecycle()` — called once from main.ts, scans Game.flags, posts spawn_req

```typescript
// src/structures/remote.ts
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

function countLiving(role: string, homeRoom: string): number {
  let count = 0;
  for (const name in Game.creeps) {
    const mem = Memory.creeps[name];
    if (mem?.role === role && mem?.homeRoom === homeRoom) count++;
  }
  return count;
}

export function runRemoteLifecycle(): void {
  for (const flagName in Game.flags) {
    const flag = Game.flags[flagName];
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

    // ── remoteMiner ──
    const minerKey = buildDedupKey('spawn_req', homeRoom, 'remoteMiner_' + flagName);
    const livingMiners = countLiving('remoteMiner', homeRoom);
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

    // ── remoteHauler ──
    const haulerKey = buildDedupKey('spawn_req', homeRoom, 'remoteHauler_' + flagName);
    const livingHaulers = countLiving('remoteHauler', homeRoom);
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
```

- [ ] **Step 1: Create `src/structures/remote.ts`**

Copy the code above.

- [ ] **Step 2: Modify `src/main.ts` — add import and call**

```typescript
// Add after existing import block (line 6)
import { runRemoteLifecycle } from './structures/remote';

// In loop(), add after cleanupInstances() (line 27)
runRemoteLifecycle();
```

- [ ] **Step 3: Commit**

```bash
git add src/structures/remote.ts src/main.ts
git commit -m "feat: add remote mining lifecycle — flag scanning + spawn_req"
```

---

### Task 2: remoteMiner Creep

**Files:**
- Create: `src/creeps/remoteMiner.ts`
- Modify: `src/creeps/index.ts:4-5` (import + register)

**Interfaces:**
- Consumes: `BaseCreep`, `Guild`, existing behaviors (harvest, repair, build)
- Produces: `RemoteMinerCreep` class — exported for index.ts registration
- Creep memory extras: `sourceId` (bound source), `homeRoom` (set at spawn)
- `spawn_req.data` carries `homeRoom` and `targetRoom` so spawn.ts writes `homeRoom` to memory

```typescript
// src/creeps/remoteMiner.ts
import { BaseCreep } from './BaseCreep';

export class RemoteMinerCreep extends BaseCreep {
  /** Only accept harvest from real Sources. */
  protected queryEvents(): Event[] {
    const events = super.queryEvents();
    return events.filter((e) => {
      if (e.type !== 'harvest') return true;
      const target = Game.getObjectById(e.data.targetId as Id<any>);
      return target instanceof Source;
    });
  }

  run(): void {
    const homeRoom = this.creep.memory.homeRoom as string;
    const targetRoom = this.creep.memory.targetRoom as string;

    // Drop energy if full — let it fall to ground for hauler
    if (this.isFull()) {
      this.creep.drop(RESOURCE_ENERGY);
    }

    // Handle current event
    const event = this.getCurrentEvent();
    if (event) {
      if (this.isEventGone(event)) {
        this.dropEvent();
      } else if (!this.validateBehavior(event)) {
        this.resolveInvalidEvent(event);
      } else {
        this.executeBehavior(event);
        if (this.isBehaviorComplete(event)) {
          this.completeEvent(event);
        } else {
          return;
        }
      }
    }

    // Not in target room → move there
    if (this.creep.room.name !== targetRoom) {
      this.creep.moveTo(new RoomPosition(25, 25, targetRoom), {
        reusePath: 50,
        visualizePathStyle: { stroke: '#ffaa00' },
      });
      return;
    }

    // Bound to source → verify, harvest
    if (this.creep.memory.sourceId) {
      const source = Game.getObjectById(this.creep.memory.sourceId as Id<Source>);
      if (!source || source.energy === 0) {
        delete this.creep.memory.sourceId;
      } else {
        const result = this.creep.harvest(source);
        if (result === ERR_NOT_IN_RANGE) {
          this.creep.moveTo(source, { reusePath: 100, visualizePathStyle: { stroke: '#ffaa00' } });
        }
        // After harvesting (may have energy), do repair/build if nearby
        this.repairOrBuildNearby();
        return;
      }
    }

    // Claim harvest from a free source
    if (this.claimEvent(['harvest'])) {
      const claimed = this.getCurrentEvent();
      if (claimed) this.creep.memory.sourceId = claimed.data.targetId;
      return;
    }

    // Nothing to do — repair/build nearby if we have energy
    this.repairOrBuildNearby();
  }

  private repairOrBuildNearby(): void {
    if (!this.hasEnergy()) return;

    // First: repair damaged structures
    const damaged = this.creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER),
    });
    if (damaged) {
      if (this.creep.repair(damaged) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(damaged, { reusePath: 30 });
      }
      return;
    }

    // Second: build construction sites
    const site = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (site) {
      if (this.creep.build(site) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(site, { reusePath: 30 });
      }
    }
  }
}
```

- [ ] **Step 1: Create `src/creeps/remoteMiner.ts`**

Copy the code above.

- [ ] **Step 2: Register in `src/creeps/index.ts`**

```typescript
// After existing imports (line 5)
import { RemoteMinerCreep } from './remoteMiner';

// In switch, add case:
case 'remoteMiner': instances[name] = new RemoteMinerCreep(creep); break;
```

- [ ] **Step 3: Commit**

```bash
git add src/creeps/remoteMiner.ts src/creeps/index.ts
git commit -m "feat: add remoteMiner creep — stationary source harvester with repair/build"
```

---

### Task 3: remoteHauler Creep

**Files:**
- Create: `src/creeps/remoteHauler.ts`
- Modify: `src/creeps/index.ts:5-6` (import + register)

**Interfaces:**
- Consumes: `BaseCreep`, existing behaviors (collect, fill, repair, build)
- Produces: `RemoteHaulerCreep` class
- Creep memory extras: `homeRoom`, `targetRoom`, `returning` (bool state flag)

```typescript
// src/creeps/remoteHauler.ts
import { BaseCreep } from './BaseCreep';

export class RemoteHaulerCreep extends BaseCreep {
  run(): void {
    const homeRoom = this.creep.memory.homeRoom as string;
    const targetRoom = this.creep.memory.targetRoom as string;

    // Handle current event
    const event = this.getCurrentEvent();
    if (event) {
      if (this.isEventGone(event)) {
        this.dropEvent();
      } else if (!this.validateBehavior(event)) {
        this.resolveInvalidEvent(event);
      } else {
        this.executeBehavior(event);
        if (this.isBehaviorComplete(event)) {
          this.completeEvent(event);
        } else {
          return;
        }
      }
    }

    // State: returning home with energy
    if (this.creep.memory.returning) {
      // Arrived home → deposit to storage (or spawn)
      if (this.creep.room.name === homeRoom) {
        this.depositAtHome(homeRoom);
        return;
      }
      // En route home → move
      this.creep.moveTo(new RoomPosition(25, 25, homeRoom), {
        reusePath: 50,
        visualizePathStyle: { stroke: '#ffffff' },
      });
      this.repairOrBuildNearby();
      return;
    }

    // State: collecting in target room
    if (this.creep.room.name !== targetRoom) {
      // Travel to target room
      this.creep.moveTo(new RoomPosition(25, 25, targetRoom), {
        reusePath: 50,
        visualizePathStyle: { stroke: '#ffaa00' },
      });
      this.repairOrBuildNearby();
      return;
    }

    // In target room — collect energy
    // Check if full → switch to returning
    if (this.isFull()) {
      this.creep.memory.returning = true;
      return;
    }

    // Pick up dropped energy
    const dropped = this.creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY,
    });
    if (dropped) {
      if (this.creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(dropped, { reusePath: 30 });
      }
      return;
    }

    // Also check tombstones and ruins
    if (this.claimEvent(['collect'])) return;

    // Nothing to collect → repair/build if we have energy
    this.repairOrBuildNearby();
  }

  private depositAtHome(homeRoom: string): void {
    const storage = this.creep.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_STORAGE,
    })[0] as StructureStorage | undefined;

    const target = storage || this.creep.room.find(FIND_MY_SPAWNS)[0];
    if (!target) return;

    if (this.creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target, { reusePath: 30, visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }

    // Empty → go back to collecting
    if (this.isEmpty()) {
      this.creep.memory.returning = false;
    }
  }

  private repairOrBuildNearby(): void {
    if (!this.hasEnergy()) return;

    // Repair damaged structures (road, container)
    const damaged = this.creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER),
    });
    if (damaged) {
      if (this.creep.repair(damaged) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(damaged, { reusePath: 30 });
      }
      return;
    }

    // Build construction sites
    const site = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (site) {
      if (this.creep.build(site) === ERR_NOT_IN_RANGE) {
        this.creep.moveTo(site, { reusePath: 30 });
      }
    }
  }
}
```

- [ ] **Step 1: Create `src/creeps/remoteHauler.ts`**

Copy the code above.

- [ ] **Step 2: Register in `src/creeps/index.ts`**

```typescript
// After RemoteMinerCreep import
import { RemoteHaulerCreep } from './remoteHauler';

// In switch, add case:
case 'remoteHauler': instances[name] = new RemoteHaulerCreep(creep); break;
```

- [ ] **Step 3: Commit**

```bash
git add src/creeps/remoteHauler.ts src/creeps/index.ts
git commit -m "feat: add remoteHauler creep — round-trip energy logistics with repair/build"
```

---

### Task 4: Spawn Memory — Pass homeRoom and targetRoom

**Files:**
- Modify: `src/structures/spawn.ts:54-65` (spawnCreep call)

**Interfaces:**
- Consumes: `spawn_req.data.homeRoom`, `spawn_req.data.targetRoom`
- Produces: creep memory populated with homeRoom and targetRoom

The spawn.ts currently passes `{ memory: { role } }` to `spawnCreep`. We need to also pass `homeRoom` and `targetRoom` from the spawn_req data.

- [ ] **Step 1: Update `src/structures/spawn.ts`**

```typescript
// Change line ~54 from:
const creepName = role + '_' + Game.time + '_' + Math.floor(Math.random() * 1000);
const result = this.obj.spawnCreep(body, creepName, { memory: { role } });

// To:
const creepName = role + '_' + Game.time + '_' + Math.floor(Math.random() * 1000);
const result = this.obj.spawnCreep(body, creepName, {
  memory: {
    role,
    homeRoom: req.data.homeRoom,
    targetRoom: req.data.targetRoom,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/structures/spawn.ts
git commit -m "feat: pass homeRoom and targetRoom from spawn_req to creep memory"
```

---

### Task 5: Integration Test

**Files:**
- No new files — verify end-to-end flow

- [ ] **Step 1: Verify the code compiles**

Check the project compiles without TypeScript errors.

- [ ] **Step 2: Manual test checklist**

1. Place a flag in a nearby room named after that room (e.g. `W21N3`)
2. Set flag memory: `{role:'remote_mine', enabled:true, homeRoom:'E49S54', miners:2, haulers:2}`
3. Wait for spawn_req to appear (check Guild or console log)
4. After spawn, verify creep memory has `homeRoom` and `targetRoom` set
5. Verify remoteMiner walks to target room and starts harvesting
6. Verify remoteHauler walks to target room, picks up energy, returns home, deposits to storage

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: remote mining integration fixes"
```
