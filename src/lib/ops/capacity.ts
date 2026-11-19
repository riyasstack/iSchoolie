/**
 * Firestore capacity model for the Spark (no-cost) plan.
 *
 * These are estimates, not billing statements. They exist so the "Spark is not
 * viable beyond X daily active users" claim is a calculation you can re-run,
 * not a slogan. Every number below is a documented assumption; change the
 * constants when the product changes.
 *
 * Verified against https://firebase.google.com/pricing (Firestore Standard,
 * Spark plan) in November 2026:
 *   50,000 document reads/day · 20,000 writes/day · 20,000 deletes/day
 *   1 GiB stored · 10 GiB/month network egress
 * Firebase Authentication: 50,000 MAU free; Cloud Functions and Cloud Storage
 * are Blaze-only.
 */

export const SPARK_LIMITS = {
  readsPerDay: 50_000,
  writesPerDay: 20_000,
  deletesPerDay: 20_000,
  storageBytes: 1024 * 1024 * 1024,
  egressGiBPerMonth: 10,
} as const;

export interface CapacityAssumptions {
  /** Authentication sessions per active user per day (fresh tab, refresh). */
  sessionsPerUser: number;
  /** Reads per session restore: user doc, role doc, membership query, docs. */
  readsPerSession: number;
  /** Reads for an average browsing session (dashboards, classes, feeds). */
  readsPerSessionBrowsing: number;
  /** Reads consumed by get()/exists() inside Security Rules per session. */
  ruleReadsPerSession: number;
  /** Writes per active user per day (posts, submissions, preferences). */
  writesPerUser: number;
  /** Writes for a brand-new registration (profile, private profile, roles, requests). */
  writesPerRegistration: number;
}

export const DEFAULT_ASSUMPTIONS: CapacityAssumptions = {
  sessionsPerUser: 1.6,
  readsPerSession: 4, // users/{uid} + userRoles/{uid} + membership query + 1 institution
  readsPerSessionBrowsing: 12,
  ruleReadsPerSession: 4,
  writesPerUser: 4,
  writesPerRegistration: 8,
};

export interface CapacityRow {
  dau: number;
  reads: number;
  writes: number;
  readPercent: number;
  writePercent: number;
  readVerdict: 'comfortable' | 'tight' | 'over';
  writeVerdict: 'comfortable' | 'tight' | 'over';
}

function verdict(used: number, limit: number): CapacityRow['readVerdict'] {
  const ratio = used / limit;
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'tight';
  return 'comfortable';
}

export function readsPerUser(assumptions: CapacityAssumptions = DEFAULT_ASSUMPTIONS): number {
  return (
    assumptions.sessionsPerUser *
    (assumptions.readsPerSession +
      assumptions.readsPerSessionBrowsing +
      assumptions.ruleReadsPerSession)
  );
}

/** Reads per day at a given DAU, including registrations. */
export function estimateDailyReads(dau: number, newRegistrations = 0): number {
  return Math.round(dau * readsPerUser() + newRegistrations * 6);
}

export function estimateDailyWrites(dau: number, newRegistrations = 0): number {
  return Math.round(
    dau * DEFAULT_ASSUMPTIONS.writesPerUser +
      newRegistrations * DEFAULT_ASSUMPTIONS.writesPerRegistration,
  );
}

export function capacityTable(
  levels: number[] = [100, 500, 1000, 2000, 10_000],
  registrationRate = 0.02,
): CapacityRow[] {
  return levels.map((dau) => {
    const registrations = Math.round(dau * registrationRate);
    const reads = estimateDailyReads(dau, registrations);
    const writes = estimateDailyWrites(dau, registrations);
    return {
      dau,
      reads,
      writes,
      readPercent: Math.round((reads / SPARK_LIMITS.readsPerDay) * 1000) / 10,
      writePercent: Math.round((writes / SPARK_LIMITS.writesPerDay) * 1000) / 10,
      readVerdict: verdict(reads, SPARK_LIMITS.readsPerDay),
      writeVerdict: verdict(writes, SPARK_LIMITS.writesPerDay),
    };
  });
}

/**
 * Largest DAU that stays inside the daily read quota with the given
 * assumptions. This is the number to quote when asked "how many users can
 * Spark take?".
 */
export function maxSustainableDau(): number {
  return Math.floor(SPARK_LIMITS.readsPerDay / readsPerUser());
}

/**
 * Examination bursts. Each submission costs one transaction read plus one
 * write, plus the assignment read inside Security Rules.
 */
export function submissionBurstCost(students: number): { reads: number; writes: number } {
  return {
    reads: students * 2,
    writes: students * 2,
  };
}

export function burstTable(): { students: number; reads: number; writes: number }[] {
  return [100, 500, 2000, 10_000].map((students) => ({
    students,
    ...submissionBurstCost(students),
  }));
}
