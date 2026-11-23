import type { InstitutionApplicationStatus, InstitutionApplicationView } from '@/lib/models';

export type { InstitutionApplicationView } from '@/lib/models';

export const OPEN_APPLICATION_STATUSES: InstitutionApplicationStatus[] = [
  'submitted',
  'under_review',
  'more_information_required',
];

export interface SubmitApplicationOptions {
  submit: boolean;
  applicantName: string;
}

export interface ReviewDecision {
  decision: 'under_review' | 'more_information_required' | 'reject';
  note: string;
  reviewerUid: string;
}

export function toMillis(value: any): number {
  return value && typeof value.toMillis === 'function' ? value.toMillis() : 0;
}

export function membershipDocId(_institutionId: string, uid: string): string {
  return uid;
}

export async function getMyApplication(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function saveInstitutionApplication(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function recordEvent(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function listApplicationEvents(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function recordReviewDecision(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function listPendingApplications(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function listAllApplications(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function getApplication(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function getInstitution(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function listInstitutionMembers(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }
export async function listInstitutions(..._args: any[]): Promise<any> { throw new Error('Institution domain is not available yet.'); }