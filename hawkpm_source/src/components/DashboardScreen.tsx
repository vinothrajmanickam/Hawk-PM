import React, { useState } from 'react';
import { Project, RagStatus } from '../types';
import { Search, Plus, FileSpreadsheet, FileText, Printer, LogOut, ChevronRight, AlertCircle, AlertTriangle, CheckCircle, UserCheck, ChevronDown } from 'lucide-react';
import { EquitasIcon, EquitasTextLogo } from './EquitasLogo';
import {
  generateProjectReportCSV,
  downloadCSV,
  generateExcelReport,
  downloadExcel,
  generateWordReport,
  downloadWord,
  formatDate
} from '../reportGenerator';
import RAGPieChart from './RAGPieChart';
import {
  canEditProject,
  canApproveDeletion,
  canRestore,
  canPermanentlyDelete,
  isSuperAdmin,
  getDeletionStatus,
} from '../utils/auth';

interface DashboardScreenProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onOpenCreateModal: () => void;
  onLogout: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'PM' | 'Stakeholder';
  currentEmployeeId?: string;
  onTriggerPrint: () => void;
  onUpdateProject: (p: Project) => void;
  onApproveDeletion: (projectId: string) => void;
  onRejectDeletion: (projectId: string, reason: string) => void;
  onRestoreProject: (projectId: string) => void;
  onPermanentDelete: (projectId: string) => void;
}

export default function DashboardScreen({
  projects,
  onSelectProject,
  onOpenCreateModal,
  onLogout,
  currentUserId,
  currentUserName,
  currentUserRole,
  currentEmployeeId,
  onTriggerPrint,
  onUpdateProject,
  onApproveDeletion,
  onRejectDeletion,
  onRestoreProject,
  onPermanentDelete
}: DashboardScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RagStatus | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'archived'>('active');

  const userIsSuperAdmin = isSuperAdmin(currentUserName, currentUserId);

  // Partition projects by deletion status (undefined treated as active).
  const activeProjects = projects.filter((p) => getDeletionStatus(p) === 'active');
  const pendingProjects = projects.filter((p) => getDeletionStatus(p) === 'pending_deletion');
  const archivedProjects = projects.filter((p) => getDeletionStatus(p) === 'archived');

  const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '-');

  // Super Admin: approve a pending deletion (enforces maker != checker in auth.ts).
  const handleApprove = (project: Project) => {
    if (!canApproveDeletion(project, currentUserName, currentUserId)) {
      window.alert('You cannot approve this request. The approver must be a different Super Admin than the requester.');
      return;
    }
    const ok = window.confirm(`APPROVE DELETION:\n\nProject "${project.name}" (${project.id}) will be moved to the Archived bucket.\n\nRequested by: ${project.deletionAudit?.requestedBy || 'Unknown'}\nReason: ${project.deletionAudit?.reason || '-'}\n\nProceed?`);
    if (ok) onApproveDeletion(project.id);
  };

  // Super Admin: reject a pending deletion (returns project to active).
  const handleReject = (project: Project) => {
    const reason = window.prompt(`Reject the deletion request for "${project.name}" (${project.id}).\n\nEnter a reason (recorded in the audit trail):`, '');
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert('A rejection reason is required. Action cancelled.');
      return;
    }
    onRejectDeletion(project.id, reason.trim());
  };

  // Admin / Super Admin: restore an archived project to active.
  const handleRestore = (project: Project) => {
    if (!canRestore(currentUserName, currentUserId)) return;
    const ok = window.confirm(`RESTORE PROJECT:\n\n"${project.name}" (${project.id}) will be returned to the Active projects list.\n\nProceed?`);
    if (ok) onRestoreProject(project.id);
  };

  // Super Admin only: permanently purge an archived project.
  const handlePermanentDelete = (project: Project) => {
    if (!canPermanentlyDelete(currentUserName, currentUserId)) return;
    const c1 = window.confirm(`PERMANENT DELETION:\n\n"${project.name}" (${project.id}) will be permanently removed from the database. This CANNOT be undone.\n\nProceed?`);
    if (!c1) return;
    const c2 = window.confirm(`FINAL CONFIRMATION:\n\nPermanently purge "${project.id}"? Click OK to delete forever.`);
    if (c2) onPermanentDelete(project.id);
  };

  // RAG Sorting weight mapping: Red (1st), Amber (2nd), Green (last)
  const ragPriority: Record<RagStatus, number> = {
    'Red': 1,
    'Amber': 2,
    'Green': 3
  };

  // 1. Filter ACTIVE projects based on selected RAG status and ID/name/PM search.
  // The Active tab excludes pending-deletion and archived projects.
  const filteredProjects = activeProjects.filter((project) => {
    if (selectedStatus !== 'All' && project.ragStatus !== selectedStatus) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      project.id.toLowerCase().includes(q) ||
      project.name.toLowerCase().includes(q) ||
      project.pmName.toLowerCase().includes(q) ||
      project.applicationOwnerName.toLowerCase().includes(q)
    );
  });

  // 2. Sort projects strictly by RAG status priority
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    return (ragPriority[a.ragStatus] || 99) - (ragPriority[b.ragStatus] || 99);
  });

  // Analytics for Stats Cards (active projects only)
  const totalCount = activeProjects.length;
  const redCount = activeProjects.filter(p => p.ragStatus === 'Red').length;
  const amberCount = activeProjects.filter(p => p.ragStatus === 'Amber').length;
  const greenCount = activeProjects.filter(p => p.ragStatus === 'Green').length;

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const handleExportCSV = () => {
    const csvContent = generateProjectReportCSV(projects);
    downloadCSV(csvContent, `EquitasPM_Portfolio_Report_${new Date().toISOString().slice(0,10)}.csv`);
    setIsExportDropdownOpen(false);
  };

  const handleExportExcel = () => {
    const excelContent = generateExcelReport(projects);
    downloadExcel(excelContent, `EquitasPM_Portfolio_Report_${new Date().toISOString().slice(0,10)}.xls`);
    setIsExportDropdownOpen(false);
  };

  const handleExportWord = () => {
    const wordContent = generateWordReport(projects);
    downloadWord(wordContent, `EquitasPM_Portfolio_Report_${new Date().toISOString().slice(0,10)}.doc`);
    setIsExportDropdownOpen(false);
  };

  const handlePrintPDF = () => {
    onTriggerPrint();
    setIsExportDropdownOpen(false);
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'High': return 'bg-red-50 text-red-700 border border-red-200 font-semibold';
      case 'Medium': return 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
      default: return 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold';
    }
  };

  const getRagBadgeClass = (status: RagStatus) => {
    switch (status) {
      case 'Red': return 'bg-red-50 text-red-700 border border-red-200 font-bold';
      case 'Amber': return 'bg-amber-50 text-amber-700 border border-amber-200 font-bold';
      case 'Green': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    }
  };

  const getRagDotClass = (status: RagStatus) => {
    switch (status) {
      case 'Red': return 'bg-red-500 ring-4 ring-red-50';
      case 'Amber': return 'bg-amber-500 ring-4 ring-amber-50';
      case 'Green': return 'bg-emerald-500 ring-4 ring-emerald-50';
    }
  };

  const getProjectCurrentStatusInfo = (project: Project) => {
    const dates = project.timelineDates;
    if (!dates) return { label: 'Initiating', style: 'bg-slate-50 text-slate-600 border-slate-200' };

    if (dates.actualGoLive) {
      return { label: 'Go-Live Completed', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (dates.actualUatEnd) {
      return { label: 'UAT Completed', style: 'bg-teal-50 text-teal-700 border-teal-200' };
    }
    if (dates.actualUatStart) {
      return { label: 'UAT Phase', style: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' };
    }
    if (dates.actualSitEnd) {
      return { label: 'SIT Completed', style: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    }
    if (dates.actualSitStart) {
      return { label: 'SIT Phase', style: 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse' };
    }
    if (dates.actualDevEnd) {
      return { label: 'Dev Completed', style: 'bg-violet-50 text-violet-700 border-violet-200' };
    }
    if (dates.actualDevStart) {
      return { label: 'Dev Phase', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' };
    }
    if (dates.actualFsdEnd) {
      return { label: 'FSD Completed', style: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (dates.actualFsdStart) {
      return { label: 'FSD Phase', style: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' };
    }
    if (dates.actualBrdEnd) {
      return { label: 'BRD Completed', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (dates.actualBrdStart) {
      return { label: 'BRD Phase', style: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
    if (dates.urdSignOff) {
      return { label: 'URD Completed', style: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    }
    if (dates.projectKickOff) {
      return { label: 'Kick-off Completed', style: 'bg-slate-100 text-slate-700 border-slate-300' };
    }

    return { label: 'Initiating', style: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" id="dashboard-container">
      {/* Top Corporate Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm" id="dashboard-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 py-1" id="dashboard-logo-badge">
                <EquitasIcon className="h-10 w-10 drop-shadow-sm" />
                <EquitasTextLogo className="h-8 w-auto hidden xs:block" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-slate-800 font-sans flex items-center gap-1.5" id="dashboard-brand-text">
                <span className="hidden sm:inline text-slate-400">|</span>
                Equitas<span className="bg-[#1b4d8c] text-white px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">PM</span>
              </span>
            </div>

            {/* User Session Profile and Logout */}
            <div className="flex items-center gap-4" id="nav-user-panel">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-blue-600" />
                  {currentUserName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Role: <span className="text-blue-600 font-semibold">{currentUserRole}</span> {currentEmployeeId && `(${currentEmployeeId})`}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
                id="logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="dashboard-main-content">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="welcome-banner">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">PM Teams Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Operational lifecycles, milestone gates, and active RAG posture overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" id="export-dropdown-wrapper">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
                id="export-multi-btn"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export Report
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportDropdownOpen && (
                <>
                  {/* Overlay click-away trigger */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsExportDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 divide-y divide-slate-100" id="export-dropdown-menu">
                    {/* Excel block */}
                    <button
                      onClick={handleExportExcel}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Download Excel Report</span>
                        <span className="block text-[10px] text-slate-500">Structured spreadsheet with active RAG colors & all dates.</span>
                      </div>
                    </button>

                    {/* Word block */}
                    <button
                      onClick={handleExportWord}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Download Word Document</span>
                        <span className="block text-[10px] text-slate-500">Polished executive summaries & stakeholder tables.</span>
                      </div>
                    </button>

                    {/* PDF block */}
                    <button
                      onClick={handlePrintPDF}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 bg-red-50 rounded-lg text-red-600 mt-0.5">
                        <Printer className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Print / Save as PDF</span>
                        <span className="block text-[10px] text-slate-500">Vector print-ready view suitable for PDF publishing.</span>
                      </div>
                    </button>

                    {/* CSV block */}
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 mt-0.5">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Download CSV Data</span>
                        <span className="block text-[10px] text-slate-500">Raw tabular data suitable for general purpose use.</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Create Project privilege (unconditional) */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              id="create-project-btn"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        </div>

        {/* Tab navigation: Active / Pending Approvals / Archived */}
        <div className="flex items-center gap-1 border-b border-slate-200" id="dashboard-tabs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-active"
          >
            Active Projects
            <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{activeProjects.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-pending"
          >
            Pending Approvals
            <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pendingProjects.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{pendingProjects.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'archived'
                ? 'border-slate-700 text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-archived"
          >
            Archived Projects
            <span className="ml-2 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{archivedProjects.length}</span>
          </button>
        </div>

        {/* ============ ACTIVE TAB ============ */}
        {activeTab === 'active' && (
        <>
        {/* Portfolio Indicators & RAG Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="dashboard-analytics-section">
          {/* Stats Cards (Takes 2 columns on desktop) */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4" id="stats-grid">
            <button
              onClick={() => setSelectedStatus('All')}
              className={`p-5 rounded-xl border flex flex-col justify-between text-left transition-all duration-200 cursor-pointer shadow-sm ${
                selectedStatus === 'All'
                  ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/10'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
              id="stat-card-all"
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Projects</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
                <span className="text-xs text-slate-400">tracks</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus(selectedStatus === 'Red' ? 'All' : 'Red')}
              className={`p-5 rounded-xl border flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border-l-4 shadow-sm ${
                selectedStatus === 'Red'
                  ? 'bg-red-50 border-red-400 border-l-red-600 ring-2 ring-red-500/20'
                  : 'bg-white border-slate-200 border-l-red-500 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
              id="stat-card-red"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Red - At Risk</span>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-red-600">{redCount}</span>
                <span className="text-xs text-slate-400">
                  ({totalCount ? ((redCount / totalCount) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus(selectedStatus === 'Amber' ? 'All' : 'Amber')}
              className={`p-5 rounded-xl border flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border-l-4 shadow-sm ${
                selectedStatus === 'Amber'
                  ? 'bg-amber-50 border-amber-400 border-l-amber-600 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 border-l-amber-500 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
              id="stat-card-amber"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amber - Slight Delay</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-500">{amberCount}</span>
                <span className="text-xs text-slate-400">
                  ({totalCount ? ((amberCount / totalCount) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus(selectedStatus === 'Green' ? 'All' : 'Green')}
              className={`p-5 rounded-xl border flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border-l-4 shadow-sm ${
                selectedStatus === 'Green'
                  ? 'bg-emerald-50 border-emerald-400 border-l-emerald-600 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 border-l-emerald-500 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
              id="stat-card-green"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Green - On-Track</span>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-emerald-600">{greenCount}</span>
                <span className="text-xs text-slate-400">
                  ({totalCount ? ((greenCount / totalCount) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </button>
          </div>

          {/* RAG Pie Chart Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between" id="pie-chart-card">
            <RAGPieChart
              projects={activeProjects}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4" id="search-bar-panel">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. EP00001) or project keywords..."
              className="bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 block w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white"
              id="search-input-field"
            />
          </div>
          <div className="text-xs text-slate-500 font-mono italic flex flex-wrap items-center gap-1.5">
            <span>
              Showing {sortedProjects.length} of {totalCount} total tracks sorted strictly: <span className="text-red-600 font-bold">Red - At Risk</span> → <span className="text-amber-500 font-bold">Amber - Slight Delay</span> → <span className="text-emerald-600 font-bold">Green - On-Track</span>
              {selectedStatus !== 'All' && (
                <> (filtered by <span className={selectedStatus === 'Red' ? 'text-red-600 font-bold' : selectedStatus === 'Amber' ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'}>{selectedStatus === 'Red' ? 'Red - At Risk' : selectedStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}</span>)</>
              )}
            </span>
            {selectedStatus !== 'All' && (
              <button 
                onClick={() => setSelectedStatus('All')} 
                className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-sans font-semibold transition cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Projects List View */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="projects-table-container">
          {sortedProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3" id="no-projects-view">
              <AlertTriangle className="h-12 w-12 mx-auto text-slate-400" />
              <p className="text-slate-700 font-semibold">No Projects found</p>
              <p className="text-xs text-slate-400">Refine your search term or add a new project track.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200" id="projects-table">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">RAG Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Project ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Current Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Go-Live Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Application Owner</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Project Manager</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedProjects.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => onSelectProject(project.id)}
                      className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer group"
                      id={`project-row-${project.id}`}
                    >
                      {/* RAG status column */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {canEditProject(project, currentUserName, currentUserId) ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getRagDotClass(project.ragStatus)}`} />
                            <select
                              value={project.ragStatus}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                onUpdateProject({
                                  ...project,
                                  ragStatus: e.target.value as RagStatus
                                });
                              }}
                              className={`px-2 py-1 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer border shadow-sm transition-all ${getRagBadgeClass(project.ragStatus)}`}
                              id={`project-rag-select-${project.id}`}
                            >
                              <option value="Red" className="font-semibold text-red-700 bg-red-50">Red - At Risk</option>
                              <option value="Amber" className="font-semibold text-amber-700 bg-amber-50">Amber - Slight Delay</option>
                              <option value="Green" className="font-semibold text-emerald-700 bg-emerald-50">Green - On-Track</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${getRagDotClass(project.ragStatus)}`} />
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRagBadgeClass(project.ragStatus)}`}>
                              {project.ragStatus === 'Red' ? 'Red - At Risk' : project.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Project ID column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm font-mono font-bold text-blue-600">
                        {project.id}
                      </td>

                      {/* Project Name & Severity column */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col max-w-sm">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {project.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-1.5 py-0.2 text-[10px] rounded uppercase font-mono ${getSeverityBadgeClass(project.severity)}`}>
                              {project.severity}
                            </span>
                            {project.methodology && (
                              <span className="px-1.5 py-0.2 text-[10px] rounded uppercase font-mono bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                                {project.methodology}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 truncate">{project.description.slice(0, 70)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Current Status column */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {(() => {
                          const status = getProjectCurrentStatusInfo(project);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${status.style}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                              {status.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Delivery Date column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-600 font-mono">
                        {project.deliveryDate ? formatDate(project.deliveryDate) : 'Not Estimated'}
                      </td>

                      {/* Application Owner column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm text-slate-600">
                        {project.applicationOwnerName}
                      </td>

                      {/* Project PM column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {project.pmName}
                      </td>

                      {/* Action trigger column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span className="inline-flex items-center gap-1">
                          Manage
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {/* ============ PENDING APPROVALS TAB ============ */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="pending-approvals-container">
            <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/50">
              <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending Deletion Approvals
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {userIsSuperAdmin
                  ? 'Review deletion requests. Approving archives the project; rejecting returns it to Active. You cannot approve a request you made yourself.'
                  : 'Deletion requests awaiting Super Admin approval. Only a Super Admin can approve or reject.'}
              </p>
            </div>
            {pendingProjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-300" />
                <p className="text-slate-700 font-semibold">No pending deletion requests</p>
                <p className="text-xs text-slate-400">Requests submitted by an Admin will appear here for Super Admin approval.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingProjects.map((project) => (
                  <div key={project.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id={`pending-row-${project.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-blue-600">{project.id}</span>
                        <span className="text-sm font-bold text-slate-900 truncate">{project.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Pending</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested by <strong className="text-slate-700">{project.deletionAudit?.requestedBy || 'Unknown'}</strong> on {fmtDateTime(project.deletionAudit?.requestedOn)}
                      </p>
                      {project.deletionAudit?.reason && (
                        <p className="text-xs text-slate-600 mt-1 italic">Reason: &ldquo;{project.deletionAudit.reason}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        View
                      </button>
                      {userIsSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleApprove(project)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer"
                            id={`approve-btn-${project.id}`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(project)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
                            id={`reject-btn-${project.id}`}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ ARCHIVED TAB ============ */}
        {activeTab === 'archived' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="archived-container">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Archived Projects
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deleted projects approved by a Super Admin. View or export any record. Restore returns it to Active
                {canPermanentlyDelete(currentUserName, currentUserId) ? '; permanent deletion is Super Admin only.' : '.'}
              </p>
            </div>
            {archivedProjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FileText className="h-12 w-12 mx-auto text-slate-300" />
                <p className="text-slate-700 font-semibold">No archived projects</p>
                <p className="text-xs text-slate-400">Approved deletions will be archived here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {archivedProjects.map((project) => (
                  <div key={project.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id={`archived-row-${project.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-slate-500">{project.id}</span>
                        <span className="text-sm font-bold text-slate-700 truncate">{project.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300">Archived</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested by <strong>{project.deletionAudit?.requestedBy || 'Unknown'}</strong> &middot; Approved by <strong>{project.deletionAudit?.approvedBy || 'Unknown'}</strong> on {fmtDateTime(project.deletionAudit?.approvedOn)}
                      </p>
                      {project.deletionAudit?.reason && (
                        <p className="text-xs text-slate-600 mt-1 italic">Reason: &ldquo;{project.deletionAudit.reason}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        View
                      </button>
                      {canRestore(currentUserName, currentUserId) && (
                        <button
                          onClick={() => handleRestore(project)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
                          id={`restore-btn-${project.id}`}
                        >
                          Restore
                        </button>
                      )}
                      {canPermanentlyDelete(currentUserName, currentUserId) && (
                        <button
                          onClick={() => handlePermanentDelete(project)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm transition cursor-pointer"
                          id={`purge-btn-${project.id}`}
                        >
                          Delete Forever
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
