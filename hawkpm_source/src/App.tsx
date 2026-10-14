import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Project } from './types';
import { INITIAL_PROJECTS } from './initialData';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ProjectDetailsScreen from './components/ProjectDetailsScreen';
import CreateProjectModal from './components/CreateProjectModal';
import ReportPrintView from './components/ReportPrintView';
import { EquitasIcon } from './components/EquitasLogo';
import { ENV_LABEL } from './env';

export default function App() {
  const { instance, accounts } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();

  const [user, setUser] = useState<{
    userId: string;
    name: string;
    role: 'PM' | 'Stakeholder';
    employeeId?: string;
    authType?: 'mock' | 'sso';
  } | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [printProjectId, setPrintProjectId] = useState<string | null>(null);

  // 1. Initial State Load from LocalStorage
  useEffect(() => {
    // Load projects
    const storedProjects = localStorage.getItem('stratos_pm_projects');
    if (storedProjects) {
      try {
        setProjects(JSON.parse(storedProjects));
      } catch (err) {
        setProjects(INITIAL_PROJECTS);
      }
    } else {
      setProjects(INITIAL_PROJECTS);
      localStorage.setItem('stratos_pm_projects', JSON.stringify(INITIAL_PROJECTS));
    }

    // Load active session if any
    const storedUser = localStorage.getItem('stratos_pm_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        // Safe to ignore
      }
    }
  }, []);

  // Map a Microsoft Entra ID (SSO) account into the app session.
  // Runs when MSAL reports an authenticated account and no app session exists yet.
  useEffect(() => {
    if (!isMsalAuthenticated || user) return;

    const account = instance.getActiveAccount() ?? accounts[0];
    if (!account) return;

    // account.name is the display name; username is the UPN/email.
    const displayName = account.name || account.username || 'Microsoft User';
    // Use the Azure object id (stable per user) as the app user id, falling
    // back to the UPN. localAccountId is the tenant-scoped object id.
    const ssoUserId = account.localAccountId || account.username;

    const sessionUser = {
      userId: ssoUserId,
      name: displayName,
      // Default role for SSO users; the name-based admin check in auth.ts
      // still grants admin to "Vinoth". Proper app-role mapping can layer in later.
      role: 'Stakeholder' as const,
      employeeId: account.username,
      authType: 'sso' as const,
    };
    setUser(sessionUser);
    localStorage.setItem('stratos_pm_user', JSON.stringify(sessionUser));
  }, [isMsalAuthenticated, user, instance, accounts]);

  // Save projects helper
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('stratos_pm_projects', JSON.stringify(updatedProjects));
  };

  // 2. Action Handlers
  const handleLoginSuccess = (userId: string, name: string, role: 'PM' | 'Stakeholder', employeeId?: string) => {
    const sessionUser = { userId, name, role, employeeId, authType: 'mock' as const };
    setUser(sessionUser);
    localStorage.setItem('stratos_pm_user', JSON.stringify(sessionUser));
  };

  const handleLogout = () => {
    const wasSso = user?.authType === 'sso';
    setUser(null);
    setSelectedProjectId(null);
    localStorage.removeItem('stratos_pm_user');

    // For SSO sessions, also sign out of Microsoft so the next login is clean.
    if (wasSso) {
      const account = instance.getActiveAccount() ?? accounts[0] ?? undefined;
      instance.logoutRedirect({ account }).catch((err) => {
        console.error('[MSAL] logoutRedirect failed:', err);
      });
    }
  };

  const handleCreateProject = (newProj: Project) => {
    const updated = [...projects, newProj];
    saveProjects(updated);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    const updated = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    saveProjects(updated);
  };

  // --- Maker-checker deletion workflow ---

  // Maker (Admin): request deletion -> project enters 'pending_deletion'.
  const handleRequestDeletion = (projectId: string, reason: string) => {
    const now = new Date().toISOString();
    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            deletionStatus: 'pending_deletion' as const,
            deletionAudit: {
              ...(p.deletionAudit || {}),
              requestedBy: user?.name,
              requestedById: user?.userId,
              requestedOn: now,
              reason,
              // clear any prior rejection when re-requesting
              rejectedBy: undefined,
              rejectedById: undefined,
              rejectedOn: undefined,
              rejectionReason: undefined,
            },
          }
        : p,
    );
    saveProjects(updated);
    setSelectedProjectId(null);
  };

  // Checker (Super Admin): approve deletion -> project becomes 'archived'.
  const handleApproveDeletion = (projectId: string) => {
    const now = new Date().toISOString();
    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            deletionStatus: 'archived' as const,
            deletionAudit: {
              ...(p.deletionAudit || {}),
              approvedBy: user?.name,
              approvedById: user?.userId,
              approvedOn: now,
            },
          }
        : p,
    );
    saveProjects(updated);
  };

  // Checker (Super Admin): reject deletion -> project returns to 'active'.
  const handleRejectDeletion = (projectId: string, rejectionReason: string) => {
    const now = new Date().toISOString();
    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            deletionStatus: 'active' as const,
            deletionAudit: {
              ...(p.deletionAudit || {}),
              rejectedBy: user?.name,
              rejectedById: user?.userId,
              rejectedOn: now,
              rejectionReason,
            },
          }
        : p,
    );
    saveProjects(updated);
  };

  // Restore an archived (or pending) project back to active.
  const handleRestoreProject = (projectId: string) => {
    const now = new Date().toISOString();
    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            deletionStatus: 'active' as const,
            deletionAudit: {
              ...(p.deletionAudit || {}),
              restoredBy: user?.name,
              restoredOn: now,
            },
          }
        : p,
    );
    saveProjects(updated);
  };

  // Super Admin only: permanently purge an archived project.
  const handlePermanentDelete = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    saveProjects(updated);
    setSelectedProjectId(null);
  };

  // 3. ID Generator: EP00001, EP00002...
  const getNextProjectId = (): string => {
    const ids = projects.map((p) => {
      const match = p.id.match(/^EP(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const nextId = maxId + 1;
    return `EP${String(nextId).padStart(5, '0')}`;
  };

  // 4. View Routing Render block
  const renderContent = () => {
    if (!user) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    if (isPrintingReport) {
      const projectsToPrint = printProjectId 
        ? projects.filter((p) => p.id === printProjectId) 
        : projects;
      return (
        <ReportPrintView
          projects={projectsToPrint}
          onClose={() => {
            setIsPrintingReport(false);
            setPrintProjectId(null);
          }}
        />
      );
    }

    if (selectedProjectId) {
      const currentProject = projects.find((p) => p.id === selectedProjectId);
      if (!currentProject) {
        setSelectedProjectId(null);
        return null;
      }
      return (
        <ProjectDetailsScreen
          project={currentProject}
          onBack={() => setSelectedProjectId(null)}
          onUpdateProject={handleUpdateProject}
          onRequestDeletion={handleRequestDeletion}
          currentUserId={user.userId}
          currentUserRole={user.role}
          currentEmployeeId={user.employeeId}
          currentUserName={user.name}
          onTriggerPrint={(projectId) => {
            setPrintProjectId(projectId);
            setIsPrintingReport(true);
          }}
        />
      );
    }

    return (
      <>
        <DashboardScreen
          projects={projects}
          onSelectProject={(id) => setSelectedProjectId(id)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onLogout={handleLogout}
          currentUserId={user.userId}
          currentUserName={user.name}
          currentUserRole={user.role}
          currentEmployeeId={user.employeeId}
          onTriggerPrint={() => setIsPrintingReport(true)}
          onUpdateProject={handleUpdateProject}
          onApproveDeletion={handleApproveDeletion}
          onRejectDeletion={handleRejectDeletion}
          onRestoreProject={handleRestoreProject}
          onPermanentDelete={handlePermanentDelete}
        />

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProject}
          nextProjectId={getNextProjectId()}
          currentUserId={user.userId}
          currentUserName={user.name}
        />
      </>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Centered background watermark of the exact "E" logo with subtle 4% visibility */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.04]" id="equitas-bg-watermark">
        <EquitasIcon
          className="w-[75vw] h-[75vw] max-w-[480px] max-h-[480px] transition-all duration-500"
          id="watermark-icon"
        />
      </div>
      {/* Environment badge (shows for UAT/LOCAL only; hidden in Production) */}
      {ENV_LABEL && (
        <div
          className="fixed bottom-3 right-3 z-50 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm bg-amber-500 text-white pointer-events-none select-none"
          id="env-badge"
        >
          {ENV_LABEL}
        </div>
      )}
      <div className="relative z-10">
        {renderContent()}
      </div>
    </div>
  );
}

