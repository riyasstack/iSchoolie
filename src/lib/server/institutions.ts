import 'server-only';
import type { InstitutionApplication as PrismaApplication } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { InstitutionApplicationView } from '@/lib/models';
import type { InstitutionApplicationValues } from '@/lib/schemas/institution';

/**
 * Institution applications, Postgres-backed.
 *
 * Only the applicant-owned half of the domain lives here: reading and writing
 * the single application that belongs to the signed-in user. Review decisions,
 * institution creation and membership still go through Firestore
 * (`src/lib/services/institutions.ts`) until they get their own pass.
 *
 * Every function takes the *server-resolved* user id; the route handler is the
 * only caller and never accepts an id from the client.
 */

const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);

export function toApplicationView(row: PrismaApplication): InstitutionApplicationView {
  return {
    id: row.id,
    applicantUid: row.applicantUserId,
    institutionName: row.institutionName,
    category: row.category,
    officialEmail: row.officialEmail,
    contactName: row.contactName,
    contactDesignation: row.contactDesignation,
    contactPhone: row.contactPhone,
    website: row.website,
    country: row.country,
    city: row.city,
    registrationInfo: row.registrationInfo,
    declarations: {
      authorizedToApply: row.declaredAuthorized,
      informationAccurate: row.declaredAccurate,
      acceptsTerms: row.declaredTerms,
    },
    status: row.status,
    submittedAt: iso(row.submittedAt),
    reviewerUid: row.reviewerUid,
    reviewNote: row.reviewNote,
    institutionId: row.institutionId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getMyApplication(
  userId: string,
): Promise<InstitutionApplicationView | null> {
  const row = await prisma.institutionApplication.findFirst({
    where: { applicantUserId: userId },
    orderBy: { createdAt: 'desc' },
  });
  return row ? toApplicationView(row) : null;
}

export interface SubmitApplicationOptions {
  submit: boolean;
  applicantName: string;
}

/** Create or update the caller's single application. */
export async function saveInstitutionApplication(
  userId: string,
  values: InstitutionApplicationValues,
  options: SubmitApplicationOptions,
): Promise<void> {
  const details = {
    institutionName: values.institutionName,
    category: values.category,
    officialEmail: values.officialEmail,
    contactName: values.contactName,
    contactDesignation: values.contactDesignation,
    contactPhone: values.contactPhone,
    website: values.website || null,
    country: values.country,
    city: values.city,
    registrationInfo: values.registrationInfo || null,
    // The schema already refuses a submission without all three declarations.
    declaredAuthorized: true,
    declaredAccurate: true,
    declaredTerms: true,
  };

  await prisma.$transaction(async (tx) => {
    const existing = await tx.institutionApplication.findFirst({
      where: { applicantUserId: userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!existing) {
      const created = await tx.institutionApplication.create({
        data: {
          applicantUserId: userId,
          ...details,
          status: options.submit ? 'submitted' : 'draft',
          submittedAt: options.submit ? new Date() : null,
        },
      });
      await tx.institutionApplicationEvent.create({
        data: {
          applicationId: created.id,
          action: options.submit ? 'submitted' : 'draft_created',
          actorUid: userId,
          actorKind: 'applicant',
          note: `${options.applicantName} created the application`,
        },
      });
      return;
    }

    if (existing.status === 'approved') {
      throw new Error('This application has already been approved.');
    }
    if (existing.status === 'submitted' || existing.status === 'under_review') {
      throw new Error(
        'Your application is already with the iSchoolie team. You will be able to edit it if more information is requested.',
      );
    }

    const resubmitting = existing.status === 'rejected' && options.submit;

    await tx.institutionApplication.update({
      where: { id: existing.id },
      data: {
        ...details,
        status: options.submit ? 'submitted' : 'draft',
        submittedAt: options.submit ? (existing.submittedAt ?? new Date()) : existing.submittedAt,
        // A re-application clears the previous decision, as it did before.
        ...(resubmitting ? { reviewerUid: null, reviewNote: null } : {}),
      },
    });

    if (options.submit) {
      await tx.institutionApplicationEvent.create({
        data: {
          applicationId: existing.id,
          action: resubmitting ? 'resubmitted' : 'submitted',
          actorUid: userId,
          actorKind: 'applicant',
          note: resubmitting
            ? 'Re-applied after a rejection'
            : 'Application submitted for review',
        },
      });
    }
  });
}
