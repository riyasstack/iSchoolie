/**
 * Academic domain — not yet ported to Postgres. These are stubs so the
 * codebase compiles without Firebase. Calls throw at runtime; the routes
 * that use them are not part of the core sign-in/profile/dashboard flow.
 */
export async function listInstitutionClasses(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function createClass(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function joinClassWithCode(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function getClass(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listRoster(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listStudentClasses(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listTeachingClasses(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function enrollSelfInClass(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listAssignments(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function createAssignment(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function getAssignment(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function closeAssignment(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function getSubmission(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function submitAssignment(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listSubmissions(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listGrades(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function getGrade(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function saveGrade(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listPublishedGradesForStudent(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listPublishedCourses(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listMyCourses(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function getCourse(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function createCourse(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function enrollInCourse(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }
export async function listMyCourseEnrollments(..._args: any[]): Promise<any> { throw new Error('Academic domain is not available yet.'); }

export class DuplicateSubmissionError extends Error {}