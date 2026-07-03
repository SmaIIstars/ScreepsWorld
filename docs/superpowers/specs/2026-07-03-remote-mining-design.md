# Remote Mining — Flag-based Cross-Room Resource Extraction

**Date:** 2026-07-03
**Status:** design
**Scope:** New feature — remote mining via flags

## Overview

When the home room's sources are depleted, send creeps to adjacent/nearby rooms flagged by the player to harvest energy and haul it back. Uses a two-creep model: remoteMiner (stationary at source) and remoteHauler (round-trip transport).

## Flag Configuration

Player manually places a flag in the target room. Flag name = room name (e.g. `W21N3`).

Flag memory (player-set):

```typescript
{
  role: 'remote_mine',
  enabled: true,        // false = pause mining for this flag
  homeRoom: 'E49S54',   // which room spawns & receives energy
  miners: 2,            // number of remoteMiners desired
  haulers: 2,           // number of remoteHaulers desired
}
```

Flag memory (system-populated):

```typescript
{
  sourceIds: ['id1', 'id2'],  // source IDs in target room
  lastScan: 0,                // tick of last source scan
}
```

## Architecture

### New Files

| File | Responsibility |
|------|---------------|
| `structures/remote.ts` | Scan Game.flags → check need → post spawn_req to homeRoom |
| `creeps/remoteMiner.ts` | Travel to flag room, bind to source, harvest + drop, repair/build nearby |
| `creeps/remoteHauler.ts` | Travel loop: collect from remote → return home → deposit to storage, repair/build en route |

### Creep Specifications

#### remoteMiner

- **Body:** `WORK×10 + CARRY×1 + MOVE×4` (1050 energy)
- **Per flag:** 1 miner per source. Player sets `miners` ≤ actual source count in the room. If `miners` > source count, extra miners are not spawned.
- **Behavior:**
  1. Travel to flag room
  2. Bind to assigned source (1 miner per source)
  3. `harvest` until full
  4. When full → `drop()` energy on ground
  5. If nearby structures (road, container) are damaged and creep has energy → `repair`
  6. If nearby construction sites → `build`
  7. Dead → system respawns automatically

#### remoteHauler

- **Body:** `CARRY×16 + MOVE×8` (2800 energy)
- **Per flag:** as configured (`haulers`)
- **Behavior:**
  1. Travel to flag room
  2. `collect` / `pickup` dropped energy until full
  3. If en route structures damaged and creep has energy → `repair`
  4. If en route construction sites → `build`
  5. Return to homeRoom → deposit to `STRUCTURE_STORAGE` (fallback: spawn)
  6. Repeat

### Spawn Strategy

`structures/remote.ts` runs each tick:

```
for each flag in Game.flags:
  if flag.memory.role !== 'remote_mine' → skip
  if flag.memory.enabled === false → skip
  if flag.memory.homeRoom not set → skip

  scan target room sources if stale → fill flag.memory.sourceIds

  count living remoteMiners / remoteHaulers for this flag
  if shortage:
    post spawn_req(room=homeRoom, role, body, priority=45, count=desired)

  removed flag → cancel spawn_req + no longer spawn
```

Spawn priority deliberately lower than local economy:
- harvester (70-90) > miner (70-90) > remoteMiner/hauler (45) > builder/upgrader

### Lifecycle Integration

In `runStructureLifecycles`, after workforce:

```typescript
runRemoteLifecycle(room);
```

Or called from `main.ts` after all rooms are processed (flags are global, not per-room).

### Source Discovery

When scanning a new flag room:
- Use `Game.map.describeExits(roomName)` to verify room is reachable
- `Game.rooms[roomName]?.find(FIND_SOURCES)` to discover sources
- Store source IDs in flag.memory.sourceIds

For rooms not visible (out of sight range), the system defers scanning until a creep enters.

### Memory Cleanup

- When a creep dies → `checkDeadCreeps` already handles memory cleanup
- When a flag is removed → cancel associated spawn_req, creep bindings expire naturally
- Stale sourceIds (source depleted) → miner moves to next source, or idles

## Edge Cases

1. **Flag room unreachable** — skip, don't spawn
2. **Hauler dies mid-trip** — energy dropped as tombstone, next hauler collects
3. **Miner dies** — assignment released, new miner spawned and rebinds
4. **Home room storage destroyed** — hauler falls back to spawn
5. **Multiple flags targeting same room** — each flag independently managed
6. **Flag disabled mid-operation** — existing creeps finish, no new ones spawned
