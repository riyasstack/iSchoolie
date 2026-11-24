/**
 * Serialisable social DTOs.
 *
 * These shapes are produced only by server modules after authorisation, and
 * consumed by both server components and client components. Private identity
 * fields (email, date of birth, grade, institution records) are deliberately
 * absent from every type here.
 */
import type { EducationStageValue } from '@/lib/social/catalog';

export type FollowState =
  | 'self'
  | 'following'
  | 'pending'
  | 'requested_by'
  | 'not_following'
  | 'blocked'
  | 'unavailable';

export type EducationRoleLabel =
  | 'Student'
  | 'Educator'
  | 'Education professional'
  | 'Parent or guardian'
  | 'Learner';

export interface PersonSummary {
  id: string;
  handle: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string;
  educationStage: EducationStageValue | null;
  stageLabel: string | null;
  roleLabel: EducationRoleLabel;
  teacherVerified: boolean;
  isMinor: boolean;
  isPrivate: boolean;
  region: string | null;
  website: string | null;
  interests: string[];
  skills: string[];
  professionalFocus: string[];
  followerCount: number;
  followingCount: number;
  postCount: number;
  followState: FollowState;
  canFollow: boolean;
  mutualCount: number;
  mutualNames: string[];
  reason: string | null;
}

export interface PersonProfile extends PersonSummary {
  coverUrl: string | null;
  joinedAt: string;
  showFollowers: boolean;
  showFollowing: boolean;
  canViewContent: boolean;
  canSeeNetwork: boolean;
  isBlockedByViewer: boolean;
  isMutedByViewer: boolean;
}

export interface PostAuthor {
  id: string;
  handle: string;
  displayName: string;
  photoUrl: string | null;
  teacherVerified: boolean;
}

export interface PostMediaView {
  id: string;
  kind: 'image' | 'video' | 'document';
  url: string;
  altText: string | null;
  mimeType: string;
}

export interface TopicSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  followerCount: number;
  postCount: number;
  following: boolean;
}

export interface PostView {
  id: string;
  body: string;
  audience: 'public' | 'followers' | 'private';
  createdAt: string;
  editedAt: string | null;
  author: PostAuthor;
  media: PostMediaView[];
  topics: Array<Pick<TopicSummary, 'id' | 'slug' | 'name'>>;
  hashtags: string[];
  replyToId: string | null;
  rootId: string | null;
  quote: PostView | null;
  /** Present on a post-detail reply payload (up to two visible children). */
  children?: PostView[];
  counts: {
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    bookmarks: number;
  };
  viewer: {
    liked: boolean;
    reposted: boolean;
    bookmarked: boolean;
    followsAuthor: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canReply: boolean;
  };
}

export interface FeedItem {
  key: string;
  kind: 'post' | 'repost';
  post: PostView;
  repostedBy: PostAuthor | null;
  repostedAt: string | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
  actor: Pick<PersonSummary, 'id' | 'handle' | 'displayName' | 'photoUrl'> | null;
}

export interface FollowRequestView {
  id: string;
  person: PersonSummary;
  createdAt: string;
  direction: 'incoming' | 'outgoing';
}

export interface SocialListSummary {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  ownerId: string;
  ownerHandle: string;
  memberCount: number;
  following: boolean;
  isOwner: boolean;
  updatedAt: string;
}

export interface InvitationView {
  id: string;
  email: string | null;
  channel: string;
  status: string;
  token: string;
  createdAt: string;
  sentAt: string | null;
}

export interface DiscoverabilitySettings {
  discoverable: boolean;
  recommendable: boolean;
  discoverByEmail: boolean;
  discoverByPhone: boolean;
  showEducation: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  allowSearchIndexing: boolean;
}

export interface OnboardingSnapshot {
  completed: boolean;
  step: number;
  completedSteps: string[];
  educationStage: EducationStageValue | null;
  goals: string[];
  interests: string[];
  connectDone: boolean;
  dateOfBirth: string | null;
  displayName: string;
  handle: string;
  photoUrl: string | null;
  bio: string;
  region: string | null;
  isMinor: boolean;
  isPrivate: boolean;
  grade: number | null;
  discoverable: boolean;
  recommendable: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
}

export interface ReportView {
  id: string;
  targetType: string;
  targetId: string;
  targetOwnerId: string | null;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporterHandle: string;
  targetPreview: string | null;
}

export interface SocialViewer {
  id: string;
  handle: string;
  displayName: string;
  photoUrl: string | null;
  isMinor: boolean;
  isPrivate: boolean;
  platformAdmin: boolean;
  teacherVerified: boolean;
  educationStage: EducationStageValue | null;
  unreadNotifications: number;
  pendingFollowRequests: number;
  onboardingCompleted: boolean;
}
