import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Append-only trail for sensitive social actions. Never throws into the user
 * path: losing an audit row must not make a successful action look failed, so
 * failures are reported to the server log instead.
 */
export async function recordAudit(input: {
  actorId?: string | null;
  action: string;
  subjectType: string;
  subjectId: string;
  detail?: string;
}): Promise<void> {
  try {
    await prisma.securityAuditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        detail: (input.detail ?? '').slice(0, 500),
      },
    });
  } catch (error) {
    console.error('[social audit] could not write event', input.action, error);
  }
}
