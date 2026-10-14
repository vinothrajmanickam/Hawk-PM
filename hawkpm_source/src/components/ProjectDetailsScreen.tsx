import React, { useState } from 'react';
import { Project, RequirementDocument, PhaseDetails, RagStatus, Severity, Stakeholder, ApprovalRound, TimelineDates, TimelineVersion, RiskItem, DelayItem, SubTask, TaskItem, DateChangeLog } from '../types';
import { canEditProject, canRequestDeletion } from '../utils/auth';
import { EquitasIcon } from './EquitasLogo';
import { DEFAULT_TASKS_TEMPLATE } from '../initialData';
import { 
  ArrowLeft, Calendar, FileText, Lock, Unlock, Plus, Trash2, 
  ChevronDown, ChevronUp, Upload, CheckCircle2, AlertCircle, Save, Info, Link as LinkIcon,
  FileSpreadsheet, Printer, Paperclip
} from 'lucide-react';
import {
  generateSingleProjectExcelReport,
  generateSingleProjectWordReport,
  generateSingleProjectCSV,
  generateSingleProjectMPP,
  downloadExcel,
  downloadWord,
  downloadCSV,
  downloadMPP,
  formatDate
} from '../reportGenerator';

interface ProjectDetailsScreenProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  onRequestDeletion?: (projectId: string, reason: string) => void;
  currentUserId: string;
  currentUserRole: 'PM' | 'Stakeholder';
  currentEmployeeId?: string;
  currentUserName: string;
  onTriggerPrint?: (projectId: string) => void;
}

const TIMELINE_GRID_ROWS = [
  {
    phase: "Project Kick-Off",
    plannedStartKey: undefined,
    actualStartKey: "projectKickOff" as const,
    plannedEndKey: undefined,
    actualEndKey: undefined,
  },
  {
    phase: "URD Sign-Off",
    plannedStartKey: undefined,
    actualStartKey: undefined,
    plannedEndKey: undefined,
    actualEndKey: "urdSignOff" as const,
  },
  {
    phase: "Business Requirements (BRD)",
    plannedStartKey: "plannedBrdStart" as const,
    actualStartKey: "actualBrdStart" as const,
    plannedEndKey: "plannedBrdEnd" as const,
    actualEndKey: "actualBrdEnd" as const,
  },
  {
    phase: "Functional Specifications (FSD)",
    plannedStartKey: "plannedFsdStart" as const,
    actualStartKey: "actualFsdStart" as const,
    plannedEndKey: "plannedFsdEnd" as const,
    actualEndKey: "actualFsdEnd" as const,
  },
  {
    phase: "Development Phase",
    plannedStartKey: "plannedDevStart" as const,
    actualStartKey: "actualDevStart" as const,
    plannedEndKey: "plannedDevEnd" as const,
    actualEndKey: "actualDevEnd" as const,
  },
  {
    phase: "System Integration Testing (SIT)",
    plannedStartKey: "plannedSitStart" as const,
    actualStartKey: "actualSitStart" as const,
    plannedEndKey: "plannedSitEnd" as const,
    actualEndKey: "actualSitEnd" as const,
  },
  {
    phase: "User Acceptance Testing (UAT)",
    plannedStartKey: "plannedUatStart" as const,
    actualStartKey: "actualUatStart" as const,
    plannedEndKey: "plannedUatEnd" as const,
    actualEndKey: "actualUatEnd" as const,
  },
  {
    phase: "Go-Live & Rollout",
    plannedStartKey: undefined,
    actualStartKey: undefined,
    plannedEndKey: "plannedGoLive" as const,
    actualEndKey: "actualGoLive" as const,
  }
];

// Helper functions for Project Execution Tracking
const calculateDuration = (start: string, finish: string): number => {
  if (!start || !finish) return 0;
  const s = new Date(start);
  const f = new Date(finish);
  if (isNaN(s.getTime()) || isNaN(f.getTime())) return 0;
  const diffTime = f.getTime() - s.getTime();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive count
};

const isDateChanged = (current: string, original: string): boolean => {
  if (!current && !original) return false;
  if (!current || !original) return true;
  return current !== original;
};

const syncRequirementsTask = (project: Project): TaskItem[] => {
  const brdPrep = project.requirements?.brd?.preparedOn || '';
  const brdSignOff = project.requirements?.brd?.signedOffOn || '';
  const fsdPrep = project.requirements?.fsd?.preparedOn || '';
  const fsdSignOff = project.requirements?.fsd?.signedOffOn || '';

  const startDates = [brdPrep, fsdPrep].filter(Boolean).sort();
  const reqStart = startDates[0] || '';

  const finishDates = [brdSignOff, fsdSignOff].filter(Boolean).sort();
  const reqFinish = finishDates[finishDates.length - 1] || '';

  const brdSub: SubTask = {
    id: "sub_req_brd",
    name: "BRD",
    startDate: brdPrep,
    originalStartDate: brdPrep,
    finishDate: brdSignOff,
    originalFinishDate: brdSignOff,
    assignedTo: project.requirements?.brd?.assignedTo || 'Business Analyst'
  };

  const fsdSub: SubTask = {
    id: "sub_req_fsd",
    name: "FSD",
    startDate: fsdPrep,
    originalStartDate: fsdPrep,
    finishDate: fsdSignOff,
    originalFinishDate: fsdSignOff,
    assignedTo: project.requirements?.fsd?.assignedTo || 'Business Analyst'
  };

  const reqTask: TaskItem = {
    id: "task_requirements",
    sNo: "1",
    name: "Requirements",
    startDate: reqStart,
    originalStartDate: reqStart,
    finishDate: reqFinish,
    originalFinishDate: reqFinish,
    assignedTo: "Business Analyst",
    subTasks: [brdSub, fsdSub]
  };

  const currentTasks = project.tasks || [];
  const withoutReq = currentTasks.filter(t => t.id !== 'task_requirements');
  
  const reindexed = withoutReq.map((t, idx) => ({
    ...t,
    sNo: String(idx + 2)
  }));

  return [reqTask, ...reindexed];
};

const syncTimelineDatesFromTasks = (project: Project): Project => {
  if (!project.tasks) return project;

  const currentDates = project.timelineDates || {
    projectKickOff: '', urdSignOff: '',
    plannedBrdStart: '', actualBrdStart: '', plannedBrdEnd: '', actualBrdEnd: '',
    plannedFsdStart: '', actualFsdStart: '', plannedFsdEnd: '', actualFsdEnd: '',
    plannedDevStart: '', actualDevStart: '', plannedDevEnd: '', actualDevEnd: '',
    plannedSitStart: '', actualSitStart: '', plannedSitEnd: '', actualSitEnd: '',
    plannedUatStart: '', actualUatStart: '', plannedUatEnd: '', actualUatEnd: '',
    plannedGoLive: '', actualGoLive: ''
  };

  const updatedDates = { ...currentDates };
  const tasks = project.tasks;

  const findTask = (id: string) => tasks.find(t => t.id === id);

  const findSubTask = (subTaskId: string) => {
    for (const task of tasks) {
      const found = (task.subTasks || []).find(s => s.id === subTaskId);
      if (found) return found;
    }
    return null;
  };

  // 1. Business Requirements (BRD) -> sub_req_brd
  const brd = findSubTask("sub_req_brd");
  if (brd) {
    updatedDates.plannedBrdStart = brd.originalStartDate || brd.startDate || '';
    updatedDates.actualBrdStart = brd.startDate || '';
    updatedDates.plannedBrdEnd = brd.originalFinishDate || brd.finishDate || '';
    updatedDates.actualBrdEnd = brd.finishDate || '';
  }

  // 2. Functional Specifications (FSD) -> sub_req_fsd
  const fsd = findSubTask("sub_req_fsd");
  if (fsd) {
    updatedDates.plannedFsdStart = fsd.originalStartDate || fsd.startDate || '';
    updatedDates.actualFsdStart = fsd.startDate || '';
    updatedDates.plannedFsdEnd = fsd.originalFinishDate || fsd.finishDate || '';
    updatedDates.actualFsdEnd = fsd.finishDate || '';
  }

  // 3. Development Phase -> task_dev
  const dev = findTask("task_dev");
  if (dev) {
    updatedDates.plannedDevStart = dev.originalStartDate || dev.startDate || '';
    updatedDates.actualDevStart = dev.startDate || '';
    updatedDates.plannedDevEnd = dev.originalFinishDate || dev.finishDate || '';
    updatedDates.actualDevEnd = dev.finishDate || '';
  }

  // 4. System Integration Testing (SIT) -> task_sit
  const sit = findTask("task_sit");
  if (sit) {
    updatedDates.plannedSitStart = sit.originalStartDate || sit.startDate || '';
    updatedDates.actualSitStart = sit.startDate || '';
    updatedDates.plannedSitEnd = sit.originalFinishDate || sit.finishDate || '';
    updatedDates.actualSitEnd = sit.finishDate || '';
  }

  // 5. User Acceptance Testing (UAT) -> task_uat
  const uat = findTask("task_uat");
  if (uat) {
    updatedDates.plannedUatStart = uat.originalStartDate || uat.startDate || '';
    updatedDates.actualUatStart = uat.startDate || '';
    updatedDates.plannedUatEnd = uat.originalFinishDate || uat.finishDate || '';
    updatedDates.actualUatEnd = uat.finishDate || '';
  }

  // 6. Go-Live & Rollout -> task_golive
  const golive = findTask("task_golive");
  if (golive) {
    updatedDates.plannedGoLive = golive.originalFinishDate || golive.finishDate || '';
    updatedDates.actualGoLive = golive.finishDate || '';
  }

  return {
    ...project,
    timelineDates: updatedDates
  };
};

export default function ProjectDetailsScreen({
  project,
  onBack,
  onUpdateProject,
  onRequestDeletion,
  currentUserId,
  currentUserRole,
  currentEmployeeId,
  currentUserName,
  onTriggerPrint
}: ProjectDetailsScreenProps) {

  // 1. Calculate Access Rights based on user role and configuration
  const hasEditAccess = canEditProject(project, currentUserName, currentUserId);
  const hasDeleteAccess = canRequestDeletion(project, currentUserName, currentUserId);
  const deletionStatus = project.deletionStatus ?? 'active';
  const isPendingDeletion = deletionStatus === 'pending_deletion';
  const keyStakeholderList = project.stakeholders.filter(s => s.access === 'Edit');

  // Maker step: Admin requests deletion (two-step confirm + mandatory reason).
  // The project moves to 'pending_deletion' and awaits Super Admin approval.
  const handleDeleteProjectClick = () => {
    if (!hasDeleteAccess) return;
    if (isPendingDeletion) {
      window.alert(`This project is already pending deletion approval from a Super Admin.\n\nRequested by: ${project.deletionAudit?.requestedBy || 'Unknown'}`);
      return;
    }
    const confirm1 = window.confirm(`DELETION REQUEST (MAKER STEP):\n\nYou are requesting deletion of the project "${project.name}" (${project.id}).\n\nThis will move the project to "Pending Deletion" and require a SUPER ADMIN to approve before it is archived. It will not be removed immediately.\n\nDo you want to continue?`);
    if (!confirm1) return;

    const reason = window.prompt(`Please provide a reason for this deletion request.\n\n(This is recorded in the audit trail and shown to the Super Admin approver.)`, '');
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      window.alert('A reason is required to request deletion. Action cancelled.');
      return;
    }

    const confirm2 = window.confirm(`CONFIRM DELETION REQUEST:\n\nProject: "${project.name}" (${project.id})\nRequested by: ${currentUserName}\nReason: ${reason.trim()}\n\nClick OK to submit this request for Super Admin approval.`);
    if (confirm2 && onRequestDeletion) {
      onRequestDeletion(project.id, reason.trim());
    }
  };

  // Local state copy of the project for editing
  const [editedProject, setRawEditedProject] = useState<Project>(() => {
    let copy = { ...project };
    if (!copy.tasks || copy.tasks.length === 0) {
      copy.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    }
    copy.tasks = syncRequirementsTask(copy);
    copy = syncTimelineDatesFromTasks(copy);
    return copy;
  });

  const setEditedProject = (value: React.SetStateAction<Project>) => {
    setRawEditedProject(prev => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      return syncTimelineDatesFromTasks(next);
    });
  };
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [dragOverDoc, setDragOverDoc] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Date Change state
  const [pendingDateChange, setPendingDateChange] = useState<{
    type: 'task' | 'subtask' | 'nested';
    taskId: string;
    subTaskId?: string;
    nestedSubTaskId?: string;
    taskName: string;
    field: 'startDate' | 'finishDate';
    oldValue: string;
    newValue: string;
  } | null>(null);

  const [dateChangeReason, setDateChangeReason] = useState('');
  const [dateChangeAttachments, setDateChangeAttachments] = useState<string[]>([]);

  // Custom phase creation state
  const [newPhaseName, setNewPhaseName] = useState('');
  const [showAddPhaseInput, setShowAddPhaseInput] = useState(false);

  // Expanded/Collapsed states for phases (Local UI state)
  const [devExpanded, setDevExpanded] = useState(true);
  const [customExpanded, setCustomExpanded] = useState<Record<string, boolean>>({});

  // Active tab state for document approval rounds
  const [activeDocTabs, setActiveDocTabs] = useState<Record<'urd' | 'brd' | 'fsd', string>>({
    urd: '1',
    brd: '1',
    fsd: '1',
  });

  // Comparison version ID for highlighting timeline date changes
  const [compareVersionId, setCompareVersionId] = useState<number | 'none'>(1);

  // Timeline Dates & History state helpers
  const handleTimelineDateChange = (key: keyof TimelineDates, val: string) => {
    const updatedDates = {
      ...(editedProject.timelineDates || {
        projectKickOff: '', urdSignOff: '',
        plannedBrdStart: '', actualBrdStart: '', plannedBrdEnd: '', actualBrdEnd: '',
        plannedFsdStart: '', actualFsdStart: '', plannedFsdEnd: '', actualFsdEnd: '',
        plannedDevStart: '', actualDevStart: '', plannedDevEnd: '', actualDevEnd: '',
        plannedSitStart: '', actualSitStart: '', plannedSitEnd: '', actualSitEnd: '',
        plannedUatStart: '', actualUatStart: '', plannedUatEnd: '', actualUatEnd: '',
        plannedGoLive: '', actualGoLive: ''
      }),
      [key]: val
    };
    setEditedProject({
      ...editedProject,
      timelineDates: updatedDates
    });
  };

  const createTimelineVersionIfNeeded = (currentProject: Project, author: string): Project => {
    const currentDates = currentProject.timelineDates || {
      projectKickOff: '', urdSignOff: '',
      plannedBrdStart: '', actualBrdStart: '', plannedBrdEnd: '', actualBrdEnd: '',
      plannedFsdStart: '', actualFsdStart: '', plannedFsdEnd: '', actualFsdEnd: '',
      plannedDevStart: '', actualDevStart: '', plannedDevEnd: '', actualDevEnd: '',
      plannedSitStart: '', actualSitStart: '', plannedSitEnd: '', actualSitEnd: '',
      plannedUatStart: '', actualUatStart: '', plannedUatEnd: '', actualUatEnd: '',
      plannedGoLive: '', actualGoLive: ''
    };
    const versions = currentProject.timelineVersions || [];
    const lastVersion = versions[versions.length - 1];
    const lastDates = lastVersion ? lastVersion.dates : null;

    if (!lastDates) {
      // Save Version 1 as baseline
      const newV1: TimelineVersion = {
        version: 1,
        timestamp: new Date().toISOString(),
        updatedBy: author,
        changeSummary: "Original baseline schedule initialized.",
        dates: { ...currentDates }
      };
      return {
        ...currentProject,
        timelineVersions: [newV1]
      };
    }

    // Detect differences (except Project Kick-Off and URD Sign-Off)
    const changes: string[] = [];
    const keys: (keyof TimelineDates)[] = [
      'plannedBrdStart', 'actualBrdStart', 'plannedBrdEnd', 'actualBrdEnd',
      'plannedFsdStart', 'actualFsdStart', 'plannedFsdEnd', 'actualFsdEnd',
      'plannedDevStart', 'actualDevStart', 'plannedDevEnd', 'actualDevEnd',
      'plannedSitStart', 'actualSitStart', 'plannedSitEnd', 'actualSitEnd',
      'plannedUatStart', 'actualUatStart', 'plannedUatEnd', 'actualUatEnd',
      'plannedGoLive', 'actualGoLive'
    ];

    const getLabel = (k: keyof TimelineDates) => {
      switch(k) {
        case 'projectKickOff': return 'Project Kick-Off';
        case 'urdSignOff': return 'URD Sign-Off';
        case 'plannedBrdStart': return 'Planned BRD Start';
        case 'actualBrdStart': return 'Actual BRD Start';
        case 'plannedBrdEnd': return 'Planned BRD End';
        case 'actualBrdEnd': return 'Actual BRD End';
        case 'plannedFsdStart': return 'Planned FSD Start';
        case 'actualFsdStart': return 'Actual FSD Start';
        case 'plannedFsdEnd': return 'Planned FSD End';
        case 'actualFsdEnd': return 'Actual FSD End';
        case 'plannedDevStart': return 'Planned Dev Start';
        case 'actualDevStart': return 'Actual Dev Start';
        case 'plannedDevEnd': return 'Planned Dev End';
        case 'actualDevEnd': return 'Actual Dev End';
        case 'plannedSitStart': return 'Planned SIT Start';
        case 'actualSitStart': return 'Actual SIT Start';
        case 'plannedSitEnd': return 'Planned SIT End';
        case 'actualSitEnd': return 'Actual SIT End';
        case 'plannedUatStart': return 'Planned UAT Start';
        case 'actualUatStart': return 'Actual UAT Start';
        case 'plannedUatEnd': return 'Planned UAT End';
        case 'actualUatEnd': return 'Actual UAT End';
        case 'plannedGoLive': return 'Planned Go-Live';
        case 'actualGoLive': return 'Actual Go-Live';
      }
    };

    keys.forEach(k => {
      if ((currentDates[k] || '') !== (lastDates[k] || '')) {
        changes.push(`${getLabel(k)} (${lastDates[k] || 'Not Set'} ➔ ${currentDates[k] || 'Not Set'})`);
      }
    });

    if (changes.length > 0) {
      const nextVersionNum = (lastVersion.version || versions.length) + 1;
      const newVersion: TimelineVersion = {
        version: nextVersionNum,
        timestamp: new Date().toISOString(),
        updatedBy: author,
        changeSummary: changes.join(", "),
        dates: { ...currentDates }
      };
      return {
        ...currentProject,
        timelineVersions: [...versions, newVersion]
      };
    }

    return currentProject;
  };

  const renderDateCell = (key: keyof TimelineDates | undefined) => {
    if (!key) {
      return (
        <td className="py-2.5 px-3 text-slate-300 italic text-center bg-slate-50/10 border-r border-slate-150 font-mono last:border-r-0">
          —
        </td>
      );
    }

    const compareVersion = (editedProject.timelineVersions || []).find(v => v.version === compareVersionId);
    const compareDates = compareVersion ? compareVersion.dates : null;
    const currentVal = editedProject.timelineDates?.[key] || '';
    const baseVal = compareDates ? (compareDates[key] || '') : '';
    const isChanged = compareVersionId !== 'none' && compareDates && currentVal !== baseVal;

    const isKickOffOrUrd = key === 'projectKickOff' || key === 'urdSignOff';

    return (
      <td className={`py-2.5 px-3 border-r border-slate-150 last:border-r-0 ${isChanged ? 'bg-amber-50/40' : ''}`}>
        {hasEditAccess && isKickOffOrUrd ? (
          <div className="space-y-1">
            <input
              type="date"
              value={currentVal}
              onChange={(e) => handleTimelineDateChange(key, e.target.value)}
              className={`bg-white text-xs text-slate-900 border rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isChanged 
                  ? 'border-amber-400 bg-amber-50/80 text-amber-950 focus:bg-white font-semibold' 
                  : 'border-slate-200'
              }`}
            />
            {isChanged && (
              <span className="block text-[10px] text-amber-700 font-semibold leading-tight pl-1">
                v{compareVersionId}: <span className="font-mono font-bold">{baseVal ? formatDate(baseVal) : 'None'}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className={`font-mono text-xs px-2.5 py-1 rounded-lg inline-block text-center ${
              isChanged 
                ? 'bg-amber-100 text-amber-900 border border-amber-200 font-bold' 
                : currentVal ? 'text-slate-800 bg-slate-100' : 'text-slate-400'
            }`}>
              {currentVal ? formatDate(currentVal) : '—'}
            </span>
            {isChanged && (
              <span className="text-[10px] text-amber-700 font-semibold mt-1">
                v{compareVersionId}: {baseVal ? formatDate(baseVal) : 'None'}
              </span>
            )}
          </div>
        )}
      </td>
    );
  };

  // Risks State Helpers
  const handleAddRisk = () => {
    const newRisk: RiskItem = {
      id: `risk-${Date.now()}`,
      risk: '',
      owner: '',
      eta: ''
    };
    setEditedProject({
      ...editedProject,
      risks: [...(editedProject.risks || []), newRisk]
    });
  };

  const handleUpdateRisk = (id: string, field: keyof RiskItem, value: string) => {
    const updated = (editedProject.risks || []).map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setEditedProject({
      ...editedProject,
      risks: updated
    });
  };

  const handleDeleteRisk = (id: string) => {
    const filtered = (editedProject.risks || []).filter(r => r.id !== id);
    setEditedProject({
      ...editedProject,
      risks: filtered
    });
  };

  // Delays State Helpers
  const handleAddDelay = () => {
    const newDelay: DelayItem = {
      id: `delay-${Date.now()}`,
      reason: '',
      owner: '',
      impactedWeek: ''
    };
    setEditedProject({
      ...editedProject,
      delays: [...(editedProject.delays || []), newDelay]
    });
  };

  const handleUpdateDelay = (id: string, field: keyof DelayItem, value: string) => {
    const updated = (editedProject.delays || []).map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    });
    setEditedProject({
      ...editedProject,
      delays: updated
    });
  };

  const handleDeleteDelay = (id: string) => {
    const filtered = (editedProject.delays || []).filter(d => d.id !== id);
    setEditedProject({
      ...editedProject,
      delays: filtered
    });
  };

  const isRoundTabEnabled = (rounds: ApprovalRound[], roundId: string) => {
    if (roundId === '1') return true;
    if (roundId === '2') {
      const r1 = rounds.find(r => r.id === '1');
      return r1?.status === 'Approved' && !!r1.assignedTo;
    }
    if (roundId === '3') {
      const r1 = rounds.find(r => r.id === '1');
      const r2 = rounds.find(r => r.id === '2');
      return r1?.status === 'Approved' && r2?.status === 'Approved' && !!r2.assignedTo;
    }
    return false;
  };

  const handleApprovalRoundChange = (
    docKey: 'urd' | 'brd' | 'fsd',
    roundId: string,
    field: keyof ApprovalRound,
    value: any
  ) => {
    const updatedDocs = { ...editedProject.requirements };
    const doc = updatedDocs[docKey];
    
    // Ensure approvalRounds exists
    const rounds = doc.approvalRounds ? [...doc.approvalRounds] : [
      { id: '1', assignedTo: '', status: 'Pending', approvedOn: '' },
      { id: '2', assignedTo: '', status: 'Pending', approvedOn: '' },
      { id: '3', assignedTo: '', status: 'Pending', approvedOn: '' }
    ];

    const updatedRounds = rounds.map((round) => {
      if (round.id === roundId) {
        const updatedRound = { ...round, [field]: value };
        if (field === 'status' && value === 'Approved' && !updatedRound.approvedOn) {
          updatedRound.approvedOn = new Date().toISOString().split('T')[0];
        }
        if (field === 'status' && value === 'Pending') {
          updatedRound.approvedOn = '';
        }
        return updatedRound;
      }
      return round;
    });

    updatedDocs[docKey] = {
      ...doc,
      approvalRounds: updatedRounds
    };

    // Sync signedOffStatus and signedOffOn with overall approval status
    const allApproved = updatedRounds.every(r => r.status === 'Approved' && !!r.assignedTo);
    if (allApproved) {
      updatedDocs[docKey].signedOffStatus = 'Signed Off';
      const latestDate = updatedRounds.reduce((latest, r) => {
        if (!r.approvedOn) return latest;
        if (!latest) return r.approvedOn;
        return r.approvedOn > latest ? r.approvedOn : latest;
      }, '');
      updatedDocs[docKey].signedOffOn = latestDate || new Date().toISOString().split('T')[0];
    } else {
      updatedDocs[docKey].signedOffStatus = 'Pending';
      updatedDocs[docKey].signedOffOn = '';
    }

    // Recalculate Requirements Phase completeness
    const urdComplete = updatedDocs.urd.signedOffStatus === 'Signed Off' && !!updatedDocs.urd.signedOffOn;
    const brdComplete = updatedDocs.brd.signedOffStatus === 'Signed Off' && !!updatedDocs.brd.signedOffOn;
    const fsdComplete = updatedDocs.fsd.signedOffStatus === 'Signed Off' && !!updatedDocs.fsd.signedOffOn;

    updatedDocs.isCompleted = urdComplete && brdComplete && fsdComplete;

    setEditedProject({
      ...editedProject,
      requirements: updatedDocs
    });
  };

  // Character Limit validation
  const handleDescriptionChange = (val: string) => {
    if (val.length <= 4000) {
      setEditedProject({ ...editedProject, description: val });
      setValidationError('');
    } else {
      setValidationError('Description cannot exceed 4000 characters.');
    }
  };

  // 2. Requirements Phase State management
  const handleDocChange = (docKey: 'urd' | 'brd' | 'fsd', field: keyof RequirementDocument, value: any) => {
    const updatedDocs = { ...editedProject.requirements };
    updatedDocs[docKey] = { ...updatedDocs[docKey], [field]: value };

    // Auto calculate if signedOffStatus matches signedOffOn date
    if (field === 'signedOffOn') {
      if (value) {
        updatedDocs[docKey].signedOffStatus = 'Signed Off';
      } else {
        updatedDocs[docKey].signedOffStatus = 'Pending';
      }
    }

    // Check if Requirements Phase is completed: all URD, BRD, FSD must be 'Signed Off'
    const urdComplete = updatedDocs.urd.signedOffStatus === 'Signed Off' && !!updatedDocs.urd.signedOffOn;
    const brdComplete = updatedDocs.brd.signedOffStatus === 'Signed Off' && !!updatedDocs.brd.signedOffOn;
    const fsdComplete = updatedDocs.fsd.signedOffStatus === 'Signed Off' && !!updatedDocs.fsd.signedOffOn;

    const isCompleted = urdComplete && brdComplete && fsdComplete;
    updatedDocs.isCompleted = isCompleted;

    const tempProj = {
      ...editedProject,
      requirements: updatedDocs
    };
    tempProj.tasks = syncRequirementsTask(tempProj);

    setEditedProject(tempProj);
  };

  // Requirements Doc File Drag and Drop mock uploader
  const handleDocDrop = (e: React.DragEvent, docKey: 'urd' | 'brd' | 'fsd') => {
    e.preventDefault();
    setDragOverDoc(null);
    if (!hasEditAccess) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fileName = files[0].name;
      const updatedDocs = { ...editedProject.requirements };
      const currentAttachments = updatedDocs[docKey].attachments || [];
      
      updatedDocs[docKey] = {
        ...updatedDocs[docKey],
        attachments: [...currentAttachments, fileName]
      };

      setEditedProject({ ...editedProject, requirements: updatedDocs });
    }
  };

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docKey: 'urd' | 'brd' | 'fsd') => {
    if (!hasEditAccess) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      const updatedDocs = { ...editedProject.requirements };
      const currentAttachments = updatedDocs[docKey].attachments || [];

      updatedDocs[docKey] = {
        ...updatedDocs[docKey],
        attachments: [...currentAttachments, fileName]
      };

      setEditedProject({ ...editedProject, requirements: updatedDocs });
    }
  };

  const removeDocAttachment = (docKey: 'urd' | 'brd' | 'fsd', attachmentName: string) => {
    if (!hasEditAccess) return;
    const updatedDocs = { ...editedProject.requirements };
    updatedDocs[docKey].attachments = updatedDocs[docKey].attachments.filter(name => name !== attachmentName);
    setEditedProject({ ...editedProject, requirements: updatedDocs });
  };


  // 3. Phase Editing (Development and Custom phases)
  const handlePhaseChange = (phaseId: string, field: keyof PhaseDetails, value: any) => {
    // If updating development phase
    if (phaseId === editedProject.developmentPhase.id) {
      const updatedDev = { ...editedProject.developmentPhase, [field]: value };
      
      // Auto-update overall project RAG status & delivery date when development phase is updated
      const updatedProj = {
        ...editedProject,
        developmentPhase: updatedDev,
      };

      if (field === 'ragStatus') {
        updatedProj.ragStatus = value as RagStatus;
      }
      if (field === 'productionDate') {
        updatedProj.deliveryDate = value;
      }

      setEditedProject(updatedProj);
    } else {
      // If updating a custom phase
      const updatedCustom = editedProject.customPhases.map(cp => {
        if (cp.id === phaseId) {
          const updatedPhase = { ...cp, [field]: value };
          return updatedPhase;
        }
        return cp;
      });

      // Recalculate deliveryDate if custom phase productionDate changed and is later
      let deliveryDate = editedProject.deliveryDate;
      if (field === 'productionDate' && value) {
        deliveryDate = value; // Default latest custom phase date
      }

      setEditedProject({
        ...editedProject,
        customPhases: updatedCustom,
        deliveryDate: deliveryDate
      });
    }
  };

  // Phase File Drag and Drop mock uploader
  const handlePhaseDrop = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault();
    setDragOverPhase(null);
    if (!hasEditAccess) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fileName = files[0].name;
      addPhaseAttachment(phaseId, fileName);
    }
  };

  const handlePhaseFileSelect = (e: React.ChangeEvent<HTMLInputElement>, phaseId: string) => {
    if (!hasEditAccess) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      addPhaseAttachment(phaseId, fileName);
    }
  };

  const addPhaseAttachment = (phaseId: string, fileName: string) => {
    if (phaseId === editedProject.developmentPhase.id) {
      const currentAttachments = editedProject.developmentPhase.attachments || [];
      setEditedProject({
        ...editedProject,
        developmentPhase: {
          ...editedProject.developmentPhase,
          attachments: [...currentAttachments, fileName]
        }
      });
    } else {
      const updatedCustom = editedProject.customPhases.map(cp => {
        if (cp.id === phaseId) {
          const currentAttachments = cp.attachments || [];
          return { ...cp, attachments: [...currentAttachments, fileName] };
        }
        return cp;
      });
      setEditedProject({ ...editedProject, customPhases: updatedCustom });
    }
  };

  const removePhaseAttachment = (phaseId: string, attachmentName: string) => {
    if (!hasEditAccess) return;
    if (phaseId === editedProject.developmentPhase.id) {
      const filtered = editedProject.developmentPhase.attachments.filter(name => name !== attachmentName);
      setEditedProject({
        ...editedProject,
        developmentPhase: { ...editedProject.developmentPhase, attachments: filtered }
      });
    } else {
      const updatedCustom = editedProject.customPhases.map(cp => {
        if (cp.id === phaseId) {
          const filtered = cp.attachments.filter(name => name !== attachmentName);
          return { ...cp, attachments: filtered };
        }
        return cp;
      });
      setEditedProject({ ...editedProject, customPhases: updatedCustom });
    }
  };


  // 4. Dynamic Phase Creation & Deletion
  const handleAddCustomPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) return;

    const nextPhaseId = `cust-${editedProject.id}-${Date.now()}`;
    const newPhase: PhaseDetails = {
      id: nextPhaseId,
      name: newPhaseName.trim(),
      ragStatus: 'Green',
      jiraId: '',
      description: 'Custom milestone phase scope and execution tracking.',
      devCompletionDate: '',
      sitCompletionDate: '',
      uatCompletionDate: '',
      productionDate: '',
      attachments: [],
      isCustom: true
    };

    setCustomExpanded(prev => ({ ...prev, [nextPhaseId]: true }));
    setEditedProject({
      ...editedProject,
      customPhases: [...editedProject.customPhases, newPhase]
    });
    setNewPhaseName('');
    setShowAddPhaseInput(false);
  };

  const handleDeleteCustomPhase = (phaseId: string) => {
    if (!confirm('Are you sure you want to remove this custom phase? This action cannot be undone.')) return;
    const filtered = editedProject.customPhases.filter(cp => cp.id !== phaseId);
    setEditedProject({
      ...editedProject,
      customPhases: filtered
    });
  };


  // --- Date Change Log Handlers ---
  const interceptTaskDateChange = (
    type: 'task' | 'subtask' | 'nested',
    taskId: string,
    field: 'startDate' | 'finishDate',
    newValue: string,
    subTaskId?: string,
    nestedSubTaskId?: string
  ) => {
    let oldValue = '';
    let taskName = '';

    if (type === 'task') {
      const task = (editedProject.tasks || []).find(t => t.id === taskId);
      if (task) {
        oldValue = task[field] || '';
        taskName = task.name;
      }
    } else if (type === 'subtask') {
      const task = (editedProject.tasks || []).find(t => t.id === taskId);
      const sub = (task?.subTasks || []).find(s => s.id === subTaskId);
      if (sub) {
        oldValue = sub[field] || '';
        taskName = `${task?.name} > ${sub.name}`;
      }
    } else if (type === 'nested') {
      const task = (editedProject.tasks || []).find(t => t.id === taskId);
      const sub = (task?.subTasks || []).find(s => s.id === subTaskId);
      const nested = (sub?.subTasks || []).find(n => n.id === nestedSubTaskId);
      if (nested) {
        oldValue = nested[field] || '';
        taskName = `${task?.name} > ${sub?.name} > ${nested.name}`;
      }
    }

    if (oldValue === newValue) return;

    // First-time entry: if there is no existing (baseline) date, set it
    // directly without requiring a change justification. The reason/attachment
    // modal only applies when CHANGING an already-set date.
    // Both the value and its baseline (original*Date) are set in a single
    // state update so neither overwrites the other.
    if (!oldValue) {
      const originalField = field === 'startDate' ? 'originalStartDate' : 'originalFinishDate';
      const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : [];
      const updatedTasks = tasksCopy.map((t) => {
        if (t.id !== taskId) return t;
        if (type === 'task') {
          return { ...t, [field]: newValue, [originalField]: newValue };
        }
        const updatedSubs = (t.subTasks || []).map((s) => {
          if (s.id !== subTaskId) return s;
          if (type === 'subtask') {
            return { ...s, [field]: newValue, [originalField]: newValue };
          }
          const updatedNesteds = (s.subTasks || []).map((n) =>
            n.id === nestedSubTaskId ? { ...n, [field]: newValue, [originalField]: newValue } : n
          );
          return { ...s, subTasks: updatedNesteds };
        });
        return { ...t, subTasks: updatedSubs };
      });
      setEditedProject({ ...editedProject, tasks: updatedTasks });
      return;
    }

    setPendingDateChange({
      type,
      taskId,
      subTaskId,
      nestedSubTaskId,
      taskName,
      field,
      oldValue,
      newValue
    });
    setDateChangeReason('');
    setDateChangeAttachments([]);
  };

  const confirmDateChange = () => {
    if (!pendingDateChange) return;
    if (!dateChangeReason.trim()) {
      alert('Please provide a reason for the date change.');
      return;
    }

    const { type, taskId, subTaskId, nestedSubTaskId, field, oldValue, newValue, taskName } = pendingDateChange;

    const newLogEntry: DateChangeLog = {
      id: `log-${Date.now()}`,
      taskName,
      field,
      oldValue: oldValue || 'Not Set',
      newValue: newValue || 'Not Set',
      timestamp: new Date().toISOString(),
      reason: dateChangeReason.trim(),
      attachments: dateChangeAttachments,
      updatedBy: currentUserName || 'System'
    };

    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : [];
    let updatedTasks = [...tasksCopy];

    if (type === 'task') {
      updatedTasks = tasksCopy.map((t) => {
        if (t.id === taskId) {
          return { ...t, [field]: newValue };
        }
        return t;
      });
    } else if (type === 'subtask') {
      updatedTasks = tasksCopy.map((t) => {
        if (t.id === taskId) {
          const updatedSubs = (t.subTasks || []).map((s) => {
            if (s.id === subTaskId) {
              return { ...s, [field]: newValue };
            }
            return s;
          });
          return { ...t, subTasks: updatedSubs };
        }
        return t;
      });
    } else if (type === 'nested') {
      updatedTasks = tasksCopy.map((t) => {
        if (t.id === taskId) {
          const updatedSubs = (t.subTasks || []).map((s) => {
            if (s.id === subTaskId) {
              const updatedNesteds = (s.subTasks || []).map((n) => {
                if (n.id === nestedSubTaskId) {
                  return { ...n, [field]: newValue };
                }
                return n;
              });
              return { ...s, subTasks: updatedNesteds };
            }
            return s;
          });
          return { ...t, subTasks: updatedSubs };
        }
        return t;
      });
    }

    const currentLogs = editedProject.dateChangeLogs || [];
    setEditedProject({
      ...editedProject,
      tasks: updatedTasks,
      dateChangeLogs: [...currentLogs, newLogEntry]
    });

    setPendingDateChange(null);
  };

  const handleDateChangeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      setDateChangeAttachments(prev => [...prev, fileName]);
    }
  };

  const removeDateChangeAttachment = (fileName: string) => {
    setDateChangeAttachments(prev => prev.filter(name => name !== fileName));
  };

  const addAttachmentToLog = (logId: string, fileName: string) => {
    const logs = editedProject.dateChangeLogs || [];
    const updatedLogs = logs.map(log => {
      if (log.id === logId) {
        const currentAtts = log.attachments || [];
        return { ...log, attachments: [...currentAtts, fileName] };
      }
      return log;
    });
    setEditedProject({
      ...editedProject,
      dateChangeLogs: updatedLogs
    });
  };

  const removeAttachmentFromLog = (logId: string, fileName: string) => {
    const logs = editedProject.dateChangeLogs || [];
    const updatedLogs = logs.map(log => {
      if (log.id === logId) {
        const currentAtts = log.attachments || [];
        return { ...log, attachments: currentAtts.filter(name => name !== fileName) };
      }
      return log;
    });
    setEditedProject({
      ...editedProject,
      dateChangeLogs: updatedLogs
    });
  };


  // --- Task Table Handlers ---
  const handleTaskChange = (taskId: string, field: string, value: any) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        return { ...task, [field]: value };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleSubTaskChange = (taskId: string, subTaskId: string, field: string, value: any) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        const updatedSubTasks = (task.subTasks || []).map((sub: SubTask) => {
          if (sub.id === subTaskId) {
            return { ...sub, [field]: value };
          }
          return sub;
        });
        return { ...task, subTasks: updatedSubTasks };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleAddSubTask = (taskId: string) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        const subCount = (task.subTasks || []).length + 1;
        const newSub: SubTask = {
          id: `sub_${taskId}_${Date.now()}`,
          name: `New Sub-task ${subCount}`,
          startDate: task.startDate || "2026-06-20",
          originalStartDate: task.startDate || "2026-06-20",
          finishDate: task.finishDate || "2026-06-25",
          originalFinishDate: task.finishDate || "2026-06-25",
          assignedTo: ""
        };
        return { ...task, subTasks: [...(task.subTasks || []), newSub] };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleDeleteSubTask = (taskId: string, subTaskId: string) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        return {
          ...task,
          subTasks: (task.subTasks || []).filter((sub: SubTask) => sub.id !== subTaskId)
        };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleAddNestedSubTask = (taskId: string, parentSubTaskId: string) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        const updatedSubTasks = (task.subTasks || []).map((sub: SubTask) => {
          if (sub.id === parentSubTaskId) {
            const nestedCount = (sub.subTasks || []).length + 1;
            const newNested: SubTask = {
              id: `nested_${parentSubTaskId}_${Date.now()}`,
              name: `New Nested Sub-task ${nestedCount}`,
              startDate: sub.startDate || task.startDate || "2026-06-20",
              originalStartDate: sub.startDate || task.startDate || "2026-06-20",
              finishDate: sub.finishDate || task.finishDate || "2026-06-25",
              originalFinishDate: sub.finishDate || task.finishDate || "2026-06-25",
              assignedTo: ""
            };
            return { ...sub, subTasks: [...(sub.subTasks || []), newNested] };
          }
          return sub;
        });
        return { ...task, subTasks: updatedSubTasks };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleNestedSubTaskChange = (taskId: string, parentSubTaskId: string, nestedSubTaskId: string, field: string, value: any) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        const updatedSubTasks = (task.subTasks || []).map((sub: SubTask) => {
          if (sub.id === parentSubTaskId) {
            const updatedNested = (sub.subTasks || []).map((nested: SubTask) => {
              if (nested.id === nestedSubTaskId) {
                return { ...nested, [field]: value };
              }
              return nested;
            });
            return { ...sub, subTasks: updatedNested };
          }
          return sub;
        });
        return { ...task, subTasks: updatedSubTasks };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleDeleteNestedSubTask = (taskId: string, parentSubTaskId: string, nestedSubTaskId: string) => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const updatedTasks = tasksCopy.map((task: TaskItem) => {
      if (task.id === taskId) {
        const updatedSubTasks = (task.subTasks || []).map((sub: SubTask) => {
          if (sub.id === parentSubTaskId) {
            return {
              ...sub,
              subTasks: (sub.subTasks || []).filter((nested: SubTask) => nested.id !== nestedSubTaskId)
            };
          }
          return sub;
        });
        return { ...task, subTasks: updatedSubTasks };
      }
      return task;
    });
    setEditedProject({ ...editedProject, tasks: updatedTasks });
  };

  const handleAddTask = () => {
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const nextSNo = String(tasksCopy.length + 1);
    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      sNo: nextSNo,
      name: `Custom Task ${nextSNo}`,
      startDate: "2026-06-20",
      originalStartDate: "2026-06-20",
      finishDate: "2026-06-25",
      originalFinishDate: "2026-06-25",
      assignedTo: "",
      subTasks: []
    };
    setEditedProject({ ...editedProject, tasks: [...tasksCopy, newTask] });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to remove this task? This will also remove any of its sub-tasks.')) return;
    const tasksCopy = editedProject.tasks ? [...editedProject.tasks] : JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE));
    const filtered = tasksCopy.filter((task: TaskItem) => task.id !== taskId);
    // Re-index SNo
    const reindexed = filtered.map((t: TaskItem, idx: number) => ({
      ...t,
      sNo: String(idx + 1)
    }));
    setEditedProject({ ...editedProject, tasks: reindexed });
  };


  // 5. Submit Changes
  const handleSave = () => {
    if (editedProject.description.length > 4000) {
      setValidationError('Description exceeds 4000 characters limit.');
      return;
    }
    if (!editedProject.name.trim()) {
      setValidationError('Project name cannot be empty.');
      return;
    }

    // Capture timeline date versions automatically if changed
    const finalProject = createTimelineVersionIfNeeded(editedProject, currentUserName);
    finalProject.tasks = syncRequirementsTask(finalProject);

    onUpdateProject(finalProject);
    setEditedProject(finalProject);
    setSaveSuccess(true);
    setValidationError('');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helpers
  const getRagBadgeClass = (status: RagStatus) => {
    switch (status) {
      case 'Red': return 'bg-red-50 text-red-700 border border-red-200 font-bold';
      case 'Amber': return 'bg-amber-50 text-amber-700 border border-amber-200 font-bold';
      case 'Green': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    }
  };

  const isRequirementsCompleted = editedProject.requirements.isCompleted;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16" id="project-details-container">
      {/* Detail Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <EquitasIcon className="h-9 w-9 drop-shadow-xs" />
              <div className="h-6 w-[1px] bg-slate-200 hidden xs:block" />
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold hover:bg-slate-50 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                id="back-to-dashboard-btn"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
            </div>

            {/* Access Control Information Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${hasEditAccess ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {hasEditAccess ? (
                    <>
                      <Unlock className="h-3 w-3 text-blue-600" />
                      Authorized Edit Mode
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 text-red-500" />
                      View-only Mode (Restricted)
                    </>
                  )}
                </span>
              </div>

              {/* Individual Project Export Action Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                  id="export-project-report-btn"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Export Report
                  <ChevronDown className="h-3 w-3 animate-pulse" />
                </button>
                {isExportDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsExportDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Generate & Download
                      </div>
                      <button
                        onClick={() => {
                          setIsExportDropdownOpen(false);
                          const html = generateSingleProjectExcelReport(editedProject);
                          downloadExcel(html, `EquitasPM_Project_${editedProject.id}_Status_Report.xls`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Download Excel Report
                      </button>
                      <button
                        onClick={() => {
                          setIsExportDropdownOpen(false);
                          const html = generateSingleProjectWordReport(editedProject);
                          downloadWord(html, `EquitasPM_Project_${editedProject.id}_Status_Report.doc`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        Download Word Document
                      </button>
                      <button
                        onClick={() => {
                          setIsExportDropdownOpen(false);
                          const csv = generateSingleProjectCSV(editedProject);
                          downloadCSV(csv, `EquitasPM_Project_${editedProject.id}_Status_Report.csv`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <FileText className="h-4 w-4 text-slate-600" />
                        Download CSV Data
                      </button>
                      <button
                        onClick={() => {
                          setIsExportDropdownOpen(false);
                          const xml = generateSingleProjectMPP(editedProject);
                          downloadMPP(xml, `EquitasPM_Project_${editedProject.id}_Plan.xml`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        Export MS Project (MPP/XML)
                      </button>
                      {onTriggerPrint && (
                        <>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setIsExportDropdownOpen(false);
                              onTriggerPrint(editedProject.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          >
                            <Printer className="h-4 w-4 text-red-600" />
                            Print / Save to PDF
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {hasDeleteAccess && (
                <button
                  onClick={handleDeleteProjectClick}
                  disabled={isPendingDeletion}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all ${
                    isPendingDeletion
                      ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                  }`}
                  id="delete-project-navbar-btn"
                  title={isPendingDeletion ? 'Awaiting Super Admin approval' : 'Request deletion (requires Super Admin approval)'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isPendingDeletion ? 'Pending Approval' : 'Request Deletion'}
                </button>
              )}

              {hasEditAccess && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  id="save-changes-navbar-btn"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="details-main">
        {/* Pending deletion banner (maker-checker workflow) */}
        {isPendingDeletion && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-start gap-3" id="pending-deletion-alert">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Pending Deletion &mdash; awaiting Super Admin approval</p>
              <p className="text-xs mt-1">
                Requested by <strong>{project.deletionAudit?.requestedBy || 'Unknown'}</strong>
                {project.deletionAudit?.requestedOn && <> on {new Date(project.deletionAudit.requestedOn).toLocaleString()}</>}.
                {project.deletionAudit?.reason && <> Reason: &ldquo;{project.deletionAudit.reason}&rdquo;</>}
              </p>
              <p className="text-xs mt-1 italic">A Super Admin must approve this request from the Pending Approvals tab before the project is archived.</p>
            </div>
          </div>
        )}
        {/* Banner notices */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 animate-fade-in" id="save-success-alert">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Success! Project parameters and phase configurations saved securely.</span>
          </div>
        )}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2" id="validation-error-alert">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 1. Header Card - Meta details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm" id="project-header-card">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                  {editedProject.id}
                </span>
                {hasEditAccess ? (
                  <select
                    value={editedProject.ragStatus}
                    onChange={(e) => setEditedProject({ ...editedProject, ragStatus: e.target.value as any })}
                    className={`px-2 py-0.5 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${getRagBadgeClass(editedProject.ragStatus)}`}
                    id="project-rag-select-header"
                  >
                    <option value="Red" className="font-semibold text-red-700 bg-red-50">Red - At Risk</option>
                    <option value="Amber" className="font-semibold text-amber-700 bg-amber-50">Amber - Slight Delay</option>
                    <option value="Green" className="font-semibold text-emerald-700 bg-emerald-50">Green - On-Track</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRagBadgeClass(editedProject.ragStatus)}`}>
                    {editedProject.ragStatus === 'Red' ? 'Red - At Risk' : editedProject.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}
                  </span>
                )}
                {editedProject.methodology && (
                  <span className="bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-0.5 rounded text-xs font-extrabold font-mono uppercase tracking-wider">
                    {editedProject.methodology}
                  </span>
                )}
              </div>

              {hasEditAccess ? (
                <input
                  type="text"
                  value={editedProject.name}
                  onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                  className="mt-2 text-2xl font-bold bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              ) : (
                <h1 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">{editedProject.name}</h1>
              )}
            </div>

            {/* Severity and PM identifiers */}
            <div className="flex flex-row md:flex-col gap-2 md:items-end">
              <span className="text-xs text-slate-500">
                Delivery Goal: <strong className="text-slate-800 font-mono">{editedProject.deliveryDate || 'N/A'}</strong>
              </span>
              <span className="text-xs text-slate-500">
                Severity: <strong className="text-slate-800 font-mono uppercase">{editedProject.severity}</strong>
              </span>
            </div>
          </div>

          {/* Description Section with character limit validation feedback */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Project Scope & Description</label>
            {hasEditAccess ? (
              <div className="space-y-1">
                <textarea
                  rows={4}
                  maxLength={4000}
                  value={editedProject.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
                  placeholder="Insert project description (up to 4000 characters)"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
                  <span>Standard Corporate PM guidelines apply</span>
                  <span>{editedProject.description.length} / 4000 characters</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {editedProject.description}
              </p>
            )}
          </div>

          {/* Jira Link field & Methodology & Assigned Leaders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Jira Link / Workspace CR ID</span>
              {hasEditAccess ? (
                <input
                  type="text"
                  value={editedProject.jiraLink}
                  onChange={(e) => setEditedProject({ ...editedProject, jiraLink: e.target.value })}
                  className="bg-slate-50 text-xs text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:bg-white"
                  placeholder="https://jira.internal/..."
                />
              ) : (
                <a
                  href={editedProject.jiraLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono"
                >
                  <LinkIcon className="h-3 w-3" />
                  {editedProject.jiraLink}
                </a>
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Project Methodology</span>
              {hasEditAccess ? (
                <select
                  value={editedProject.methodology || 'Waterfall'}
                  onChange={(e) => setEditedProject({ ...editedProject, methodology: e.target.value as 'Waterfall' | 'Agile' | 'Hybrid' })}
                  className="bg-slate-50 text-xs font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Waterfall">Waterfall</option>
                  <option value="Agile">Agile</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1 rounded-full text-xs font-bold shadow-xs mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                  </span>
                  {editedProject.methodology || 'Waterfall'} Model
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Assigned Leaders</span>
              <div className="text-xs text-slate-700">
                Project Manager: <strong className="text-slate-900">{editedProject.pmName}</strong> <br className="hidden md:block" />Owner: <strong className="text-slate-900">{editedProject.applicationOwnerName}</strong>
              </div>
            </div>
          </div>

          {/* Key Stakeholders and Access Level breakdown */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Project Stakeholders Registry</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="stakeholders-list-display">
              {editedProject.stakeholders.map((s, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">{s.name}</span>
                    <span className="text-slate-500 font-mono text-[10px] uppercase block">{s.roleType}</span>
                    {s.department && (
                      <span className="text-slate-500 text-[10px] block">Dept: <span className="font-medium text-slate-700">{s.department}</span></span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-slate-400 block">ID: {s.employeeId}</span>
                    <span className={`text-[10px] font-semibold ${s.access === 'Edit' ? 'text-blue-600' : 'text-slate-500'}`}>
                      Access: {s.access}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Timeline & Version History Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm" id="project-timeline-version-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Schedule Baseline & Milestone Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                PM-managed target dates and actual achievements across all delivery phases. Version snapshots are saved automatically upon saving project parameters.
              </p>
            </div>
            
            {/* Version Comparison Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold text-slate-500">Compare with version:</label>
              <select
                value={compareVersionId}
                onChange={(e) => setCompareVersionId(e.target.value === 'none' ? 'none' : Number(e.target.value))}
                className="bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white font-bold"
              >
                <option value="none">None (No Highlights)</option>
                {(editedProject.timelineVersions || []).map(v => (
                  <option key={v.version} value={v.version}>
                    Version {v.version} ({formatDate(v.timestamp)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {/* Full-width Schedule table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider border-r border-slate-200">Phase / Milestone Item</th>
                    <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider border-r border-slate-200 text-center">Planned Start</th>
                    <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider border-r border-slate-200 text-center">Actual Start</th>
                    <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider border-r border-slate-200 text-center">Planned End</th>
                    <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Actual End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {TIMELINE_GRID_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-800 font-bold bg-slate-50/40 border-r border-slate-150 font-sans text-xs">
                        {row.phase}
                      </td>
                      {renderDateCell(row.plannedStartKey)}
                      {renderDateCell(row.actualStartKey)}
                      {renderDateCell(row.plannedEndKey)}
                      {renderDateCell(row.actualEndKey)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Schedule Version Log placed Underneath */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Schedule Version Log</span>
                <span className="text-[10px] text-slate-400 italic">Timeline baselines & revisions history</span>
              </div>
              
              {!(editedProject.timelineVersions || []).length ? (
                <p className="text-xs text-slate-500 italic">No schedule baselines logged yet. Save project details to capture the original baseline version.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {(editedProject.timelineVersions || []).slice().reverse().map((ver, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-xs text-xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            v{ver.version} Baseline
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(ver.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-normal text-[11px]">
                          {ver.changeSummary || 'No change summary provided'}
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-400 text-right pt-1.5 border-t border-slate-100 mt-2">
                        by {ver.updatedBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Change Justifications & Attachments */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  Date Change Justifications (Project Execution Tracking)
                </span>
                <span className="text-[10px] text-slate-400 italic">Audit trail of execution date alterations with supporting documents</span>
              </div>

              {!(editedProject.dateChangeLogs || []).length ? (
                <p className="text-xs text-slate-500 italic">No execution timeline date changes have been logged yet. Any date change made in the Project Execution Tracking section will prompt for a reason and attachments, which will be preserved here.</p>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {(editedProject.dateChangeLogs || []).slice().reverse().map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-[10px]">
                            {log.taskName}
                          </span>
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium font-mono">
                            {log.field === 'startDate' ? 'Start Date' : 'Finish Date'}: {formatDate(log.oldValue)} ➔ {formatDate(log.newValue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0 font-mono">
                          <span>{formatDate(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>by {log.updatedBy}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Alteration</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">{log.reason}</p>
                      </div>

                      {/* Supporting Attachments Option on the log itself */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supporting Attachments</span>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30 p-2 rounded-lg border border-slate-100">
                          {/* Attachment List */}
                          <div className="flex flex-wrap gap-1.5">
                            {!(log.attachments || []).length ? (
                              <span className="text-[11px] text-slate-400 italic">No attachments uploaded</span>
                            ) : (
                              (log.attachments || []).map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200"
                                >
                                  <Paperclip className="h-2.5 w-2.5" />
                                  <span className="truncate max-w-[120px]" title={name}>{name}</span>
                                  {hasEditAccess && (
                                    <button
                                      type="button"
                                      onClick={() => removeAttachmentFromLog(log.id, name)}
                                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                                      title="Remove attachment"
                                    >
                                      &times;
                                    </button>
                                  )}
                                </span>
                              ))
                            )}
                          </div>

                          {/* Upload directly to this log */}
                          {hasEditAccess && (
                            <label className="flex items-center gap-1 hover:bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all border border-slate-200 bg-white shrink-0 shadow-2xs">
                              <Upload className="h-3 w-3" />
                              Attach File
                              <input
                                type="file"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    addAttachmentToLog(log.id, files[0].name);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Risks & Delays Side-by-Side Tables Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm" id="project-risks-delays-card">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Risk Assessment & Delays Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Actively manage potential risks, mitigation strategies, and logged delays impacting delivery timelines.
            </p>
          </div>

          <div className="space-y-8">
            {/* Risks Table Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Project Risk Registry</span>
                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={handleAddRisk}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    Add Risk Row
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-2 font-semibold text-slate-500 text-center w-12 text-[10px] uppercase">S.No</th>
                      <th className="py-2 px-3 font-semibold text-slate-500 text-[10px] uppercase">Risk</th>
                      <th className="py-2 px-3 font-semibold text-slate-500 w-40 text-[10px] uppercase">Owner</th>
                      <th className="py-2 px-3 font-semibold text-slate-500 w-64 text-[10px] uppercase">ETA</th>
                      {hasEditAccess && <th className="py-2 px-2 text-center w-12 text-[10px] uppercase text-slate-500">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {!(editedProject.risks || []).length ? (
                      <tr>
                        <td colSpan={hasEditAccess ? 5 : 4} className="py-4 text-center text-slate-400 italic text-xs">
                          No active risks registered for this project.
                        </td>
                      </tr>
                    ) : (
                      (editedProject.risks || []).map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 align-top">
                          <td className="py-3 px-2 text-center font-bold text-slate-400 text-xs w-12">{idx + 1}</td>
                          <td className="py-3 px-3">
                            {hasEditAccess ? (
                              <div className="relative space-y-1">
                                <textarea
                                  value={r.risk}
                                  onChange={(e) => handleUpdateRisk(r.id, 'risk', e.target.value.slice(0, 300))}
                                  maxLength={300}
                                  placeholder="Describe the risk..."
                                  rows={2}
                                  className="bg-white text-xs border border-slate-200 rounded-lg p-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans resize-y min-h-[60px]"
                                />
                                <div className="flex justify-between items-center px-1">
                                  <span className="text-[9px] text-slate-400">Max 300 chars</span>
                                  <span className={`text-[10px] font-mono ${(r.risk || '').length >= 280 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                    {(r.risk || '').length}/300
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap shadow-sm min-w-[180px] break-words">
                                {r.risk || '—'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 w-40">
                            {hasEditAccess ? (
                              <input
                                type="text"
                                value={r.owner}
                                onChange={(e) => handleUpdateRisk(r.id, 'owner', e.target.value)}
                                placeholder="Owner..."
                                className="bg-white text-xs border border-slate-200 rounded px-2.5 py-1.5 w-full focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <span className="text-slate-700 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 inline-block">
                                {r.owner || '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 w-64">
                            {hasEditAccess ? (
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="date"
                                    value={r.eta && r.eta !== 'TBD' ? r.eta : ''}
                                    onChange={(e) => handleUpdateRisk(r.id, 'eta', e.target.value)}
                                    className="bg-white text-xs border border-slate-200 rounded px-2 py-1 flex-1 focus:outline-none focus:border-blue-500 font-mono h-[32px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRisk(r.id, 'eta', 'TBD')}
                                    className={`px-2.5 py-1 text-xs font-extrabold rounded border transition-all cursor-pointer h-[32px] ${
                                      r.eta === 'TBD'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                    }`}
                                    title="Set as To Be Decided"
                                  >
                                    TBD
                                  </button>
                                </div>
                                {r.eta ? (
                                  <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] text-slate-400">Selected:</span>
                                    <span className={`text-[10px] font-bold ${r.eta === 'TBD' ? 'text-indigo-600' : 'text-slate-700 font-mono'}`}>
                                      {r.eta}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic px-1">Not scheduled</span>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap shadow-sm font-semibold text-center w-full">
                                {r.eta || '—'}
                              </div>
                            )}
                          </td>
                          {hasEditAccess && (
                            <td className="py-3 px-2 text-center w-12">
                              <button
                                type="button"
                                onClick={() => handleDeleteRisk(r.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer mt-1"
                                title="Delete risk row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 my-2" />

            {/* Delays Table Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block font-sans">Project Delay Log</span>
                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={handleAddDelay}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    Add Delay Row
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-xl overflow-hidden table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-2 font-semibold text-slate-500 text-center w-12 text-[10px] uppercase">S.No</th>
                      <th className="py-2 px-3 font-semibold text-slate-500 text-[10px] uppercase">Delay Reason</th>
                      <th className="py-2 px-3 font-semibold text-slate-500 w-40 text-[10px] uppercase">Owner</th>
                      <th className="py-2 px-3 font-semibold text-slate-500 w-64 text-[10px] uppercase">Impacted Week</th>
                      {hasEditAccess && <th className="py-2 px-2 text-center w-12 text-[10px] uppercase text-slate-500">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {!(editedProject.delays || []).length ? (
                      <tr>
                        <td colSpan={hasEditAccess ? 5 : 4} className="py-4 text-center text-slate-400 italic text-xs">
                          No timeline delays logged for this track.
                        </td>
                      </tr>
                    ) : (
                      (editedProject.delays || []).map((d, idx) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 align-top">
                          <td className="py-3 px-2 text-center font-bold text-slate-400 text-xs w-12">{idx + 1}</td>
                          <td className="py-3 px-3">
                            {hasEditAccess ? (
                              <div className="relative space-y-1">
                                <textarea
                                  value={d.reason}
                                  onChange={(e) => handleUpdateDelay(d.id, 'reason', e.target.value.slice(0, 300))}
                                  maxLength={300}
                                  placeholder="Describe the delay reason..."
                                  rows={2}
                                  className="bg-white text-xs border border-slate-200 rounded-lg p-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans resize-y min-h-[60px]"
                                />
                                <div className="flex justify-between items-center px-1">
                                  <span className="text-[9px] text-slate-400">Max 300 chars</span>
                                  <span className={`text-[10px] font-mono ${(d.reason || '').length >= 280 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                    {(d.reason || '').length}/300
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap shadow-sm min-w-[180px] break-words">
                                {d.reason || '—'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 w-40">
                            {hasEditAccess ? (
                              <input
                                type="text"
                                value={d.owner}
                                onChange={(e) => handleUpdateDelay(d.id, 'owner', e.target.value)}
                                placeholder="Owner..."
                                className="bg-white text-xs border border-slate-200 rounded px-2.5 py-1.5 w-full focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <span className="text-slate-700 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 inline-block">
                                {d.owner || '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 w-64">
                            {hasEditAccess ? (
                              <input
                                type="text"
                                value={d.impactedWeek}
                                onChange={(e) => handleUpdateDelay(d.id, 'impactedWeek', e.target.value)}
                                placeholder="e.g. Week 14..."
                                className="bg-white text-xs border border-slate-200 rounded px-2.5 py-1.5 w-full focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <span className="text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block text-xs">
                                {d.impactedWeek || '—'}
                              </span>
                            )}
                          </td>
                          {hasEditAccess && (
                            <td className="py-3 px-2 text-center w-12">
                              <button
                                type="button"
                                onClick={() => handleDeleteDelay(d.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer mt-1"
                                title="Delete delay row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>


        {/* 2. Requirements Phase Section (Phase 1) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm" id="requirements-phase">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">1</div>
              {hasEditAccess ? (
                <input
                  type="text"
                  value={editedProject.requirementsPhaseTitle || 'Requirements Phase'}
                  onChange={(e) => setEditedProject({ ...editedProject, requirementsPhaseTitle: e.target.value })}
                  className="text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white px-2 py-0.5 rounded-lg transition-all w-64"
                  placeholder="Requirements Phase Title"
                  title="Click to rename this phase"
                />
              ) : (
                <h2 className="text-lg font-bold text-slate-900">{editedProject.requirementsPhaseTitle || 'Requirements Phase'}</h2>
              )}
            </div>
            {isRequirementsCompleted ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Phase Completed & Signed Off
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Sign-Off Pending (Blocks Phase 2)
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            All primary architectural specifications and business scopes must be defined, scheduled, and formally signed off by their owners. Marking all three documents as signed off unlocks development and delivery tracking capabilities.
          </p>

          <div className="space-y-4" id="requirement-documents-list">
            {(['urd', 'brd', 'fsd'] as const).map((docKey) => {
              const doc = editedProject.requirements[docKey];
              return (
                <div key={docKey} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-slate-800">{doc.name}</span>
                    </div>
                    
                    {/* Signed Off Checkbox */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-600">Signed Off:</label>
                      {hasEditAccess ? (
                        <select
                          value={doc.signedOffStatus}
                          onChange={(e) => handleDocChange(docKey, 'signedOffStatus', e.target.value)}
                          className={`text-xs px-2 py-1 bg-white border rounded focus:outline-none ${doc.signedOffStatus === 'Signed Off' ? 'text-emerald-700 border-emerald-300 bg-emerald-50 font-bold' : 'text-amber-700 border-amber-300 bg-amber-50 font-bold'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Signed Off">Signed Off</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${doc.signedOffStatus === 'Signed Off' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-amber-700 border-amber-200 bg-amber-50'}`}>
                          {doc.signedOffStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Released On Date picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Released On</label>
                      {hasEditAccess ? (
                        <input
                          type="date"
                          value={doc.preparedOn}
                          onChange={(e) => handleDocChange(docKey, 'preparedOn', e.target.value)}
                          className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none"
                        />
                      ) : (
                        <div className="text-xs text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                          {doc.preparedOn || 'Not Set'}
                        </div>
                      )}
                    </div>

                    {/* Signed Off On Date picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Signed Off On</label>
                      {hasEditAccess ? (
                        <input
                          type="date"
                          value={doc.signedOffOn}
                          onChange={(e) => handleDocChange(docKey, 'signedOffOn', e.target.value)}
                          className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none"
                        />
                      ) : (
                        <div className="text-xs text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                          {doc.signedOffOn || 'Not Signed'}
                        </div>
                      )}
                    </div>

                    {/* Jira Link */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jira Link</label>
                      {hasEditAccess ? (
                        <input
                          type="text"
                          value={doc.documentUrl}
                          onChange={(e) => handleDocChange(docKey, 'documentUrl', e.target.value)}
                          placeholder="https://jira.internal/browse/..."
                          className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full placeholder-slate-400 focus:outline-none"
                        />
                      ) : (
                        <div className="text-xs text-slate-700 bg-white p-1.5 rounded border border-slate-200 truncate">
                          {doc.documentUrl ? (
                            <a href={doc.documentUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline font-medium">
                              {doc.documentUrl}
                            </a>
                          ) : (
                            'No Jira Link'
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule & Assignment Section */}
                  <div className="border-t border-slate-200/60 pt-3">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Schedule & Assignment</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                      {/* Start Date */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Start Date</label>
                        {hasEditAccess ? (
                          <input
                            type="date"
                            value={doc.startDate || ''}
                            onChange={(e) => handleDocChange(docKey, 'startDate', e.target.value)}
                            className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none"
                          />
                        ) : (
                          <div className="text-xs text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                            {doc.startDate ? formatDate(doc.startDate) : 'Not Set'}
                          </div>
                        )}
                      </div>

                      {/* Actual Start Date */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Actual Start Date</label>
                        {hasEditAccess ? (
                          <input
                            type="date"
                            value={doc.actualStartDate || ''}
                            onChange={(e) => handleDocChange(docKey, 'actualStartDate', e.target.value)}
                            className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none"
                          />
                        ) : (
                          <div className="text-xs text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                            {doc.actualStartDate ? formatDate(doc.actualStartDate) : 'Not Set'}
                          </div>
                        )}
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">End Date</label>
                        {hasEditAccess ? (
                          <input
                            type="date"
                            value={doc.endDate || ''}
                            onChange={(e) => handleDocChange(docKey, 'endDate', e.target.value)}
                            className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none"
                          />
                        ) : (
                          <div className="text-xs text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                            {doc.endDate ? formatDate(doc.endDate) : 'Not Set'}
                          </div>
                        )}
                      </div>

                      {/* Actual End Date */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Actual End Date</label>
                        {hasEditAccess ? (
                          <input
                            type="date"
                            value={doc.actualEndDate || ''}
                            onChange={(e) => handleDocChange(docKey, 'actualEndDate', e.target.value)}
                            className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none"
                          />
                        ) : (
                          <div className="text-xs text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                            {doc.actualEndDate ? formatDate(doc.actualEndDate) : 'Not Set'}
                          </div>
                        )}
                      </div>

                      {/* Assigned To */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Overall Owner</label>
                        {hasEditAccess ? (
                          <input
                            type="text"
                            value={doc.assignedTo || ''}
                            onChange={(e) => handleDocChange(docKey, 'assignedTo', e.target.value)}
                            placeholder="Owner name..."
                            className="bg-white text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none placeholder-slate-400"
                          />
                        ) : (
                          <div className="text-xs text-slate-700 bg-white p-1.5 rounded border border-slate-200 truncate">
                            {doc.assignedTo || 'Unassigned'}
                          </div>
                        )}
                      </div>

                      {/* Efforts (in hours, numbers only) */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Efforts (Hrs)</label>
                        {hasEditAccess ? (
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={doc.efforts || ''}
                              onChange={(e) => handleDocChange(docKey, 'efforts', e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="e.g. 1"
                              className="bg-white text-xs text-slate-900 border border-slate-200 rounded pl-2 pr-7 py-1 w-full focus:outline-none placeholder-slate-400"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">hr</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-700 bg-white p-1.5 rounded border border-slate-200 truncate">
                            {doc.efforts ? `${doc.efforts} hr` : '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drag-and-Drop Mock Document Uploader (Approval Emails, etc.) */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-200/60">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase">Approval Email Attachments</span>
                    
                    {hasEditAccess && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOverDoc(`${docKey}`); }}
                        onDragLeave={() => setDragOverDoc(null)}
                        onDrop={(e) => handleDocDrop(e, docKey)}
                        className={`border border-dashed rounded-lg p-4 text-center transition-all ${dragOverDoc === docKey ? 'border-blue-400 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                      >
                        <Upload className="h-5 w-5 mx-auto text-slate-500 mb-1" />
                        <p className="text-xs text-slate-600">Drag & Drop approval email or file here, or</p>
                        <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline mt-1 inline-block">
                          browse local files
                          <input
                             type="file"
                             onChange={(e) => handleDocFileSelect(e, docKey)}
                             className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* Attachment chips */}
                    {doc.attachments && doc.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {doc.attachments.map((name, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md text-xs text-slate-700 border border-slate-200 shadow-sm">
                            <span className="truncate max-w-[200px]" title={name}>{name}</span>
                            {hasEditAccess && (
                              <button
                                type="button"
                                onClick={() => removeDocAttachment(docKey, name)}
                                className="text-red-500 hover:text-red-700 ml-1 cursor-pointer font-bold"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* 3. Project Execution & Timeline Tracking Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm" id="project-execution-tracking-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">2</div>
                <h2 className="text-lg font-bold text-slate-900">Project Execution Tracking</h2>
              </div>
              <p className="text-xs text-slate-500">
                Manage execution deliverables, schedules, and assignments. Modified dates are automatically highlighted.
              </p>
            </div>
            {hasEditAccess && (
              <button
                type="button"
                onClick={handleAddTask}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Execution Task
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="min-w-full divide-y divide-slate-200 table-auto text-slate-800">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 py-3 w-16 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">S.No</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[320px]">Task Name</th>
                  <th scope="col" className="px-3 py-3 w-28 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-3 py-3 w-40 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</th>
                  <th scope="col" className="px-3 py-3 w-40 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Finish Date</th>
                  <th scope="col" className="px-4 py-3 w-56 min-w-[180px] text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assign To</th>
                  <th scope="col" className="px-3 py-3 w-32 min-w-[110px] text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Efforts</th>
                  <th scope="col" className="px-3 py-3 w-24 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white">
                {(editedProject.tasks || []).map((task) => {
                  const duration = calculateDuration(task.startDate, task.finishDate);
                  const isStartChanged = isDateChanged(task.startDate, task.originalStartDate);
                  const isFinishChanged = isDateChanged(task.finishDate, task.originalFinishDate);

                  return (
                    <React.Fragment key={task.id}>
                      {/* Parent Task Row */}
                      <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                        {/* SNo */}
                        <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-700">
                          {task.sNo}
                        </td>
                        {/* Task Name */}
                        <td className="px-4 py-2.5 text-sm font-semibold text-slate-900 min-w-[320px]">
                          {task.id === 'task_requirements' ? (
                            <div className="flex items-center gap-2 px-2 py-1">
                              <span className="text-slate-900 font-bold">{task.name}</span>
                              <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider">Automated</span>
                            </div>
                          ) : hasEditAccess ? (
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 w-full text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-xs"
                              placeholder="Task name..."
                            />
                          ) : (
                            <span className="px-2 py-1 block">{task.name}</span>
                          )}
                        </td>
                        {/* Duration */}
                        <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px]">
                            {duration > 0 ? `${duration} d` : '0 d'}
                          </span>
                        </td>
                        {/* Start Date */}
                        <td className="px-3 py-2.5 text-xs text-left">
                          <div className="flex flex-col gap-0.5">
                            {task.id === 'task_requirements' ? (
                              <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-600 font-mono text-xs select-none">
                                {task.startDate ? formatDate(task.startDate) : 'Not Set'}
                              </div>
                            ) : hasEditAccess ? (
                              <input
                                type="date"
                                value={task.startDate}
                                onChange={(e) => interceptTaskDateChange('task', task.id, 'startDate', e.target.value)}
                                className={`text-xs rounded border px-2 py-1 focus:outline-none transition-all ${
                                  isStartChanged
                                    ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-500 focus:border-amber-400 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500 focus:border-blue-500'
                                 }`}
                              />
                            ) : (
                              <span className={`px-2 py-1 rounded block ${isStartChanged ? 'bg-amber-50 text-amber-800 font-semibold' : ''}`}>
                                {task.startDate ? formatDate(task.startDate) : 'Not Set'}
                              </span>
                            )}
                            {task.id !== 'task_requirements' && isStartChanged && (
                              <span className="text-[9px] text-amber-600 font-medium px-1 flex items-center gap-1 font-mono">
                                ⚠️ Baseline: {formatDate(task.originalStartDate)}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Finish Date */}
                        <td className="px-3 py-2.5 text-xs text-left">
                          <div className="flex flex-col gap-0.5">
                            {task.id === 'task_requirements' ? (
                              <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-600 font-mono text-xs select-none">
                                {task.finishDate ? formatDate(task.finishDate) : 'Not Set'}
                              </div>
                            ) : hasEditAccess ? (
                              <input
                                type="date"
                                value={task.finishDate}
                                onChange={(e) => interceptTaskDateChange('task', task.id, 'finishDate', e.target.value)}
                                className={`text-xs rounded border px-2 py-1 focus:outline-none transition-all ${
                                  isFinishChanged
                                    ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-500 focus:border-amber-400 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                              />
                            ) : (
                              <span className={`px-2 py-1 rounded block ${isFinishChanged ? 'bg-amber-50 text-amber-800 font-semibold' : ''}`}>
                                {task.finishDate ? formatDate(task.finishDate) : 'Not Set'}
                              </span>
                            )}
                            {task.id !== 'task_requirements' && isFinishChanged && (
                              <span className="text-[9px] text-amber-600 font-medium px-1 flex items-center gap-1 font-mono">
                                ⚠️ Baseline: {formatDate(task.originalFinishDate)}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Assigned To */}
                        <td className="px-4 py-2.5 text-xs text-left min-w-[180px] w-56">
                          {hasEditAccess ? (
                            <input
                              type="text"
                              value={task.assignedTo}
                              onChange={(e) => handleTaskChange(task.id, 'assignedTo', e.target.value)}
                              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-xs"
                              placeholder="Assignee name..."
                            />
                          ) : (
                            <span className="px-2 py-1 block font-medium text-slate-700">{task.assignedTo || 'Unassigned'}</span>
                          )}
                        </td>
                        {/* Efforts (in hours, numbers only) */}
                        <td className="px-3 py-2.5 text-xs text-left min-w-[110px] w-32">
                          {task.id === 'task_requirements' ? (
                            <span className="px-2 py-1 block text-slate-500 font-mono text-[11px]">{task.efforts ? `${task.efforts} hr` : '—'}</span>
                          ) : hasEditAccess ? (
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                inputMode="numeric"
                                value={task.efforts || ''}
                                onChange={(e) => handleTaskChange(task.id, 'efforts', e.target.value.replace(/[^0-9]/g, ''))}
                                className="bg-white border border-slate-200 rounded pl-2.5 pr-8 py-1.5 w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-xs"
                                placeholder="e.g. 1"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">hr</span>
                            </div>
                          ) : (
                            <span className="px-2 py-1 block font-medium text-slate-700">{task.efforts ? `${task.efforts} hr` : '—'}</span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-2.5 text-center text-xs">
                          <div className="flex items-center justify-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                            {hasEditAccess && task.id !== 'task_requirements' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubTask(task.id)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                                  title="Add Sub-task"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                                  title="Remove Task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : hasEditAccess ? (
                              <span className="text-slate-400 p-1.5 flex items-center justify-center" title="Automated System Task (Unmodifiable)">
                                <Lock className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>

                      {/* Sub-Tasks Loop */}
                      {(task.subTasks || []).map((sub, idx) => {
                        const subDuration = calculateDuration(sub.startDate, sub.finishDate);
                        const isSubStartChanged = isDateChanged(sub.startDate, sub.originalStartDate);
                        const isSubFinishChanged = isDateChanged(sub.finishDate, sub.originalFinishDate);

                        return (
                          <React.Fragment key={sub.id}>
                            <tr className="bg-white hover:bg-slate-50/40 transition-colors group">
                              {/* Nested SNo */}
                              <td className="px-3 py-2 text-center text-[11px] font-mono text-slate-400">
                                {task.sNo}.{idx + 1}
                              </td>
                              {/* Nested Name */}
                              <td className="px-4 py-2 text-sm text-slate-800 font-normal pl-8 min-w-[320px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-300 font-mono text-xs select-none">└─</span>
                                  {task.id === 'task_requirements' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-800 bg-slate-50 px-2.5 py-1 rounded border border-slate-150">{sub.name}</span>
                                      <span className="text-[10px] text-slate-400 italic">(Syncs from Phase)</span>
                                    </div>
                                  ) : hasEditAccess ? (
                                    <input
                                      type="text"
                                      value={sub.name}
                                      onChange={(e) => handleSubTaskChange(task.id, sub.id, 'name', e.target.value)}
                                      className="bg-white border border-slate-200 rounded px-2 py-1 w-full text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-xs"
                                      placeholder="Sub-task name..."
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-700">{sub.name}</span>
                                  )}
                                </div>
                              </td>
                              {/* Nested Duration */}
                              <td className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                                <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded">
                                  {subDuration > 0 ? `${subDuration} d` : '0 d'}
                                </span>
                              </td>
                              {/* Nested Start Date */}
                              <td className="px-3 py-2 text-xs text-left">
                                <div className="flex flex-col gap-0.5">
                                  {task.id === 'task_requirements' ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 font-mono text-[11px] select-none">
                                      {sub.startDate ? formatDate(sub.startDate) : '—'}
                                    </div>
                                  ) : hasEditAccess ? (
                                    <input
                                      type="date"
                                      value={sub.startDate}
                                      onChange={(e) => interceptTaskDateChange('subtask', task.id, 'startDate', e.target.value, sub.id)}
                                      className={`text-[11px] rounded border px-1.5 py-0.5 focus:outline-none transition-all ${
                                        isSubStartChanged
                                          ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-400 focus:border-amber-400 font-medium'
                                          : 'bg-white border-slate-200 text-slate-700'
                                      }`}
                                    />
                                  ) : (
                                    <span className={`px-1.5 py-0.5 rounded text-xs block ${isSubStartChanged ? 'bg-amber-50 text-amber-800 font-medium' : ''}`}>
                                      {sub.startDate ? formatDate(sub.startDate) : 'Not Set'}
                                    </span>
                                  )}
                                  {task.id !== 'task_requirements' && isSubStartChanged && (
                                    <span className="text-[8px] text-amber-600 font-medium px-1 font-mono">
                                      Baseline: {formatDate(sub.originalStartDate)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* Nested Finish Date */}
                              <td className="px-3 py-2 text-xs text-left">
                                <div className="flex flex-col gap-0.5">
                                  {task.id === 'task_requirements' ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 font-mono text-[11px] select-none">
                                      {sub.finishDate ? formatDate(sub.finishDate) : '—'}
                                    </div>
                                  ) : hasEditAccess ? (
                                    <input
                                      type="date"
                                      value={sub.finishDate}
                                      onChange={(e) => interceptTaskDateChange('subtask', task.id, 'finishDate', e.target.value, sub.id)}
                                      className={`text-[11px] rounded border px-1.5 py-0.5 focus:outline-none transition-all ${
                                        isSubFinishChanged
                                          ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-400 focus:border-amber-400 font-medium'
                                          : 'bg-white border-slate-200 text-slate-700'
                                      }`}
                                    />
                                  ) : (
                                    <span className={`px-1.5 py-0.5 rounded text-xs block ${isSubFinishChanged ? 'bg-amber-50 text-amber-800 font-medium' : ''}`}>
                                      {sub.finishDate ? formatDate(sub.finishDate) : 'Not Set'}
                                    </span>
                                  )}
                                  {task.id !== 'task_requirements' && isSubFinishChanged && (
                                    <span className="text-[8px] text-amber-600 font-medium px-1 font-mono">
                                      Baseline: {formatDate(sub.originalFinishDate)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* Nested Assignee */}
                              <td className="px-4 py-2 text-xs text-left min-w-[180px] w-56">
                                {hasEditAccess ? (
                                  <input
                                    type="text"
                                    value={sub.assignedTo}
                                    onChange={(e) => handleSubTaskChange(task.id, sub.id, 'assignedTo', e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-2 py-1 w-full text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-xs"
                                    placeholder="Assignee name..."
                                  />
                                ) : (
                                  <span className="px-2 py-0.5 block text-xs text-slate-600">{sub.assignedTo || 'Unassigned'}</span>
                                )}
                              </td>
                              {/* Nested Efforts (in hours, numbers only) */}
                              <td className="px-3 py-2 text-xs text-left min-w-[110px] w-32">
                                {task.id === 'task_requirements' ? (
                                  <span className="px-2 py-0.5 block text-[11px] text-slate-500 font-mono">{sub.efforts ? `${sub.efforts} hr` : '—'}</span>
                                ) : hasEditAccess ? (
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      inputMode="numeric"
                                      value={sub.efforts || ''}
                                      onChange={(e) => handleSubTaskChange(task.id, sub.id, 'efforts', e.target.value.replace(/[^0-9]/g, ''))}
                                      className="bg-white border border-slate-200 rounded pl-2 pr-7 py-1 w-full text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-xs"
                                      placeholder="e.g. 1"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">hr</span>
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 block text-xs text-slate-600">{sub.efforts ? `${sub.efforts} hr` : '—'}</span>
                                )}
                              </td>
                              {/* Nested Actions */}
                              <td className="px-3 py-2 text-center text-xs">
                                {hasEditAccess && task.id !== 'task_requirements' ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAddNestedSubTask(task.id, sub.id)}
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                      title="Add Sub-task under this"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubTask(task.id, sub.id)}
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                      title="Remove Sub-task"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : hasEditAccess ? (
                                  <span className="text-slate-300 flex items-center justify-center animate-pulse" title="System Sub-task (Unmodifiable)">
                                    <Lock className="h-3 w-3" />
                                  </span>
                                ) : null}
                              </td>
                            </tr>

                            {/* Nested Sub-Tasks Loop */}
                            {(sub.subTasks || []).map((nested, nestedIdx) => {
                              const nestedDuration = calculateDuration(nested.startDate, nested.finishDate);
                              const isNestedStartChanged = isDateChanged(nested.startDate, nested.originalStartDate);
                              const isNestedFinishChanged = isDateChanged(nested.finishDate, nested.originalFinishDate);

                              return (
                                <tr key={nested.id} className="bg-slate-50/30 hover:bg-slate-50/70 transition-colors group">
                                  {/* Nested SNo */}
                                  <td className="px-3 py-1.5 text-center text-[10px] font-mono text-slate-400 pl-4">
                                    {task.sNo}.{idx + 1}.{nestedIdx + 1}
                                  </td>
                                  {/* Nested Name */}
                                  <td className="px-4 py-1.5 text-sm text-slate-800 font-normal pl-16 min-w-[320px]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-300 font-mono text-xs select-none">└─</span>
                                      <span className="text-slate-300 font-mono text-xs select-none">└─</span>
                                      {hasEditAccess ? (
                                        <input
                                          type="text"
                                          value={nested.name}
                                          onChange={(e) => handleNestedSubTaskChange(task.id, sub.id, nested.id, 'name', e.target.value)}
                                          className="bg-white border border-slate-200 rounded px-2 py-0.5 w-full text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-xs"
                                          placeholder="Nested Sub-task name..."
                                        />
                                      ) : (
                                        <span className="text-xs text-slate-600 italic">{nested.name}</span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Nested Duration */}
                                  <td className="px-3 py-1.5 text-center text-xs font-semibold text-slate-500">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                      {nestedDuration > 0 ? `${nestedDuration} d` : '0 d'}
                                    </span>
                                  </td>
                                  {/* Nested Start Date */}
                                  <td className="px-3 py-1.5 text-xs text-left">
                                    <div className="flex flex-col gap-0.5">
                                      {hasEditAccess ? (
                                        <input
                                          type="date"
                                          value={nested.startDate}
                                          onChange={(e) => interceptTaskDateChange('nested', task.id, 'startDate', e.target.value, sub.id, nested.id)}
                                          className={`text-[10px] rounded border px-1.5 py-0.5 focus:outline-none transition-all ${
                                            isNestedStartChanged
                                              ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-400 focus:border-amber-400 font-medium'
                                              : 'bg-white border-slate-200 text-slate-700'
                                          }`}
                                        />
                                      ) : (
                                        <span className={`px-1.5 py-0.5 rounded text-[11px] block ${isNestedStartChanged ? 'bg-amber-50 text-amber-800 font-medium' : ''}`}>
                                          {nested.startDate ? formatDate(nested.startDate) : 'Not Set'}
                                        </span>
                                      )}
                                      {isNestedStartChanged && (
                                        <span className="text-[7px] text-amber-600 font-medium px-1">
                                          Baseline: {formatDate(nested.originalStartDate)}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Nested Finish Date */}
                                  <td className="px-3 py-1.5 text-xs text-left">
                                    <div className="flex flex-col gap-0.5">
                                      {hasEditAccess ? (
                                        <input
                                          type="date"
                                          value={nested.finishDate}
                                          onChange={(e) => interceptTaskDateChange('nested', task.id, 'finishDate', e.target.value, sub.id, nested.id)}
                                          className={`text-[10px] rounded border px-1.5 py-0.5 focus:outline-none transition-all ${
                                            isNestedFinishChanged
                                              ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-amber-400 focus:border-amber-400 font-medium'
                                              : 'bg-white border-slate-200 text-slate-700'
                                          }`}
                                        />
                                      ) : (
                                        <span className={`px-1.5 py-0.5 rounded text-[11px] block ${isNestedFinishChanged ? 'bg-amber-50 text-amber-800 font-medium' : ''}`}>
                                          {nested.finishDate ? formatDate(nested.finishDate) : 'Not Set'}
                                        </span>
                                      )}
                                      {isNestedFinishChanged && (
                                        <span className="text-[7px] text-amber-600 font-medium px-1">
                                          Baseline: {formatDate(nested.originalFinishDate)}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Nested Assignee */}
                                  <td className="px-4 py-1.5 text-xs text-left min-w-[180px] w-56">
                                    {hasEditAccess ? (
                                      <input
                                        type="text"
                                        value={nested.assignedTo}
                                        onChange={(e) => handleNestedSubTaskChange(task.id, sub.id, nested.id, 'assignedTo', e.target.value)}
                                        className="bg-white border border-slate-200 rounded px-2 py-0.5 w-full text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-xs"
                                        placeholder="Assignee name..."
                                      />
                                    ) : (
                                      <span className="px-2 py-0.5 block text-xs text-slate-600">{nested.assignedTo || 'Unassigned'}</span>
                                    )}
                                  </td>
                                  {/* Nested Efforts (in hours, numbers only) */}
                                  <td className="px-3 py-1.5 text-xs text-left min-w-[110px] w-32">
                                    {hasEditAccess ? (
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          inputMode="numeric"
                                          value={nested.efforts || ''}
                                          onChange={(e) => handleNestedSubTaskChange(task.id, sub.id, nested.id, 'efforts', e.target.value.replace(/[^0-9]/g, ''))}
                                          className="bg-white border border-slate-200 rounded pl-2 pr-7 py-0.5 w-full text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-xs"
                                          placeholder="e.g. 1"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">hr</span>
                                      </div>
                                    ) : (
                                      <span className="px-2 py-0.5 block text-xs text-slate-600">{nested.efforts ? `${nested.efforts} hr` : '—'}</span>
                                    )}
                                  </td>
                                  {/* Nested Actions */}
                                  <td className="px-3 py-1.5 text-center text-xs">
                                    {hasEditAccess && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteNestedSubTask(task.id, sub.id, nested.id)}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title="Remove Nested Sub-task"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Governance & Danger Zone */}
        <div className="bg-red-50/50 rounded-2xl border border-red-200 p-6 space-y-4 shadow-sm mt-8" id="project-danger-zone-card">
          <div className="flex items-start gap-3">
            <Trash2 className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Project Governance & Danger Zone</h2>
              <p className="text-xs text-slate-500">
                Permanent actions regarding project tracking status, lifecycle archives, and overall record deletion.
              </p>
            </div>
          </div>

          <div className="border-t border-red-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-red-700 block">Delete Project Track</span>
              <p className="text-xs text-slate-500 max-w-xl">
                Once deleted, this project track ({project.id}) along with all its uploaded attachment proofs, Jira integrations, and active RAG status records will be permanently expunged. This action is restricted strictly to the Administrator (Vinoth).
              </p>
              <div className="text-[11px] text-slate-500 mt-2 font-mono">
                <span className="font-semibold text-slate-700">Authorized Administrator for Deletion:</span>{' '}
                Vinoth (admin / EMP0001)
              </div>
            </div>

            <div className="shrink-0">
              {hasDeleteAccess ? (
                <button
                  type="button"
                  onClick={handleDeleteProjectClick}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                  id="delete-project-danger-btn"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <button
                    disabled
                    type="button"
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-200 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 cursor-not-allowed"
                    id="delete-project-disabled-btn"
                    title="Only the Admin (Vinoth) is authorized to delete projects."
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Delete Restricted
                  </button>
                  <span className="text-[10px] text-red-600 font-medium font-sans">
                    *Requires Admin Login (Vinoth)
                  </span>
                </div>
              )}
            </div>
            {/* Date Change Justification Dialog Modal */}
            {pendingDateChange && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden transform transition-all animate-zoom-in">
                  {/* Header */}
                  <div className="bg-slate-50 border-b border-slate-150 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">Justification Required</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDateChange(null)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                      <span className="font-bold text-amber-900 block">Date Alteration Detected:</span>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Task Name:</span> {pendingDateChange.taskName}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Field Adjusted:</span>{' '}
                        {pendingDateChange.field === 'startDate' ? 'Start Date' : 'Finish Date'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                          {pendingDateChange.oldValue || 'Not Set'}
                        </span>
                        <span className="text-slate-400">➔</span>
                        <span className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-mono font-bold">
                          {pendingDateChange.newValue || 'Not Set'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Reason for Date Change <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={dateChangeReason}
                        onChange={(e) => setDateChangeReason(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                        placeholder="Explain why this timeline change is necessary (e.g. resource reallocation, client request, technical delay)..."
                      />
                    </div>

                    {/* Attachment Option */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Supporting Documentation (Optional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border border-slate-200 shadow-2xs">
                          <Upload className="h-3.5 w-3.5" />
                          Upload File
                          <input
                            type="file"
                            onChange={handleDateChangeFileSelect}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-slate-400 italic">Select relevant email, CR, or PDF</span>
                      </div>

                      {/* Uploaded Files Chips */}
                      {dateChangeAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100">
                          {dateChangeAttachments.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-lg border border-blue-200"
                            >
                              <Paperclip className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[150px]">{name}</span>
                              <button
                                type="button"
                                onClick={() => removeDateChangeAttachment(name)}
                                className="text-red-400 hover:text-red-600 font-bold ml-1 text-xs"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-slate-50 border-t border-slate-150 px-5 py-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingDateChange(null)}
                      className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-colors"
                    >
                      Cancel Change
                    </button>
                    <button
                      type="button"
                      onClick={confirmDateChange}
                      disabled={!dateChangeReason.trim()}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${
                        dateChangeReason.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Log Change
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
