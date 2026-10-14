import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { Project, Severity, Stakeholder, AccessRole, RagStatus } from '../types';
import { DEFAULT_TASKS_TEMPLATE } from '../initialData';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  nextProjectId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  nextProjectId,
  currentUserId,
  currentUserName
}: CreateProjectModalProps) {
  if (!isOpen) return null;

  // Form Fields
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('Medium');
  const [methodology, setMethodology] = useState<'Waterfall' | 'Agile' | 'Hybrid'>('Waterfall');
  const [jiraLink, setJiraLink] = useState('');

  // Dynamic Key Stakeholders state with pre-populated rows
  const [stakeholdersList, setStakeholdersList] = useState<{
    id: string;
    roleType: 'Project Manager' | 'Application Owner' | 'Application SPOC' | 'Business' | 'Project Owner' | 'Business Technology' | 'Additional Stakeholder';
    name: string;
    employeeId: string;
    department: string;
    access: AccessRole;
  }[]>([
    { id: 'sh-1', roleType: 'Project Manager', name: '', employeeId: '', department: '', access: 'Edit' },
    { id: 'sh-2', roleType: 'Application Owner', name: '', employeeId: '', department: '', access: 'Edit' },
    { id: 'sh-3', roleType: 'Application SPOC', name: '', employeeId: '', department: '', access: 'Edit' },
    { id: 'sh-4', roleType: 'Business', name: '', employeeId: '', department: '', access: 'View-only' }
  ]);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleAddStakeholder = () => {
    setStakeholdersList([
      ...stakeholdersList,
      {
        id: `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        roleType: 'Project Manager',
        name: '',
        employeeId: '',
        department: '',
        access: 'Edit',
      },
    ]);
  };

  const handleRemoveStakeholder = (id: string) => {
    setStakeholdersList(stakeholdersList.filter((st) => st.id !== id));
  };

  const handleStakeholderChange = (
    id: string,
    field: 'roleType' | 'name' | 'employeeId' | 'department' | 'access',
    value: any
  ) => {
    setStakeholdersList(
      stakeholdersList.map((st) => {
        if (st.id === id) {
          return { ...st, [field]: value };
        }
        return st;
      })
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 1. Core fields
    if (!projectName.trim()) {
      newErrors.projectName = 'Project Name is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Project Description is required.';
    } else if (description.length > 4000) {
      newErrors.description = `Description exceeds 4000 characters (current: ${description.length}).`;
    }

    // 2. Validate Stakeholders
    stakeholdersList.forEach((st, idx) => {
      const displayRole = st.roleType;
      if (!st.name.trim()) {
        newErrors[`st-name-${st.id}`] = `Stakeholder #${idx + 1} (${displayRole}) Name is required.`;
      }
      if (!st.employeeId.trim()) {
        newErrors[`st-emp-${st.id}`] = `Stakeholder #${idx + 1} (${displayRole}) Employee ID is required.`;
      }
      if (!st.department.trim()) {
        newErrors[`st-dept-${st.id}`] = `Stakeholder #${idx + 1} (${displayRole}) Department is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top of modal for errors
      const modalEl = document.getElementById('create-project-modal-content');
      if (modalEl) modalEl.scrollTop = 0;
      return;
    }

    // Build stakeholders array
    const finalStakeholders: Stakeholder[] = stakeholdersList.map(st => ({
      id: st.id,
      roleType: st.roleType,
      name: st.name.trim(),
      employeeId: st.employeeId.trim(),
      department: st.department.trim(),
      access: st.access
    }));

    const aoStakeholder = stakeholdersList.find(s => s.roleType === 'Application Owner');
    const applicationOwnerName = aoStakeholder ? aoStakeholder.name.trim() : '';

    // Build Project Object
    const newProject: Project = {
      id: nextProjectId,
      name: projectName.trim(),
      description: description.trim(),
      severity: severity,
      jiraLink: jiraLink.trim() || `https://jira.stratos.internal/browse/${nextProjectId}`,
      createdPMId: currentUserId,
      ragStatus: 'Red', // Default to Red on initial creation
      deliveryDate: '', // Set empty initially, will derive from dates
      applicationOwnerName: applicationOwnerName,
      pmName: currentUserName,
      stakeholders: finalStakeholders,
      requirements: {
        urd: {
          id: 'urd',
          name: 'User Requirements Document (URD)',
          preparedOn: '',
          signedOffOn: '',
          signedOffStatus: 'Pending',
          documentUrl: '',
          attachments: [],
          startDate: '',
          actualStartDate: '',
          endDate: '',
          actualEndDate: '',
          assignedTo: '',
          approvalRounds: [
            { id: '1', assignedTo: '', status: 'Pending', approvedOn: '' },
            { id: '2', assignedTo: '', status: 'Pending', approvedOn: '' },
            { id: '3', assignedTo: '', status: 'Pending', approvedOn: '' }
          ]
        },
        brd: {
          id: 'brd',
          name: 'Business Requirements Document (BRD)',
          preparedOn: '',
          signedOffOn: '',
          signedOffStatus: 'Pending',
          documentUrl: '',
          attachments: [],
          startDate: '',
          actualStartDate: '',
          endDate: '',
          actualEndDate: '',
          assignedTo: '',
          approvalRounds: [
            { id: '1', assignedTo: '', status: 'Pending', approvedOn: '' },
            { id: '2', assignedTo: '', status: 'Pending', approvedOn: '' },
            { id: '3', assignedTo: '', status: 'Pending', approvedOn: '' }
          ]
        },
        fsd: {
          id: 'fsd',
          name: 'Functional Specifications Document (FSD)',
          preparedOn: '',
          signedOffOn: '',
          signedOffStatus: 'Pending',
          documentUrl: '',
          attachments: [],
          startDate: '',
          actualStartDate: '',
          endDate: '',
          actualEndDate: '',
          assignedTo: '',
          approvalRounds: [
            { id: '1', assignedTo: '', status: 'Pending', approvedOn: '' },
            { id: '2', assignedTo: '', status: 'Pending', approvedOn: '' },
            { id: '3', assignedTo: '', status: 'Pending', approvedOn: '' }
          ]
        },
        isCompleted: false
      },
      developmentPhase: {
        id: `dev-${nextProjectId}`,
        name: 'Development Phase',
        ragStatus: 'Red',
        jiraId: '',
        description: 'Primary development, unit testing, and SIT phase.',
        devCompletionDate: '',
        sitCompletionDate: '',
        uatCompletionDate: '',
        productionDate: '',
        attachments: [],
        isCustom: false,
        isCollapsed: false,
        startDate: '',
        actualStartDate: '',
        endDate: '',
        actualEndDate: '',
        assignedTo: ''
      },
      customPhases: [],
      tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS_TEMPLATE)),
      requirementsPhaseTitle: 'Requirements Phase',
      developmentPhaseTitle: 'Development Phase',
      timelineDates: {
        projectKickOff: '',
        urdSignOff: '',
        plannedBrdStart: '',
        actualBrdStart: '',
        plannedBrdEnd: '',
        actualBrdEnd: '',
        plannedFsdStart: '',
        actualFsdStart: '',
        plannedFsdEnd: '',
        actualFsdEnd: '',
        plannedDevStart: '',
        actualDevStart: '',
        plannedDevEnd: '',
        actualDevEnd: '',
        plannedSitStart: '',
        actualSitStart: '',
        plannedSitEnd: '',
        actualSitEnd: '',
        plannedUatStart: '',
        actualUatStart: '',
        plannedUatEnd: '',
        actualUatEnd: '',
        plannedGoLive: '',
        actualGoLive: ''
      },
      timelineVersions: [],
      risks: [],
      delays: [],
      methodology: methodology
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans" id="create-modal-overlay">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]"
        id="create-project-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0" id="create-modal-header">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Project</h2>
              <p className="text-xs text-slate-500">Initiate a new project track with unique ID <span className="font-mono text-blue-600 font-semibold">{nextProjectId}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            id="close-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800">
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex gap-2" id="form-errors-banner">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">Please correct the following errors before submitting:</p>
                <ul className="list-disc pl-5 mt-1 text-xs space-y-1">
                  {Object.values(errors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Project Details Section */}
          <div className="space-y-4" id="section-project-details">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">Project Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Core Banking API Phase 1"
                  className={`bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 block w-full px-3 py-2 sm:text-sm border rounded-lg focus:bg-white ${errors.projectName ? 'border-red-500' : 'border-slate-200'}`}
                  id="input-project-name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Methodology *</label>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value as 'Waterfall' | 'Agile' | 'Hybrid')}
                  className="bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 block w-full px-3 py-2 sm:text-sm border border-slate-200 rounded-lg focus:bg-white cursor-pointer font-medium"
                  id="select-methodology"
                >
                  <option value="Waterfall">Waterfall</option>
                  <option value="Agile">Agile</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Severity *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 block w-full px-3 py-2 sm:text-sm border border-slate-200 rounded-lg focus:bg-white"
                  id="select-severity"
                >
                  <option value="Low">Low Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="High">High Severity</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-600">Project Description *</label>
                <span className={`text-[11px] font-mono ${description.length > 4000 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                  {description.length} / 4000 chars
                </span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed scope, impact analysis, migration parameters, and architecture dependencies..."
                className={`bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 block w-full px-3 py-2 sm:text-sm border rounded-lg resize-none focus:bg-white ${errors.description ? 'border-red-500' : 'border-slate-200'}`}
                id="input-description"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Jira Link / CR Jira ID</label>
              <input
                type="text"
                value={jiraLink}
                onChange={(e) => setJiraLink(e.target.value)}
                placeholder="e.g. https://jira.stratos.internal/browse/EP-XXXX"
                className="bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 block w-full px-3 py-2 sm:text-sm border border-slate-200 rounded-lg focus:bg-white"
                id="input-jira-link"
              />
            </div>
          </div>

          {/* Key Stakeholders Section */}
          <div className="space-y-4" id="section-stakeholders">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Key Stakeholders & Permissions</h3>
              <span className="text-[10px] text-slate-500 italic">Configure roles, departments, and edit access</span>
            </div>

            {stakeholdersList.map((st, idx) => (
              <div key={st.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                    Stakeholder #{idx + 1}: {st.roleType}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      Role Config
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStakeholder(st.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remove Stakeholder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* Role Type Select */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role Type</label>
                    <select
                      value={st.roleType}
                      onChange={(e) => handleStakeholderChange(st.id, 'roleType', e.target.value)}
                      className="bg-white text-xs text-slate-900 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Project Manager">Project Manager</option>
                      <option value="Application Owner">Application Owner</option>
                      <option value="Application SPOC">Application SPOC</option>
                      <option value="Business">Business</option>
                      <option value="Project Owner">Project Owner</option>
                      <option value="Business Technology">Business Technology</option>
                      <option value="Additional Stakeholder">Additional Stakeholder</option>
                    </select>
                  </div>

                  {/* Name Input */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Stakeholder Name"
                      value={st.name}
                      onChange={(e) => handleStakeholderChange(st.id, 'name', e.target.value)}
                      className={`bg-white text-xs text-slate-900 block w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors[`st-name-${st.id}`] ? 'border-red-500 bg-red-50/50' : 'border-slate-200'}`}
                    />
                  </div>

                  {/* Employee ID Input */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP1234"
                      value={st.employeeId}
                      onChange={(e) => handleStakeholderChange(st.id, 'employeeId', e.target.value)}
                      className={`bg-white text-xs text-slate-900 block w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors[`st-emp-${st.id}`] ? 'border-red-500 bg-red-50/50' : 'border-slate-200'}`}
                    />
                  </div>

                  {/* Department Input */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Risk Operations"
                      value={st.department}
                      onChange={(e) => handleStakeholderChange(st.id, 'department', e.target.value)}
                      className={`bg-white text-xs text-slate-900 block w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors[`st-dept-${st.id}`] ? 'border-red-500 bg-red-50/50' : 'border-slate-200'}`}
                    />
                  </div>

                  {/* Access Select */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Permissions</label>
                    <select
                      value={st.access}
                      onChange={(e) => handleStakeholderChange(st.id, 'access', e.target.value)}
                      className="bg-white text-xs text-slate-900 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Edit">Edit Access</option>
                      <option value="View-only">View-only Access</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddStakeholder}
              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 text-xs font-semibold rounded-lg text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-white transition-all cursor-pointer w-full"
              id="add-stakeholder-btn"
            >
              <Plus className="h-4 w-4" />
              Add Stakeholder
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0" id="create-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all cursor-pointer"
            id="submit-project-btn"
          >
            Initialize Project
          </button>
        </div>
      </div>
    </div>
  );
}
