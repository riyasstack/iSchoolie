-- CreateEnum
CREATE TYPE "SocialAudience" AS ENUM ('public', 'followers', 'private');

-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('active', 'pending');

-- CreateEnum
CREATE TYPE "EducationStage" AS ENUM ('school_student', 'college_student', 'teacher', 'education_professional', 'parent', 'lifelong_learner');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('image', 'video', 'document');

-- CreateEnum
CREATE TYPE "SocialNotificationType" AS ENUM ('follow', 'follow_request', 'follow_accepted', 'reaction', 'reply', 'mention', 'repost', 'quote', 'moderation', 'invitation');

-- CreateEnum
CREATE TYPE "SocialReportTargetType" AS ENUM ('post', 'reply', 'user');

-- CreateEnum
CREATE TYPE "SocialListVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('created', 'sent', 'accepted', 'revoked');

-- CreateTable
CREATE TABLE "social_profiles" (
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "website" TEXT,
    "region" TEXT,
    "educationStage" "EducationStage",
    "professionalFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "discoverability_preferences" (
    "userId" TEXT NOT NULL,
    "discoverable" BOOLEAN NOT NULL DEFAULT true,
    "recommendable" BOOLEAN NOT NULL DEFAULT true,
    "discoverByEmail" BOOLEAN NOT NULL DEFAULT false,
    "discoverByPhone" BOOLEAN NOT NULL DEFAULT false,
    "showEducation" BOOLEAN NOT NULL DEFAULT true,
    "showFollowers" BOOLEAN NOT NULL DEFAULT true,
    "showFollowing" BOOLEAN NOT NULL DEFAULT true,
    "allowSearchIndexing" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discoverability_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "onboarding_progress" (
    "userId" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "educationStage" "EducationStage",
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "connectDone" BOOLEAN NOT NULL DEFAULT false,
    "inviteSkipped" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'General',
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interests" (
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interests_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "user_goals" (
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("userId","goal")
);

-- CreateTable
CREATE TABLE "topic_follows" (
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_follows_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "social_follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "status" "FollowStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "social_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "user_mutes" (
    "muterId" TEXT NOT NULL,
    "mutedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mutes_pkey" PRIMARY KEY ("muterId","mutedId")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "audience" "SocialAudience" NOT NULL DEFAULT 'public',
    "status" "PostStatus" NOT NULL DEFAULT 'visible',
    "replyToId" TEXT,
    "rootId" TEXT,
    "quoteOfId" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "repostCount" INTEGER NOT NULL DEFAULT 0,
    "quoteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_assets" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "altText" VARCHAR(400),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_media" (
    "postId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "social_post_media_pkey" PRIMARY KEY ("postId","assetId")
);

-- CreateTable
CREATE TABLE "social_post_topics" (
    "postId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "social_post_topics_pkey" PRIMARY KEY ("postId","topicId")
);

-- CreateTable
CREATE TABLE "social_post_hashtags" (
    "postId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "social_post_hashtags_pkey" PRIMARY KEY ("postId","tag")
);

-- CreateTable
CREATE TABLE "social_post_mentions" (
    "postId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,

    CONSTRAINT "social_post_mentions_pkey" PRIMARY KEY ("postId","mentionedUserId")
);

-- CreateTable
CREATE TABLE "social_reactions" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_reactions_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "social_reposts" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_reposts_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "social_bookmarks" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_bookmarks_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "social_notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "SocialNotificationType" NOT NULL,
    "postId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "SocialReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetOwnerId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "handledBy" TEXT,
    "handledAt" TIMESTAMP(3),
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_moderation_actions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_dismissals" (
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_dismissals_pkey" PRIMARY KEY ("userId","targetUserId")
);

-- CreateTable
CREATE TABLE "recommendation_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_invitations" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'link',
    "status" "InvitationStatus" NOT NULL DEFAULT 'created',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "social_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_lists" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "visibility" "SocialListVisibility" NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_list_members" (
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_list_members_pkey" PRIMARY KEY ("listId","userId")
);

-- CreateTable
CREATE TABLE "social_list_follows" (
    "listId" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_list_follows_pkey" PRIMARY KEY ("listId","followerId")
);

-- CreateTable
CREATE TABLE "security_audit_events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "topics_name_key" ON "topics"("name");

-- CreateIndex
CREATE INDEX "topics_category_idx" ON "topics"("category");

-- CreateIndex
CREATE INDEX "user_interests_topicId_idx" ON "user_interests"("topicId");

-- CreateIndex
CREATE INDEX "topic_follows_topicId_idx" ON "topic_follows"("topicId");

-- CreateIndex
CREATE INDEX "social_follows_followingId_status_idx" ON "social_follows"("followingId", "status");

-- CreateIndex
CREATE INDEX "social_follows_followerId_status_idx" ON "social_follows"("followerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "social_follows_followerId_followingId_key" ON "social_follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "user_blocks_blockedId_idx" ON "user_blocks"("blockedId");

-- CreateIndex
CREATE INDEX "user_mutes_mutedId_idx" ON "user_mutes"("mutedId");

-- CreateIndex
CREATE INDEX "social_posts_authorId_createdAt_idx" ON "social_posts"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "social_posts_audience_status_createdAt_idx" ON "social_posts"("audience", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "social_posts_replyToId_createdAt_idx" ON "social_posts"("replyToId", "createdAt");

-- CreateIndex
CREATE INDEX "social_posts_rootId_createdAt_idx" ON "social_posts"("rootId", "createdAt");

-- CreateIndex
CREATE INDEX "social_media_assets_ownerId_createdAt_idx" ON "social_media_assets"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "social_post_media_assetId_idx" ON "social_post_media"("assetId");

-- CreateIndex
CREATE INDEX "social_post_topics_topicId_idx" ON "social_post_topics"("topicId");

-- CreateIndex
CREATE INDEX "social_post_hashtags_tag_idx" ON "social_post_hashtags"("tag");

-- CreateIndex
CREATE INDEX "social_post_mentions_mentionedUserId_idx" ON "social_post_mentions"("mentionedUserId");

-- CreateIndex
CREATE INDEX "social_reactions_userId_createdAt_idx" ON "social_reactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "social_reposts_userId_createdAt_idx" ON "social_reposts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "social_bookmarks_userId_createdAt_idx" ON "social_bookmarks"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "social_notifications_recipientId_createdAt_idx" ON "social_notifications"("recipientId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "social_notifications_recipientId_read_idx" ON "social_notifications"("recipientId", "read");

-- CreateIndex
CREATE INDEX "social_reports_status_createdAt_idx" ON "social_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "social_reports_targetType_targetId_idx" ON "social_reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "social_moderation_actions_createdAt_idx" ON "social_moderation_actions"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "recommendation_dismissals_userId_createdAt_idx" ON "recommendation_dismissals"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "recommendation_feedback_userId_createdAt_idx" ON "recommendation_feedback"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "social_invitations_token_key" ON "social_invitations"("token");

-- CreateIndex
CREATE INDEX "social_invitations_inviterId_createdAt_idx" ON "social_invitations"("inviterId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "social_lists_ownerId_createdAt_idx" ON "social_lists"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "social_list_members_userId_idx" ON "social_list_members"("userId");

-- CreateIndex
CREATE INDEX "social_list_follows_followerId_idx" ON "social_list_follows"("followerId");

-- CreateIndex
CREATE INDEX "security_audit_events_createdAt_idx" ON "security_audit_events"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "security_audit_events_subjectType_subjectId_idx" ON "security_audit_events"("subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discoverability_preferences" ADD CONSTRAINT "discoverability_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_follows" ADD CONSTRAINT "topic_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_follows" ADD CONSTRAINT "topic_follows_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_quoteOfId_fkey" FOREIGN KEY ("quoteOfId") REFERENCES "social_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_assets" ADD CONSTRAINT "social_media_assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "social_media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_topics" ADD CONSTRAINT "social_post_topics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_topics" ADD CONSTRAINT "social_post_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_hashtags" ADD CONSTRAINT "social_post_hashtags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_mentions" ADD CONSTRAINT "social_post_mentions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_mentions" ADD CONSTRAINT "social_post_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reactions" ADD CONSTRAINT "social_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reactions" ADD CONSTRAINT "social_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reposts" ADD CONSTRAINT "social_reposts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reposts" ADD CONSTRAINT "social_reposts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_bookmarks" ADD CONSTRAINT "social_bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_bookmarks" ADD CONSTRAINT "social_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_moderation_actions" ADD CONSTRAINT "social_moderation_actions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_dismissals" ADD CONSTRAINT "recommendation_dismissals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_invitations" ADD CONSTRAINT "social_invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_lists" ADD CONSTRAINT "social_lists_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_list_members" ADD CONSTRAINT "social_list_members_listId_fkey" FOREIGN KEY ("listId") REFERENCES "social_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_list_members" ADD CONSTRAINT "social_list_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_list_follows" ADD CONSTRAINT "social_list_follows_listId_fkey" FOREIGN KEY ("listId") REFERENCES "social_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_list_follows" ADD CONSTRAINT "social_list_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_audit_events" ADD CONSTRAINT "security_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

