import type { Timestamp } from 'firebase/firestore';

/* ==========================================================================
   Communities, moderation, notifications and audit
   ========================================================================== */

export type CommunityVisibility = 'public' | 'institution';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: CommunityVisibility;
  institutionId: string | null;
  createdBy: string;
  memberCount: number;
  postCount: number;
  createdAt: Timestamp;
}

export interface CommunityMember {
  uid: string;
  displayName: string;
  joinedAt: Timestamp;
}

export type PostStatus = 'visible' | 'hidden' | 'removed';

export interface Post {
  id: string;
  communityId: string;
  authorUid: string;
  authorName: string;
  body: string;
  status: PostStatus;
  commentCount: number;
  likeCount: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  body: string;
  createdAt: Timestamp;
}

export type ReportTargetType = 'post' | 'comment' | 'user' | 'message';
export type ReportStatus = 'open' | 'reviewing' | 'actioned' | 'dismissed';

export interface Report {
  id: string;
  reporterUid: string;
  targetType: ReportTargetType;
  targetPath: string;
  targetOwnerUid: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  handledBy: string | null;
  handledAt: Timestamp | null;
  action: string | null;
  createdAt: Timestamp;
}

export type NotificationType =
  | 'assignment'
  | 'grade'
  | 'institution'
  | 'guardian'
  | 'system'
  | 'moderation';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: Timestamp;
}

export type AuditActorKind = 'admin_cli' | 'platform_admin' | 'system';

/** `auditLogs/{id}` — clients cannot write; only the Admin SDK can. */
export interface AuditLog {
  id: string;
  action: string;
  actorUid: string;
  actorKind: AuditActorKind;
  subjectType: string;
  subjectId: string;
  detail: string;
  createdAt: Timestamp;
  metadata: Record<string, string | number | boolean | null>;
}
