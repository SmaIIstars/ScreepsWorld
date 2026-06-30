/**
 * tagSystem.ts
 *
 * Pure functions for computing worker metadata (tags + capacities)
 * and matching workers to events.
 */

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

const CAPACITY_MAP: Partial<Record<BodyPartConstant, Record<string, number>>> = {
  [WORK]:  { harvest: 1, work: 1 },
  [CARRY]: { carry: 50 },
  [MOVE]:  { move: 1 },
  [ATTACK]: { attack: 30 },
  [RANGED_ATTACK]: { ranged: 10 },
  [HEAL]:  { heal: 12 },
  [TOUGH]: { tough: 1 },
  [CLAIM]: { claim: 1 },
};

const TAG_MAP: Partial<Record<BodyPartConstant, string[]>> = {
  [WORK]:          ['harvest', 'work'],
  [CARRY]:         ['transport'],
  [MOVE]:          ['move'],
  [ATTACK]:        ['attack'],
  [RANGED_ATTACK]: ['ranged_attack'],
  [HEAL]:          ['heal'],
  [CLAIM]:         ['claim', 'reserve'],
  [TOUGH]:         ['meat_shield'],
};

// ---------------------------------------------------------------------------
// computeCapacities
// ---------------------------------------------------------------------------

/**
 * Compute capacity map from an array of body parts.
 *
 * WORK  harvest: count(WORK), work: count(WORK)
 * CARRY carry: count(CARRY) * 50
 * MOVE  move: count(MOVE)
 * ATTACK attack: count(ATTACK) * 30
 * RANGED_ATTACK ranged: count(RANGED_ATTACK) * 10
 * HEAL  heal: count(HEAL) * 12
 * TOUGH tough: count(TOUGH)
 * CLAIM claim: count(CLAIM)
 */
export function computeCapacities(body: BodyPartDefinition[]): Record<string, number> {
  const capacities: Record<string, number> = {};

  for (const part of body) {
    const contribs = CAPACITY_MAP[part.type];
    if (!contribs) continue;

    for (const [cap, value] of Object.entries(contribs)) {
      capacities[cap] = (capacities[cap] ?? 0) + value;
    }
  }

  return capacities;
}

// ---------------------------------------------------------------------------
// computeTags
// ---------------------------------------------------------------------------

/**
 * Compute unique tags from an array of body parts.
 *
 * WORK  "harvest", "work"
 * CARRY "transport"
 * MOVE  "move"
 * ATTACK "attack"
 * RANGED_ATTACK "ranged_attack"
 * HEAL  "heal"
 * CLAIM "claim", "reserve"
 * TOUGH "meat_shield"
 */
export function computeTags(body: BodyPartDefinition[]): string[] {
  const tagSet = new Set<string>();

  for (const part of body) {
    const tags = TAG_MAP[part.type];
    if (!tags) continue;

    for (const tag of tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet);
}

// ---------------------------------------------------------------------------
// canWorkerTakeEvent
// ---------------------------------------------------------------------------

/**
 * Determine whether a worker can handle an event.
 *
 * Two-step matching:
 * 1. Binary tag filter: if event.requiredTags is non-empty, either:
 *    - All required tags present in worker.tags (allowFallback=false, perfect match)
 *    - At least one required tag present (allowFallback=true)
 * 2. Numeric capacity filter: for each (cap, min) in event.requiredCapacities,
 *    worker.capacities[cap] >= min
 *
 * Returns { match, perfectMatch }
 *   perfectMatch: tags fully covered AND capacities satisfied
 *   match: perfect match, OR fallback (allowFallback) with partial tags + capacities
 */
export function canWorkerTakeEvent(
  worker: { tags: string[]; capacities: Record<string, number> },
  event: Event,
): { match: boolean; perfectMatch: boolean } {
  const { requiredTags, requiredCapacities, allowFallback } = event;

  // --- Step 1: Binary tag matching ---

  let tagMatch: boolean;

  if (requiredTags.length === 0) {
    tagMatch = true;
  } else {
    const allInWorker = requiredTags.every((tag) => worker.tags.includes(tag));
    const anyInWorker = requiredTags.some((tag) => worker.tags.includes(tag));

    tagMatch = allowFallback ? anyInWorker : allInWorker;
  }

  // --- Step 2: Numeric capacity matching ---

  let capMatch = true;
  for (const [cap, min] of Object.entries(requiredCapacities)) {
    if ((worker.capacities[cap] ?? 0) < min) {
      capMatch = false;
      break;
    }
  }

  // --- Result ---

  const tagsFullyCovered =
    requiredTags.length === 0 || requiredTags.every((t) => worker.tags.includes(t));
  const perfectMatch = tagsFullyCovered && capMatch;
  const match = perfectMatch || (allowFallback && tagMatch && capMatch);

  return { match, perfectMatch };
}

// ---------------------------------------------------------------------------
// createWorkerMetaFromCreep
// ---------------------------------------------------------------------------

export function createWorkerMetaFromCreep(creep: Creep, rolePref: string): WorkerMeta {
  return {
    id: creep.name,
    type: 'creep',
    room: creep.room?.name ?? '',
    tags: computeTags(creep.body),
    capacities: computeCapacities(creep.body),
    currentEventId: null,
    rolePref,
    createdAt: Game.time,
    spawnBody: creep.body,
  };
}
