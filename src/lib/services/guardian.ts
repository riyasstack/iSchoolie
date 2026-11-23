import type { GuardianLink, GuardianLinkStatus } from '@/lib/models';
import type { GuardianRequestValues } from '@/lib/schemas/social';

export interface GuardianRequestDoc {
  id: string;
  guardianUid: string;
  guardianName: string;
  studentEmail: string;
  studentUid: string | null;
  relationship: GuardianRequestValues['relationship'];
  consent: GuardianRequestValues['consent'];
  status: GuardianLinkStatus;
  note: string | null;
  decidedBy: string | null;
  decidedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export async function requestGuardianLink(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function listRequestsForGuardian(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function listRequestsForStudentEmail(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function confirmGuardianRequest(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function cancelGuardianRequest(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function approveGuardianRequest(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function rejectGuardianRequest(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function listLinksForGuardian(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function listLinksForStudent(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function listPendingLinks(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function listPendingGuardianRequests(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function revokeGuardianLink(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }
export async function getGuardianLink(..._args: any[]): Promise<any> { throw new Error('Guardian domain is not available yet.'); }