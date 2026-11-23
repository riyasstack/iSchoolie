import { describe, expect, it } from 'vitest';
import {
  canSeeNetwork,
  canViewPost,
  canViewProfile,
  isRecommendationEligible,
  parseHashtags,
  parseMentions,
  recommendationReasonLabel,
  resolveFollowMode,
  scoreRecommendation,
  type PolicyActor,
} from '@/lib/social/policy';

const adult = (overrides: Partial<PolicyActor> = {}): PolicyActor => ({
  id: 'adult-1',
  isMinor: false,
  privateProfile: false,
  status: 'active',
  teacherVerified: false,
  ...overrides,
});

const student = (overrides: Partial<PolicyActor> = {}): PolicyActor => ({
  id: 'student-1',
  isMinor: true,
  privateProfile: true,
  status: 'active',
  teacherVerified: false,
  ...overrides,
});

const verifiedTeacher = (overrides: Partial<PolicyActor> = {}): PolicyActor =>
  adult({ id: 'teacher-1', teacherVerified: true, ...overrides });

describe('resolveFollowMode', () => {
  it('never lets an adult follow a student account', () => {
    expect(resolveFollowMode({ viewer: adult(), target: student(), blocked: false })).toBe('blocked');
  });

  it('lets a student follow a verified educator', () => {
    expect(
      resolveFollowMode({ viewer: student(), target: verifiedTeacher(), blocked: false }),
    ).toBe('follow');
  });

  it('blocks a student from following an unverified adult', () => {
    expect(resolveFollowMode({ viewer: student(), target: adult(), blocked: false })).toBe(
      'blocked',
    );
  });

  it('creates a request for a private account instead of an immediate follow', () => {
    expect(
      resolveFollowMode({
        viewer: adult(),
        target: adult({ id: 'target-1', privateProfile: true }),
        blocked: false,
      }),
    ).toBe('request');
  });

  it('treats blocks and existing edges as unavailable', () => {
    expect(
      resolveFollowMode({ viewer: adult(), target: adult({ id: 'target-1' }), blocked: true }),
    ).toBe('blocked');
    expect(
      resolveFollowMode({
        viewer: adult(),
        target: adult({ id: 'target-1' }),
        blocked: false,
        existingStatus: 'active',
      }),
    ).toBe('unavailable');
    expect(
      resolveFollowMode({
        viewer: adult(),
        target: adult({ id: 'target-1' }),
        blocked: false,
        existingStatus: 'pending',
      }),
    ).toBe('unavailable');
  });

  it('does not allow following a suspended account or self', () => {
    expect(
      resolveFollowMode({ viewer: adult(), target: adult({ status: 'suspended' }), blocked: false }),
    ).toBe('unavailable');
    expect(resolveFollowMode({ viewer: adult(), target: adult(), blocked: false })).toBe('unavailable');
  });
});

describe('canViewProfile', () => {
  it('hides student profiles from adults, including administrators of the social graph', () => {
    expect(canViewProfile({ viewer: adult(), target: student(), isFollowing: true, blocked: false })).toBe(
      false,
    );
  });

  it('shows private profiles only to approved followers or the owner', () => {
    const target = adult({ id: 'target-1', privateProfile: true });
    expect(canViewProfile({ viewer: adult(), target, isFollowing: false, blocked: false })).toBe(false);
    expect(canViewProfile({ viewer: adult(), target, isFollowing: true, blocked: false })).toBe(true);
  });

  it('always hides blocked accounts', () => {
    expect(
      canViewProfile({
        viewer: adult(),
        target: adult({ id: 'target-1' }),
        isFollowing: true,
        blocked: true,
      }),
    ).toBe(false);
  });
});

describe('canViewPost', () => {
  it('makes student posts follower-only regardless of selected audience', () => {
    expect(
      canViewPost({
        viewer: adult(),
        author: student(),
        audience: 'public',
        isFollowing: false,
      }),
    ).toBe(false);
    expect(
      canViewPost({
        viewer: student({ id: 'student-2', privateProfile: false }),
        author: student(),
        audience: 'public',
        isFollowing: true,
      }),
    ).toBe(true);
  });

  it('respects private and followers audiences for adults', () => {
    expect(
      canViewPost({
        viewer: adult(),
        author: adult({ id: 'author-1' }),
        audience: 'private',
        isFollowing: true,
      }),
    ).toBe(false);
    expect(
      canViewPost({
        viewer: adult(),
        author: adult({ id: 'author-1' }),
        audience: 'followers',
        isFollowing: false,
      }),
    ).toBe(false);
    expect(
      canViewPost({
        viewer: adult(),
        author: adult({ id: 'author-1' }),
        audience: 'public',
        isFollowing: false,
      }),
    ).toBe(true);
  });
});

describe('canSeeNetwork', () => {
  it('requires a follow edge for private networks', () => {
    expect(
      canSeeNetwork({
        viewer: adult(),
        target: adult({ id: 'target-1', privateProfile: true }),
        isFollowing: false,
        blocked: false,
      }),
    ).toBe(false);
    expect(
      canSeeNetwork({
        viewer: adult(),
        target: adult({ id: 'target-1', privateProfile: true }),
        isFollowing: true,
        blocked: false,
      }),
    ).toBe(true);
  });
});

describe('isRecommendationEligible', () => {
  const base = {
    blocked: false,
    dismissed: false,
    followingStatus: null as 'active' | 'pending' | null,
    discoverable: true,
    recommendable: true,
  };

  it('excludes self, blocked, dismissed, already-followed and disabled accounts', () => {
    const target = adult({ id: 'target-1' });
    expect(isRecommendationEligible({ ...base, viewer: adult(), target: adult({ id: 'adult-1' }) })).toBe(
      false,
    );
    expect(isRecommendationEligible({ ...base, viewer: adult(), target, blocked: true })).toBe(false);
    expect(isRecommendationEligible({ ...base, viewer: adult(), target, dismissed: true })).toBe(false);
    expect(
      isRecommendationEligible({ ...base, viewer: adult(), target, followingStatus: 'pending' }),
    ).toBe(false);
    expect(
      isRecommendationEligible({ ...base, viewer: adult(), target, discoverable: false }),
    ).toBe(false);
    expect(
      isRecommendationEligible({ ...base, viewer: adult(), target, recommendable: false }),
    ).toBe(false);
  });

  it('never recommends students to adults or private accounts at all', () => {
    expect(isRecommendationEligible({ ...base, viewer: adult(), target: student() })).toBe(false);
    expect(
      isRecommendationEligible({
        ...base,
        viewer: adult(),
        target: adult({ privateProfile: true }),
      }),
    ).toBe(false);
  });

  it('only suggests verified educators to students', () => {
    expect(isRecommendationEligible({ ...base, viewer: student(), target: adult() })).toBe(false);
    expect(
      isRecommendationEligible({ ...base, viewer: student(), target: verifiedTeacher() }),
    ).toBe(true);
    expect(
      isRecommendationEligible({
        ...base,
        viewer: student(),
        target: student({ id: 'student-2', privateProfile: false }),
      }),
    ).toBe(true);
  });
});

describe('scoreRecommendation', () => {
  it('is deterministic and orders shared interests above weaker signals', () => {
    const strong = scoreRecommendation({
      sharedInterestCount: 2,
      sharedTopicCount: 0,
      mutualCount: 0,
      recentPostCount: 0,
      teacherVerified: false,
      sameStage: false,
    });
    const weak = scoreRecommendation({
      sharedInterestCount: 0,
      sharedTopicCount: 0,
      mutualCount: 1,
      recentPostCount: 0,
      teacherVerified: false,
      sameStage: false,
    });
    expect(strong.score).toBe(12);
    expect(strong.reasons).toEqual(['shared_interest']);
    expect(weak.score).toBe(3);
    expect(weak.reasons).toEqual(['mutual']);
    expect(
      scoreRecommendation({
        sharedInterestCount: 2,
        sharedTopicCount: 0,
        mutualCount: 0,
        recentPostCount: 0,
        teacherVerified: false,
        sameStage: false,
      }),
    ).toEqual(strong);
  });

  it('never invents a signal when nothing is known', () => {
    const result = scoreRecommendation({
      sharedInterestCount: 0,
      sharedTopicCount: 0,
      mutualCount: 0,
      recentPostCount: 0,
      teacherVerified: false,
      sameStage: false,
    });
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual(['new_member']);
    expect(recommendationReasonLabel('new_member')).toContain('Recently joined');
  });
});

describe('hashtags and mentions', () => {
  it('parses, lowercases and de-duplicates hashtags', () => {
    expect(parseHashtags('Studying #Physics and #physics with #AI')).toEqual(['physics', 'ai']);
  });

  it('ignores URL fragments and bare hashes', () => {
    expect(parseHashtags('https://example.com/#section # notatag')).toEqual([]);
  });

  it('parses mentions and enforces the limit', () => {
    expect(parseMentions('Thanks @Riya and @riya-stack')).toEqual(['riya', 'riya-stack']);
    const many = Array.from({ length: 15 }, (_, index) => `@user${index}`).join(' ');
    expect(parseMentions(many)).toHaveLength(10);
  });
});
