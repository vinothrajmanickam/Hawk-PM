import { Project } from '../types';

/**
 * Checks if the current user is a Super Admin.
 * Super Admin sits above Admin and holds the second-approval (checker) authority
 * for the maker-checker deletion workflow.
 *
 * For now identified by name containing "superadmin" or user ID "superadmin".
 * (To be replaced by an Azure AD app role / group once SSO roles are wired in.)
 */
export const isSuperAdmin = (userName: string, userId: string): boolean => {
  if (!userName && !userId) return false;
  const nameLower = (userName || '').toLowerCase();
  const idLower = (userId || '').toLowerCase();
  return nameLower.includes('superadmin') || idLower === 'superadmin';
};

/**
 * Checks if the current user is an Admin (Vinoth / "admin" ID) or a Super Admin.
 * Super Admin inherits all Admin capabilities.
 */
export const isAdmin = (userName: string, userId: string): boolean => {
  if (isSuperAdmin(userName, userId)) return true;
  if (!userName && !userId) return false;
  const nameLower = (userName || '').toLowerCase();
  const idLower = (userId || '').toLowerCase();
  return nameLower.includes('vinoth') || idLower === 'admin';
};

/**
 * Checks if the user is allowed to create a project.
 * Everyone (Super Admin, Admin, PM, Application Owner, Viewer) can create projects.
 */
export const canCreateProject = (): boolean => {
  return true;
};

/**
 * Checks if the user is allowed to edit a specific project.
 * - Super Admin / Admin have edit access to all projects.
 * - Project Manager & Application Owner have edit access for their own projects.
 * - Everyone else is view-only.
 */
export const canEditProject = (project: Project, userName: string, userId: string): boolean => {
  if (isAdmin(userName, userId)) return true;

  const uName = (userName || '').trim().toLowerCase();
  const pmName = (project.pmName || '').trim().toLowerCase();
  const appOwnerName = (project.applicationOwnerName || '').trim().toLowerCase();

  // Is Project Manager
  const isPM = pmName === uName || project.createdPMId === userId;

  // Is Application Owner
  const isAppOwner = appOwnerName === uName || project.stakeholders.some(
    s => s.roleType === 'Application Owner' && s.name.toLowerCase() === uName
  );

  return isPM || isAppOwner;
};

/**
 * Maker step: who can REQUEST deletion of a project.
 * Admin and Super Admin can request. This replaces the old direct-delete permission.
 */
export const canRequestDeletion = (_project: Project, userName: string, userId: string): boolean => {
  return isAdmin(userName, userId);
};

/**
 * Checker step: who can APPROVE or REJECT a pending deletion.
 * Only a Super Admin, and (strict maker-checker) NOT the same person who requested it.
 */
export const canApproveDeletion = (project: Project, userName: string, userId: string): boolean => {
  if (!isSuperAdmin(userName, userId)) return false;
  if (project.deletionStatus !== 'pending_deletion') return false;

  // Approver must be different from the requester (maker != checker).
  const requesterId = (project.deletionAudit?.requestedById || '').toLowerCase();
  const requesterName = (project.deletionAudit?.requestedBy || '').toLowerCase();
  const uId = (userId || '').toLowerCase();
  const uName = (userName || '').toLowerCase();
  const isSamePerson =
    (!!requesterId && requesterId === uId) ||
    (!!requesterName && requesterName === uName);

  return !isSamePerson;
};

/**
 * Who can RESTORE an archived (or pending) project back to active.
 * Admin and Super Admin.
 */
export const canRestore = (userName: string, userId: string): boolean => {
  return isAdmin(userName, userId);
};

/**
 * Who can PERMANENTLY delete a project from the archive.
 * Super Admin only.
 */
export const canPermanentlyDelete = (userName: string, userId: string): boolean => {
  return isSuperAdmin(userName, userId);
};

/**
 * Backward-compatible helper retained for existing imports.
 * Now maps to "can request deletion" since direct deletion is replaced by the
 * maker-checker workflow.
 */
export const canDeleteProject = (project: Project, userName: string, userId: string): boolean => {
  return canRequestDeletion(project, userName, userId);
};

/**
 * Convenience: normalized deletion status (treats undefined as 'active').
 */
export const getDeletionStatus = (project: Project): 'active' | 'pending_deletion' | 'archived' => {
  return project.deletionStatus ?? 'active';
};
