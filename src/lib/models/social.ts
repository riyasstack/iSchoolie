import type { AppDate } from './identity';

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
  createdAt: AppDate;
}

export interface CommunityMember {
  uid: string;
  displayName: string;
  joinedAt: AppDate;
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
  createdAt: AppDate;
}

export interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  body: string;
  createdAt: AppDate;
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
  handledAt: AppDate | null;
  action: string | null;
  createdAt: AppDate;
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
  createdAt: AppDate;
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
  createdAt: AppDate;
  metadata: Record<string, string | number | boolean | null>;
}
