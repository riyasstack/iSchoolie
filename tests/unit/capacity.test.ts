import { describe, expect, it } from 'vitest';
import {
  burstTable,
  capacityTable,
  estimateDailyReads,
  estimateDailyWrites,
  maxSustainableDau,
  readsPerUser,
  SPARK_LIMITS,
  submissionBurstCost,
} from '@/lib/ops/capacity';

describe('Spark plan capacity model', () => {
  it('uses the published Spark quotas', () => {
    expect(SPARK_LIMITS.readsPerDay).toBe(50_000);
    expect(SPARK_LIMITS.writesPerDay).toBe(20_000);
    expect(SPARK_LIMITS.deletesPerDay).toBe(20_000);
  });

  it('keeps 100 DAU comfortably inside the read quota', () => {
    const [row] = capacityTable([100]);
    expect(row).toBeDefined();
    expect(row!.readVerdict).toBe('comfortable');
    expect(row!.reads).toBeLessThan(SPARK_LIMITS.readsPerDay / 2);
  });

  it('shows 1,000 DAU as still inside budget and 2,000 DAU as over budget', () => {
    const rows = capacityTable([1000, 2000]);
    const thousand = rows.find((row) => row.dau === 1000)!;
    const twoThousand = rows.find((row) => row.dau === 2000)!;
    expect(thousand.readVerdict).not.toBe('over');
    expect(twoThousand.readVerdict).toBe('over');
  });

  it('is clearly not viable for 10,000 DAU', () => {
    const row = capacityTable([10_000])[0]!;
    expect(row.reads).toBeGreaterThan(SPARK_LIMITS.readsPerDay * 3);
    expect(row.readPercent).toBeGreaterThan(300);
  });

  it('reports a sustainable DAU ceiling of roughly 1.5–2k with default assumptions', () => {
    const ceiling = maxSustainableDau();
    expect(ceiling).toBeGreaterThan(1000);
    expect(ceiling).toBeLessThan(2500);
    expect(estimateDailyReads(ceiling + 1)).toBeGreaterThan(SPARK_LIMITS.readsPerDay);
  });

  it('keeps writes within budget until read limits are already exceeded', () => {
    const row = capacityTable([1000])[0]!;
    expect(row.writes).toBeLessThan(SPARK_LIMITS.writesPerDay);
    expect(row.writeVerdict).toBe('comfortable');
  });

  it('charges transaction reads and writes per submission', () => {
    expect(submissionBurstCost(100)).toEqual({ reads: 200, writes: 200 });
    const tenThousand = burstTable().find((row) => row.students === 10_000)!;
    expect(tenThousand.writes).toBeGreaterThan(SPARK_LIMITS.writesPerDay / 2);
  });

  it('counts a minimum of one read per active user', () => {
    expect(readsPerUser()).toBeGreaterThan(10);
    expect(estimateDailyWrites(0)).toBe(0);
  });
});
