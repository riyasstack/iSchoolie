# Spark capacity and quota model

All numbers come from `src/lib/ops/capacity.ts`, which is unit-tested in
`tests/unit/capacity.test.ts`. Change the assumptions there and re-run the tests rather than quoting
these tables from memory.

## 1. Verified free-tier limits (Firestore Standard, Spark, Nov 2026)

| Resource | Free daily/monthly allowance | Notes |
| --- | --- | --- |
| Document reads | 50,000 / day | Rules `get()`/`exists()` count |
| Document writes | 20,000 / day | Each document in a batch counts separately |
| Document deletes | 20,000 / day | |
| Stored data | 1 GiB | |
| Network egress | 10 GiB / month | |
| Authentication | 50,000 MAU | Email/password + federated |
| Cloud Functions | — | Blaze only |
| Cloud Storage | — | Blaze only (5 GB free on Blaze, not Spark) |

## 2. Assumptions per active user

| Assumption | Value | Why |
| --- | --- | --- |
| Sessions per user per day | 1.6 | fresh tab + mobile return |
| Reads per session restore | 4 | `users/{uid}`, `userRoles/{uid}`, membership query, 1 institution |
| Reads while browsing | 12 | dashboard, class list, one class, assignments |
| Reads from Security Rules | 4 | membership + institution status lookups |
| Writes per user per day | 4 | post, submission, preference, read marker |
| Writes per registration | 8 | profile, private profile, roles, onboarding docs |
| New registrations per DAU | 2% | early-growth assumption |

Derived: **32 reads per active user per day**.

## 3. Daily consumption

| DAU | Reads | % of 50k | Writes | % of 20k | Verdict |
| --- | --- | --- | --- | --- | --- |
| 100 | 3,212 | 6.4% | 416 | 2.1% | comfortable |
| 500 | 16,060 | 32.1% | 2,080 | 10.4% | comfortable |
| 1,000 | 32,120 | 64.2% | 4,160 | 20.8% | comfortable |
| 2,000 | 64,240 | 128.5% | 8,320 | 41.6% | **reads over quota** |
| 10,000 | 321,200 | 642.4% | 41,600 | 208.0% | **reads and writes over quota** |

**Sustainable ceiling: `maxSustainableDau()` = 1,562 DAU** on reads alone. Writes do not become the
binding constraint until roughly 4,800 DAU, which reads already rule out.

Reads, not writes, are the bottleneck — the standard shape for a read-heavy social/academic app.

## 4. Examination bursts

Each submission costs one transaction read + one write, plus the assignment read performed inside
Security Rules: 2 reads and 2 writes per student.

| Students submitting in one window | Reads | Writes | Share of daily write quota |
| --- | --- | --- | --- |
| 100 | 200 | 200 | 1% |
| 500 | 1,000 | 1,000 | 5% |
| 2,000 | 4,000 | 4,000 | 20% |
| 10,000 | 20,000 | 20,000 | **100% — quota exhausted** |

**Conclusion:** a single school-scale exam (≤ 2,000 concurrent submissions) is safe as long as the
day's other activity stays moderate. A 10,000-student simultaneous exam on Spark will exhaust the
daily write quota and is **not** viable. Staggered submission windows (per class, per period) are the
Spark-compatible mitigation; guaranteed burst capacity requires Blaze.

## 5. Where the reads actually go

1. **Session restore** (4 reads) — unavoidable, cached by the SDK between navigations.
2. **Rules lookups** (4 reads/session) — the price of live suspension and membership checks. This is
   deliberately *not* optimised away: a stale cache must never grant access.
3. **Browsing** (12 reads) — bounded by pagination (20 items/page) and by loading a dashboard summary
   document instead of counting collections.

## 6. Optimisations that are implemented

- One `users/{uid}` read per session, reused by the auth provider; no per-component profile reads.
- Denormalised `institutionName` on membership documents to avoid a second institution read.
- `users/{uid}/summaries` as a non-authoritative dashboard cache written by the CLI.
- Page-limited queries everywhere (`limit(20)`), no unbounded collection reads, no realtime listeners
  on feeds or rosters.
- Batched writes are used for atomicity (profile + roles), **not** to reduce billed writes — each
  document still counts.
- No write on navigation; no presence/heartbeat writes.

## 7. When to leave Spark

Move to Blaze when any of these is true:

- DAU approaches ~1,200 (80% of the modelled ceiling).
- Two institutions each run exams on the same day.
- You need file uploads (institution evidence, assignment attachments).
- You need automated approval queues, scheduled notification fan-out or email triggers.
- You need server-side rendering or API routes with secrets.

On Blaze the same code runs unchanged; the CLI-based approval workflow can then be replaced by
Functions without altering the data model.
