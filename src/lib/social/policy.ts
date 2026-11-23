/**
 * Pure social policy.
 *
 * Everything here is deterministic and side-effect free so the rules that
 * protect students can be unit-tested without a database. Server modules call
 * these helpers before every read and write; the UI calls the same result
 * shape to render the correct follow state.
 */
import type { EducationStageValue } from '@/lib/social/catalog';

export type AccountStatus = 'active' | 'suspended' | 'pending_deletion';

export interface PolicyActor {
  id: string;
  isMinor: boolean;
  privateProfile: boolean;
  status: AccountStatus;
  teacherVerified: boolean;
}

export type FollowMode = 'follow' | 'request' | 'blocked' | 'unavailable';

export function resolveFollowMode({
  viewer,
  target,
  blocked,
  existingStatus,
}: {
  viewer: PolicyActor;
  target: PolicyActor;
  blocked: boolean;
  existingStatus?: 'active' | 'pending' | null;
}): FollowMode {
  if (viewer.id === target.id) return 'unavailable';
  if (target.status !== 'active') return 'unavailable';
  if (blocked) return 'blocked';
  if (existingStatus === 'active' || existingStatus === 'pending') return 'unavailable';

  // Safeguarding: an adult may never create a social edge to a student account.
  if (target.isMinor && !viewer.isMinor) return 'blocked';

  // A student may connect with an educator only when the educator has actually
  // been verified by the platform. Self-declared teaching does not qualify.
  if (viewer.isMinor && !target.isMinor && !target.teacherVerified) return 'blocked';

  if (target.privateProfile) return 'request';
  return 'follow';
}

export function canViewProfile({
  viewer,
  target,
  isFollowing,
  blocked,
  isAdmin = false,
}: {
  viewer: PolicyActor;
  target: PolicyActor;
  isFollowing: boolean;
  blocked: boolean;
  isAdmin?: boolean;
}): boolean {
  if (viewer.id === target.id || isAdmin) return true;
  if (target.status !== 'active') return false;
  if (blocked) return false;
  // Student profiles are never exposed to adult accounts.
  if (target.isMinor && !viewer.isMinor) return false;
  if (target.privateProfile && !isFollowing) return false;
  return true;
}

export function canViewPost({
  viewer,
  author,
  audience,
  isFollowing,
}: {
  viewer: PolicyActor;
  author: PolicyActor;
  audience: 'public' | 'followers' | 'private';
  isFollowing: boolean;
}): boolean {
  if (viewer.id === author.id) return true;
  if (author.status !== 'active') return false;
  if (author.isMinor && !viewer.isMinor) return false;
  // Student posts are follower-only regardless of the selected audience.
  if (author.isMinor) return isFollowing;
  if (audience === 'private') return false;
  if (audience === 'followers') return isFollowing;
  return true;
}

export function canSeeNetwork({
  viewer,
  target,
  isFollowing,
  blocked,
  isAdmin = false,
}: {
  viewer: PolicyActor;
  target: PolicyActor;
  isFollowing: boolean;
  blocked: boolean;
  isAdmin?: boolean;
}): boolean {
  if (viewer.id === target.id || isAdmin) return true;
  if (blocked) return false;
  if (target.isMinor && !viewer.isMinor) return false;
  return isFollowing || !target.privateProfile;
}

/* -------------------------------------------------------------------------- */
/* Discovery                                                                  */
/* -------------------------------------------------------------------------- */

export function isRecommendationEligible({
  viewer,
  target,
  blocked,
  dismissed,
  followingStatus,
  discoverable,
  recommendable,
}: {
  viewer: PolicyActor;
  target: PolicyActor;
  blocked: boolean;
  dismissed: boolean;
  followingStatus: 'active' | 'pending' | null;
  discoverable: boolean;
  recommendable: boolean;
}): boolean {
  if (target.id === viewer.id) return false;
  if (target.status !== 'active') return false;
  if (blocked || dismissed) return false;
  if (followingStatus !== null) return false;
  if (!discoverable || !recommendable) return false;
  // Private accounts are not broadcast as recommendations; they remain
  // findable through search when their owner allows discovery.
  if (target.privateProfile) return false;
  // Student accounts are never placed in an adult's recommendation surface.
  if (target.isMinor && !viewer.isMinor) return false;
  // Adult accounts may only be suggested to a student when verified as educators.
  if (viewer.isMinor && !target.isMinor && !target.teacherVerified) return false;
  return true;
}

export interface RecommendationSignals {
  sharedInterestCount: number;
  sharedTopicCount: number;
  mutualCount: number;
  recentPostCount: number;
  teacherVerified: boolean;
  sameStage: boolean;
}

export type RecommendationReasonCode =
  | 'shared_interest'
  | 'shared_topic'
  | 'mutual'
  | 'recent_posts'
  | 'verified_educator'
  | 'same_stage'
  | 'new_member';

export interface ScoredRecommendation {
  score: number;
  reasons: RecommendationReasonCode[];
}

/**
 * Deterministic, explainable ranking. Every point maps to a signal that the
 * reason list can honestly describe; no random or invented factor is used.
 */
export function scoreRecommendation(signals: RecommendationSignals): ScoredRecommendation {
  const reasons: RecommendationReasonCode[] = [];
  let score = 0;

  if (signals.sharedInterestCount > 0) {
    score += Math.min(signals.sharedInterestCount, 5) * 6;
    reasons.push('shared_interest');
  }
  if (signals.sharedTopicCount > 0) {
    score += Math.min(signals.sharedTopicCount, 5) * 4;
    reasons.push('shared_topic');
  }
  if (signals.mutualCount > 0) {
    score += Math.min(signals.mutualCount, 5) * 3;
    reasons.push('mutual');
  }
  if (signals.recentPostCount > 0) {
    score += Math.min(signals.recentPostCount, 5);
    reasons.push('recent_posts');
  }
  if (signals.teacherVerified) {
    score += 2;
    reasons.push('verified_educator');
  }
  if (signals.sameStage) {
    score += 1;
    reasons.push('same_stage');
  }
  if (reasons.length === 0) reasons.push('new_member');

  return { score, reasons };
}

export function recommendationReasonLabel(
  code: RecommendationReasonCode,
  context: { interest?: string; topic?: string; mutualCount?: number; stage?: string } = {},
): string {
  switch (code) {
    case 'shared_interest':
      return context.interest
        ? `Shares your interest in ${context.interest}`
        : 'Shares one of your learning interests';
    case 'shared_topic':
      return context.topic
        ? `Active in ${context.topic}, a topic you follow`
        : 'Active in a topic you follow';
    case 'mutual':
      return context.mutualCount && context.mutualCount > 0
        ? `Followed by ${context.mutualCount} ${context.mutualCount === 1 ? 'person' : 'people'} you follow`
        : 'Has mutual connections';
    case 'recent_posts':
      return 'Posts about education topics recently';
    case 'verified_educator':
      return 'Verified educator';
    case 'same_stage':
      return context.stage ? `Also ${context.stage.toLowerCase()}` : 'At a similar education stage';
    case 'new_member':
      return 'Recently joined the education community';
    default:
      return 'Relevant to your learning interests';
  }
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

export function parseHashtags(body: string): string[] {
  const found = new Set<string>();
  const pattern = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_]{0,48})/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    found.add(match[1].toLowerCase());
    if (found.size >= 10) break;
  }
  return [...found];
}

export function parseMentions(body: string): string[] {
  const found = new Set<string>();
  const pattern = /(?:^|\s)@([a-zA-Z0-9][a-zA-Z0-9-]{1,29})/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    found.add(match[1].toLowerCase());
    if (found.size >= 10) break;
  }
  return [...found];
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSameOriginPath(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

export function normaliseHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30);
}

/** Validate the values a client may send for a stage. */
export function isEducationStage(value: unknown): value is EducationStageValue {
  return (
    value === 'school_student' ||
    value === 'college_student' ||
    value === 'teacher' ||
    value === 'education_professional' ||
    value === 'parent' ||
    value === 'lifelong_learner'
  );
}
