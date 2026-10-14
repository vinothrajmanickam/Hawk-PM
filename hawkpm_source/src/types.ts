export type RagStatus = 'Red' | 'Amber' | 'Green';
export type Severity = 'Low' | 'Medium' | 'High';
export type AccessRole = 'Edit' | 'View-only';

export interface Stakeholder {
  id: string;
  roleType: 'Project Manager' | 'Application Owner' | 'Application SPOC' | 'Business' | 'Project Owner' | 'Business Technology' | 'Additional Stakeholder';
  name: string;
  employeeId: string;
  department?: string;
  access: AccessRole;
}

export interface ApprovalRound {
  id: string;
  assignedTo: string;
  status: 'Pending' | 'Approved';
  approvedOn: string;
}

export interface RequirementDocument {
  id: string; // 'urd' | 'brd' | 'fsd' | custom ID
  name: string; // "User Requirements Document (URD)", etc.
  preparedOn: string; // YYYY-MM-DD or empty
  signedOffOn: string; // YYYY-MM-DD or empty
  signedOffStatus: 'Pending' | 'Signed Off';
  documentUrl: string;
  attachments: string[]; // Mock file attachments
  startDate?: string;
  actualStartDate?: string;
  endDate?: string;
  actualEndDate?: string;
  assignedTo?: string;
  efforts?: string; // Effort estimate in hours (numbers only)
  approvalRounds?: ApprovalRound[];
}

export interface PhaseDetails {
  id: string;
  name: string;
  ragStatus: RagStatus;
  jiraId: string;
  description: string;
  devCompletionDate: string;
  sitCompletionDate: string;
  uatCompletionDate: string;
  productionDate: string;
  attachments: string[]; // List of attachment file names
  isCustom: boolean;
  isCollapsed?: boolean;
  startDate?: string;
  actualStartDate?: string;
  endDate?: string;
  actualEndDate?: string;
  assignedTo?: string;
}

export interface RiskItem {
  id: string;
  risk: string;
  owner: string;
  eta: string;
}

export interface DelayItem {
  id: string;
  reason: string;
  owner: string;
  impactedWeek: string;
}

export interface TimelineDates {
  projectKickOff: string;
  urdSignOff: string;
  plannedBrdStart: string;
  actualBrdStart: string;
  plannedBrdEnd: string;
  actualBrdEnd: string;
  plannedFsdStart: string;
  actualFsdStart: string;
  plannedFsdEnd: string;
  actualFsdEnd: string;
  plannedDevStart: string;
  actualDevStart: string;
  plannedDevEnd: string;
  actualDevEnd: string;
  plannedSitStart: string;
  actualSitStart: string;
  plannedSitEnd: string;
  actualSitEnd: string;
  plannedUatStart: string;
  actualUatStart: string;
  plannedUatEnd: string;
  actualUatEnd: string;
  plannedGoLive: string;
  actualGoLive: string;
}

export interface TimelineVersion {
  version: number;
  timestamp: string;
  updatedBy: string;
  dates: TimelineDates;
  changeSummary: string;
}

export interface SubTask {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  originalStartDate?: string;
  finishDate: string; // YYYY-MM-DD
  originalFinishDate?: string;
  assignedTo: string;
  efforts?: string; // Effort estimate (e.g. person-days / hours), free text
  subTasks?: SubTask[];
}

export interface TaskItem {
  id: string;
  sNo: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  originalStartDate?: string;
  finishDate: string; // YYYY-MM-DD
  originalFinishDate?: string;
  assignedTo: string;
  efforts?: string; // Effort estimate (e.g. person-days / hours), free text
  subTasks: SubTask[];
}

export interface Project {
  id: string; // EP00001, etc.
  name: string;
  description: string;
  severity: Severity;
  jiraLink: string;
  createdPMId: string; // PM who created it
  ragStatus: RagStatus; // Calculated or manually set, or default to Red/Amber/Green
  deliveryDate: string; // Calculated from production date of the final phase or set explicitly
  applicationOwnerName: string;
  pmName: string;
  stakeholders: Stakeholder[];
  requirements: {
    urd: RequirementDocument;
    brd: RequirementDocument;
    fsd: RequirementDocument;
    isCompleted: boolean;
  };
  developmentPhase: PhaseDetails;
  customPhases: PhaseDetails[];
  // Editable headings
  requirementsPhaseTitle?: string;
  developmentPhaseTitle?: string;
  // Timeline dates & history
  timelineDates: TimelineDates;
  timelineVersions: TimelineVersion[];
  // Risks & Delays
  risks: RiskItem[];
  delays: DelayItem[];
  tasks?: TaskItem[];
  methodology?: 'Waterfall' | 'Agile' | 'Hybrid';
  dateChangeLogs?: DateChangeLog[];
  // Maker-checker deletion workflow.
  // - active: normal, appears on the Active dashboard.
  // - pending_deletion: an Admin requested deletion; awaits Super Admin approval.
  // - archived: deletion approved by a Super Admin; lives in the Archived bucket.
  // Undefined is treated as 'active' for backward compatibility with existing records.
  deletionStatus?: DeletionStatus;
  deletionAudit?: DeletionAudit;
}

export type DeletionStatus = 'active' | 'pending_deletion' | 'archived';

/**
 * Audit trail for the maker-checker deletion workflow.
 * The "maker" (Admin) requests deletion; the "checker" (Super Admin) approves or rejects.
 */
export interface DeletionAudit {
  // Request (maker) details
  requestedBy?: string;
  requestedById?: string;
  requestedOn?: string; // ISO timestamp
  reason?: string;
  // Approval / archival (checker) details
  approvedBy?: string;
  approvedById?: string;
  approvedOn?: string; // ISO timestamp
  // Rejection (checker) details
  rejectedBy?: string;
  rejectedById?: string;
  rejectedOn?: string; // ISO timestamp
  rejectionReason?: string;
  // Restore details
  restoredBy?: string;
  restoredOn?: string; // ISO timestamp
}

export interface DateChangeLog {
  id: string;
  taskName: string;
  field: 'startDate' | 'finishDate';
  oldValue: string;
  newValue: string;
  timestamp: string;
  reason: string;
  attachments?: string[];
  updatedBy: string;
}

// Session role stored on the user. The existing app assigns 'PM' or 'Stakeholder';
// Super Admin / Admin are derived from name/id via auth.ts helpers (not stored yet).
export type UserRole = 'PM' | 'Stakeholder';

export interface User {
  userId: string;
  name: string;
  role: UserRole;
}
