'use strict';
var N = Object.defineProperty;
var U = (e, t, r) => (t in e ? N(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (e[t] = r));
var v = (e, t, r) => U(e, typeof t != 'symbol' ? t + '' : t, r);
const M = require('lodash');
var E = ((e) => ((e.MainBase = 'Spawn1'), e))(E || {}),
  T = ((e) => ((e.MainRoom = 'E49S54'), e))(T || {});
Object.values(E);
const l = {
    mining: '⛏️',
    waiting: '⏳',
    transferring: '🔄',
    receiving: '📥',
    harvesting: '🌾',
    full: '🛑',
    building: '🚧',
    upgrading: '⚡',
    repairing: '🔧',
  },
  y = (e, t, r = {}) => {
    const { time: o = Game.time } = r;
    o % e === 0 && t();
  },
  S = {
    getVisualStatus: (e) => {
      var o;
      const t = e.fatigue,
        r = `${(o = e.memory.role) == null ? void 0 : o.slice(0, 3)} ${t > 0 ? t : ''}`;
      return e.room.visual.text(r, e.pos.x, e.pos.y - 1, {
        font: 0.5,
        color: '#00ff00',
        stroke: '#000000',
        strokeWidth: 0.1,
      });
    },
    create: (e) => {
      var m, g;
      const { baseId: t = E.MainBase, body: r, name: o, role: s, opts: a } = e,
        n = o != null ? o : `${s}-${Game.time}`;
      return (g = (m = Game.spawns) == null ? void 0 : m[t]) == null
        ? void 0
        : g.spawnCreep(r, n, M.merge({ memory: { role: s } }, a));
    },
  },
  f = (e) => e.reduce((t, { body: r, count: o }) => t.concat(Array(o).fill(r)), []),
  p = (e, t, r = 1) => {
    var g, R;
    const o = {},
      s = Game.rooms[T.MainRoom];
    if (!s) return [];
    const a = [{ x: e, y: t }],
      n = new Set();
    for (; a.length > 0; ) {
      const i = a.pop();
      if (n.has(`${i.x}-${i.y}`)) continue;
      n.add(`${i.x}-${i.y}`);
      const c = s
        .lookAtArea(i.y - r, i.x - r, i.y + r, i.x + r, !0)
        .filter((u) => (u == null ? void 0 : u.terrain) !== 'wall' && u.type !== 'source');
      for (const u of c)
        if ((u == null ? void 0 : u.type) === 'creep' && u.creep) {
          const d = Game.creeps[(g = u.creep) == null ? void 0 : g.name];
          ['miner', 'minerStore'].includes((R = d.memory.role) != null ? R : '') && a.push({ x: u.x, y: u.y });
        } else n.add(`${u.x}-${u.y}`), o[`${u.x}-${u.y}`] ? o[`${u.x}-${u.y}`].push(u) : (o[`${u.x}-${u.y}`] = [u]);
    }
    const m = [];
    return (
      Object.entries(o).forEach(([i, c]) => {
        if (new Array(...new Set(c)).every((d) => !['creep', 'structure'].includes(d.type))) {
          const [d, C] = i.split('-');
          m.push({ x: Number(d), y: Number(C) });
        }
      }),
      m
    );
  },
  b = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
  k = (e, t) => {
    var r;
    if (e.memory.task === 'transferring') {
      if (e.store[RESOURCE_ENERGY] === 0) {
        e.memory.task = 'harvesting';
        return;
      }
      const o = e.room
        .find(FIND_STRUCTURES, {
          filter: (s) => b.includes(s.structureType) && 'store' in s && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        })
        .sort((s, a) => {
          const n = b.indexOf(s.structureType),
            m = b.indexOf(a.structureType);
          return n - m;
        });
      o.length > 0 &&
        e.transfer(o[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE &&
        e.moveTo(o[0], { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    if (e.store.getFreeCapacity() === 0) {
      e.memory.role === 'harvester' && (e.memory.task = 'transferring');
      return;
    }
    if (e.store[RESOURCE_ENERGY] === 0 && e.memory.task !== 'harvesting') {
      e.memory.task = 'harvesting';
      return;
    }
    if (e.store.getFreeCapacity() > 0 && e.memory.task === 'harvesting') {
      if (e.memory.role !== 'harvester') {
        const R = e.room.find(FIND_STRUCTURES, {
          filter: (i) =>
            i.structureType === STRUCTURE_CONTAINER && i.store[RESOURCE_ENERGY] > e.store.getFreeCapacity(),
        });
        if (R.length > 0)
          if (e.pos.isNearTo(R[0])) {
            e.withdraw(R[0], RESOURCE_ENERGY) === OK && e.say(l.receiving);
            return;
          } else {
            e.moveTo(R[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
          }
      }
      const s = Object.values(Memory.resources)
        .map((R) => R.source)
        .reduce(
          (R, i) => {
            var c, u, d, C;
            return (
              i instanceof Source && i.energy > 0
                ? (R.Source = [...((c = R.Source) != null ? c : []), i])
                : i instanceof Resource && i.amount > 0
                ? (R.Resource = [...((u = R.Resource) != null ? u : []), i])
                : i instanceof Tombstone && i.store[RESOURCE_ENERGY] > 0
                ? (R.Tombstone = [...((d = R.Tombstone) != null ? d : []), i])
                : i instanceof Ruin &&
                  i.store[RESOURCE_ENERGY] > 0 &&
                  (R.Ruin = [...((C = R.Ruin) != null ? C : []), i]),
              R
            );
          },
          { Source: [], Resource: [], Tombstone: [], Ruin: [] },
        );
      if (s.Resource.length > 0) {
        const R = s.Resource[0],
          i = e.pickup(R);
        i === OK
          ? e.say(l.harvesting)
          : i === ERR_NOT_IN_RANGE && e.moveTo(R, { visualizePathStyle: { stroke: '#ffaa00' } });
        return;
      }
      if (e.memory.role !== 'harvester' && (s.Tombstone.length > 0 || s.Ruin.length > 0)) {
        const R = (r = s.Tombstone[0]) != null ? r : s.Ruin[0],
          i = e.withdraw(R, RESOURCE_ENERGY);
        i === OK
          ? e.say(l.harvesting)
          : i === ERR_NOT_IN_RANGE && e.moveTo(R, { visualizePathStyle: { stroke: '#ffaa00' } });
        return;
      }
      if (
        e.memory.role !== 'harvester' ||
        (e.memory.role === 'harvester' && (t == null ? void 0 : t.priority) === 'high')
      ) {
        const R = e.pos.findClosestByPath(FIND_MY_CREEPS, {
          filter: (i) => {
            if ((i.memory.role === 'miner' || i.memory.role === 'minerStore') && i.store[RESOURCE_ENERGY] > 0) {
              const c = p(i.pos.x, i.pos.y);
              return (c == null ? void 0 : c.length) > 1;
            }
            return !1;
          },
        });
        if (R && !e.pos.isNearTo(R)) {
          e.moveTo(R);
          return;
        }
      }
      const { priority: a = 'low' } = t != null ? t : {},
        n = s.Source;
      if (n.length === 0) return;
      const m = a === 'high' ? n[0] : n[n.length - 1];
      e.memory.targetSourceId = m.id;
      const g = e.harvest(m);
      g === OK
        ? y(10, () => e.say(l.harvesting))
        : g === ERR_NOT_IN_RANGE && e.moveTo(m, { visualizePathStyle: { stroke: '#ffaa00' } });
      return;
    }
  },
  A = (e, t = {}) =>
    S.create({
      baseId: e,
      body: [WORK, WORK, CARRY, MOVE],
      role: 'harvester',
      opts: { memory: { task: 'harvesting' } },
      ...t,
    }),
  h = { run: k, create: A },
  _ = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTAINER],
  Y = (e, t = {}) => {
    const r = e.room.find(FIND_MY_CONSTRUCTION_SITES).sort((o, s) => {
      const a = _.indexOf(o.structureType),
        n = _.indexOf(s.structureType);
      return a - n;
    });
    if (r.length === 0) {
      h.run(e, t), (e.memory.task = 'harvesting');
      return;
    }
    if (
      (e.memory.task === 'building' &&
        e.store[RESOURCE_ENERGY] === 0 &&
        (y(10, () => e.say(l.harvesting)), (e.memory.task = 'harvesting')),
      e.memory.task === 'harvesting' &&
        e.store.getFreeCapacity() === 0 &&
        (y(10, () => e.say(l.building)), (e.memory.task = 'building')),
      e.memory.task === 'harvesting' && h.run(e, t),
      e.memory.task === 'building')
    ) {
      const o = r.filter((s) => s.progress < s.progressTotal);
      if (o.length === 0) {
        e.memory.task = 'harvesting';
        return;
      }
      e.build(o[0]) === ERR_NOT_IN_RANGE && e.moveTo(o[0], { visualizePathStyle: { stroke: '#ffffff' } });
    }
  },
  G = (e, t = {}) =>
    S.create({
      baseId: e,
      body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
      role: 'builder',
      opts: { memory: { task: 'building' } },
      ...t,
    }),
  I = { run: Y, create: G },
  w = (e) => {
    var o, s;
    e.store.getFreeCapacity() === 0 && y(5, () => e.say(l.full));
    const t = e.pos
      .findInRange(FIND_MY_CREEPS, 1)
      .filter((a) => a.store.getFreeCapacity() > 0)
      .sort((a, n) =>
        a.memory.role === 'miner' && n.memory.role !== 'miner'
          ? 1
          : a.memory.role !== 'miner' && n.memory.role === 'miner'
          ? -1
          : 0,
      );
    if (t.length > 0) {
      const a = t[0];
      e.transfer(a, RESOURCE_ENERGY) === OK && y(5, () => e.say(l.transferring));
    }
    let r = null;
    if (
      (e.memory.targetSourceId
        ? (r = (s = Memory.resources[e.memory.targetSourceId]) == null ? void 0 : s.source)
        : ((r =
            (o = Object.values(Memory.resources)
              .filter((n) => n.source instanceof Source && n.source.energy > 0 && n.source.ticksToRegeneration < 300)
              .map((n) => n.source)
              .pop()) != null
              ? o
              : null),
          (e.memory.targetSourceId = r == null ? void 0 : r.id)),
      !!r)
    ) {
      if (e.memory.task === 'mining') {
        const a = e.harvest(r);
        a === OK ? y(10, () => e.say(l.mining)) : a === ERR_NOT_ENOUGH_RESOURCES && y(10, () => e.say(l.waiting));
      }
      e.memory.task === 'harvesting' &&
        (e.moveTo(r, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 }),
        e.pos.isNearTo(r) && (e.memory.task = 'mining'));
    }
  },
  x = (e, t = {}) =>
    S.create({
      baseId: e,
      body: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE],
      role: 'miner',
      opts: { memory: { task: 'harvesting' } },
      ...t,
    }),
  W = { run: w, create: x },
  K = (e) => {
    const t = e.pos
      .findInRange(FIND_MY_CREEPS, 1)
      .filter((r) => r.store.getFreeCapacity() > 0 && r.memory.role !== 'miner')
      .sort((r) => (r.memory.role !== 'miner' && r.memory.role !== 'minerStore' ? -1 : 0));
    for (let r of t) e.transfer(r, RESOURCE_ENERGY) === OK && y(5, () => e.say(l.transferring));
  },
  $ = (e, t = {}) =>
    S.create({
      baseId: e,
      body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE],
      role: 'minerStore',
      ...t,
    }),
  F = { run: K, create: $ },
  V = (e) => {
    if (e.memory.task === 'repairing' && e.store[RESOURCE_ENERGY] === 0) {
      e.say(l.harvesting), (e.memory.task = 'harvesting');
      return;
    }
    if (e.memory.task === 'harvesting') {
      e.store.getFreeCapacity() === 0 ? ((e.memory.task = 'repairing'), e.say(l.repairing)) : h.run(e);
      return;
    }
    if (e.memory.task === 'repairing') {
      const t = e.room
        .find(FIND_STRUCTURES, { filter: (o) => o.hits < o.hitsMax || o.structureType === STRUCTURE_TOWER })
        .sort((o, s) =>
          o.structureType === STRUCTURE_TOWER && s.structureType !== STRUCTURE_TOWER
            ? -1
            : o.structureType !== STRUCTURE_TOWER && s.structureType === STRUCTURE_TOWER
            ? 1
            : Math.abs(o.hits - s.hits) > 1e3
            ? o.hits - s.hits
            : 0,
        );
      if (!t.length) return;
      const r = t[0];
      if (r.structureType === STRUCTURE_TOWER && r.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        e.transfer(r, RESOURCE_ENERGY) === OK && y(5, () => e.say(l.transferring));
      else
        switch (e.repair(r)) {
          case ERR_NOT_IN_RANGE: {
            e.moveTo(t[0], { visualizePathStyle: { stroke: '#ffffff' } });
            break;
          }
          case OK: {
            y(10, () => e.say(l.repairing), { time: e.ticksToLive });
            break;
          }
        }
    }
  },
  P = (e, t = {}) =>
    S.create({
      baseId: e,
      body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
      role: 'repairer',
      opts: { memory: { task: 'repairing' } },
      ...t,
    }),
  D = { run: V, create: P },
  B = (e) => {
    if (e.memory.task === 'upgrading' && e.store[RESOURCE_ENERGY] === 0) {
      e.say(l.harvesting), (e.memory.task = 'harvesting');
      return;
    }
    if (e.memory.task === 'harvesting') {
      e.store.getFreeCapacity() === 0 ? ((e.memory.task = 'upgrading'), e.say(l.upgrading)) : h.run(e);
      return;
    }
    if (e.memory.task === 'upgrading') {
      const t = e.room.controller;
      if (!t) return;
      switch (e.upgradeController(t)) {
        case ERR_NOT_IN_RANGE: {
          e.moveTo(t, { visualizePathStyle: { stroke: '#ffffff' } });
          break;
        }
        case OK: {
          y(10, () => e.say(l.upgrading), { time: e.ticksToLive });
          break;
        }
      }
      return;
    }
  },
  z = (e, t = {}) =>
    S.create({
      baseId: e,
      body: [WORK, CARRY, CARRY, MOVE, MOVE],
      role: 'upgrader',
      opts: { memory: { task: 'upgrading' } },
      ...t,
    }),
  L = { run: B, create: z },
  O = { harvester: h, builder: I, upgrader: L, miner: W, minerStore: F, repairer: D };
class H {
  constructor(t) {
    v(this, 'tower');
    this.tower = t;
  }
  run() {
    this.tower.store[RESOURCE_ENERGY] !== 0 &&
      (this.healFriendlyCreeps(), this.attackHostileCreeps(), this.repairStructures());
  }
  attackHostileCreeps() {
    const t = this.tower.room.find(FIND_HOSTILE_CREEPS, {
      filter: (r) => r.body.some((o) => o.type === ATTACK || o.type === RANGED_ATTACK),
    });
    if (t.length > 0) {
      const r = t.sort((o, s) => o.hits - o.hitsMax)[0];
      this.tower.attack(r);
    }
  }
  healFriendlyCreeps() {
    const t = this.tower.room.find(FIND_MY_CREEPS, { filter: (r) => r.hits < r.hitsMax });
    if (t.length > 0) {
      const r = t.sort((o, s) => o.hits - s.hits)[0];
      this.tower.heal(r);
    }
  }
  repairStructures() {
    const t = this.tower.room.find(FIND_STRUCTURES, { filter: (r) => r.hits < 1e4 && r.hits < r.hitsMax });
    if (t.length > 0) {
      const r = t.sort((o, s) => o.hits - s.hits)[0];
      this.tower.repair(r);
    }
  }
}
const j = (e) => {
    e.find(FIND_MY_STRUCTURES, { filter: (r) => r.structureType === STRUCTURE_TOWER }).forEach((r) => {
      new H(r).run();
    });
  },
  q = {
    roleMonitor: {
      harvester: { count: 4, body: [WORK, WORK, CARRY, MOVE] },
      builder: { count: 3, body: [WORK, CARRY, CARRY, MOVE, MOVE] },
      upgrader: { count: 3, body: [WORK, CARRY, CARRY, MOVE, MOVE] },
      miner: { count: 0, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE] },
    },
  },
  X = {
    roleMonitor: {
      harvester: {
        count: 5,
        body: f([
          { body: WORK, count: 2 },
          { body: CARRY, count: 1 },
          { body: MOVE, count: 1 },
        ]),
      },
      builder: {
        count: 8,
        body: f([
          { body: WORK, count: 2 },
          { body: CARRY, count: 1 },
          { body: MOVE, count: 1 },
        ]),
      },
      upgrader: {
        count: 5,
        body: f([
          { body: WORK, count: 2 },
          { body: CARRY, count: 1 },
          { body: MOVE, count: 1 },
        ]),
      },
    },
  },
  J = {
    roleMonitor: {
      harvester: {
        count: 6,
        body: f([
          { body: CARRY, count: 7 },
          { body: MOVE, count: 4 },
        ]),
      },
      builder: {
        count: 2,
        body: f([
          { body: WORK, count: 2 },
          { body: CARRY, count: 4 },
          { body: MOVE, count: 3 },
        ]),
      },
      upgrader: {
        count: 10,
        body: f([
          { body: WORK, count: 3 },
          { body: CARRY, count: 2 },
          { body: MOVE, count: 3 },
        ]),
      },
      repairer: {
        count: 1,
        body: f([
          { body: WORK, count: 2 },
          { body: CARRY, count: 4 },
          { body: MOVE, count: 3 },
        ]),
      },
    },
  },
  Q = [
    X,
    J,
    {
      roleMonitor: {
        harvester: {
          count: 8,
          body: f([
            { body: CARRY, count: 10 },
            { body: MOVE, count: 6 },
          ]),
        },
        builder: {
          count: 2,
          body: f([
            { body: WORK, count: 3 },
            { body: CARRY, count: 5 },
            { body: MOVE, count: 5 },
          ]),
        },
        upgrader: {
          count: 14,
          body: f([
            { body: WORK, count: 3 },
            { body: CARRY, count: 5 },
            { body: MOVE, count: 5 },
          ]),
        },
        miner: {
          count: 0,
          body: f([
            { body: WORK, count: 8 },
            { body: CARRY, count: 1 },
            { body: MOVE, count: 1 },
          ]),
        },
        minerStore: {
          count: 0,
          body: f([
            { body: CARRY, count: 15 },
            { body: MOVE, count: 1 },
          ]),
        },
        repairer: {
          count: 4,
          body: f([
            { body: WORK, count: 3 },
            { body: CARRY, count: 5 },
            { body: MOVE, count: 5 },
          ]),
        },
      },
    },
  ],
  Z = (e) => {
    for (let t = e; t >= 1; t--) {
      const r = Q[t - 1];
      if (r) return r;
    }
    return q;
  },
  ee = () => {
    te();
  },
  te = () => {
    var o, s, a;
    const e = new Map([
      ['miner', 0],
      ['harvester', 0],
      ['minerStore', 0],
      ['builder', 0],
      ['upgrader', 0],
      ['repairer', 0],
    ]);
    for (let n in Game.creeps) {
      const m = Game.creeps[n];
      m.memory.role &&
        (e.set(m.memory.role, ((o = e.get(m.memory.role)) != null ? o : 0) + 1), y(10, () => S.getVisualStatus(m)));
    }
    const t = Z((a = (s = Game.rooms[T.MainRoom].controller) == null ? void 0 : s.level) != null ? a : 0),
      r = e.entries();
    for (let [n, m] of r)
      if (t.roleMonitor[n] && m <= t.roleMonitor[n].count) {
        console.log('generatorRole', n), utils.role[n].create(E.MainBase, { body: t.roleMonitor[n].body });
        break;
      }
  },
  re = () => {
    oe(), se();
  },
  oe = () => {
    for (let e in Memory.creeps)
      Game.creeps[e] || (delete Memory.creeps[e], console.log('Clearing non-existing creep memory:', e));
  },
  se = () => {
    ie(), ae();
  },
  ne = [FIND_DROPPED_RESOURCES, FIND_SOURCES, FIND_TOMBSTONES, FIND_RUINS],
  ie = () => {
    const e = [];
    for (const r of ne) e.push(...Game.spawns[E.MainBase].room.find(r));
    const t = {};
    for (const r of e) {
      t[r.id] = { source: r };
      let o = '';
      r instanceof Source
        ? (o = `${r[RESOURCE_ENERGY]}`)
        : r instanceof Resource
        ? (o = `${r.amount}`)
        : r instanceof Tombstone
        ? (o = `${r.store[RESOURCE_ENERGY]}`)
        : r instanceof Ruin && (o = `${r.store[RESOURCE_ENERGY]}`),
        Game.spawns[E.MainBase].room.visual.text(o, r.pos.x, r.pos.y - 1, {
          font: 0.5,
          color: '#00ff00',
          stroke: '#000000',
          strokeWidth: 0.1,
        });
    }
    Memory.resources = t;
  },
  ae = (e = E.MainBase) => {
    const t = Game.spawns[e];
    t.spawning &&
      t.room.visual.text(`${t.spawning.name}`, t.pos.x, t.pos.y + 1, {
        font: 0.5,
        color: '#00ff00',
        stroke: '#000000',
        strokeWidth: 0.1,
      });
  },
  Re = () => {
    ue(), me(), le();
  },
  ue = () => {
    const e = [
      { name: 'Harvester-1', role: 'harvester' },
      { name: 'Upgrader-1', role: 'upgrader' },
      { name: 'Builder-1', role: 'builder' },
    ];
    for (const t of e)
      Game.creeps[t.name] ||
        (console.log('minCreepGroup', t.name),
        Game.spawns[E.MainBase].spawnCreep(
          f([
            { body: WORK, count: 2 },
            { body: CARRY, count: 1 },
            { body: MOVE, count: 1 },
          ]),
          t.name,
          { memory: { role: t.role, task: 'harvesting' } },
        ));
  },
  me = () => {
    const e = [
      { name: 'Miner-2', pos: { x: 9, y: 44 }, targetSourceId: '5bbcaffd9099fc012e63b77c' },
      { name: 'Miner-4', pos: { x: 4, y: 40 }, targetSourceId: '5bbcaffd9099fc012e63b77b' },
    ];
    for (const t of e) {
      const r = Game.creeps[t.name];
      r
        ? r.moveTo(t.pos.x, t.pos.y)
        : Game.spawns[E.MainBase].spawnCreep(
            f([
              { body: WORK, count: 6 },
              { body: CARRY, count: 2 },
              { body: MOVE, count: 2 },
            ]),
            t.name,
            { memory: { role: 'miner', task: 'harvesting', targetSourceId: t.targetSourceId } },
          );
    }
  },
  le = () => {
    const e = [
      { name: 'MinerStore-2', pos: { x: 5, y: 39 } },
      { name: 'MinerStore-3', pos: { x: 10, y: 43 } },
    ];
    for (const t of e) {
      const r = Game.creeps[t.name];
      r
        ? r.moveTo(t.pos.x, t.pos.y)
        : Game.spawns[E.MainBase].spawnCreep(
            f([
              { body: CARRY, count: 15 },
              { body: MOVE, count: 1 },
            ]),
            t.name,
            { memory: { role: 'minerStore' } },
          );
    }
  },
  ye = () => {
    Re(), re(), y(10, ee);
  },
  ce = () => {
    var t, r;
    const e = Game.rooms[T.MainRoom];
    if ((t = e.controller) != null && t.my) {
      ye();
      for (let o in Game.creeps) {
        let s = Game.creeps[o];
        if (s.memory.role == 'harvester') {
          const a =
            Object.values(Game.creeps)
              .filter((n) => n.memory.role === 'harvester')
              .findIndex((n, m) => n.name === s.name && m < 1) !== -1;
          O.harvester.run(s, { priority: a ? 'high' : 'low' });
        }
        if (s.memory.role == 'builder') {
          const a =
            Object.values(Game.creeps)
              .filter((n) => n.memory.role === 'builder')
              .findIndex((n, m) => n.name === s.name && m < 3) !== -1;
          O.builder.run(s, { priority: a ? 'high' : 'low' });
        }
        s.memory.role && ((r = O[s.memory.role]) == null || r.run(s));
      }
      j(e);
    }
  };
module.exports = { loop: ce };
global.utils = { role: O };
