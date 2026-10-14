import React, { useEffect } from 'react';
import { Project, TimelineDates } from '../types';
import { formatDate } from '../reportGenerator';
import { Printer, X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { EquitasIcon, EquitasTextLogo } from './EquitasLogo';

function renderReactSvgPieChart(red: number, amber: number, green: number, size = 100) {
  const total = red + amber + green;
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <text x="50" y="55" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill="#94a3b8">No Data</text>
      </svg>
    );
  }

  const r = 35;
  const cx = 50;
  const cy = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * r;

  const redPct = red / total;
  const amberPct = amber / total;
  const greenPct = green / total;

  const redLength = redPct * circumference;
  const amberLength = amberPct * circumference;
  const greenLength = greenPct * circumference;

  let currentOffset = 0;
  const slices: React.ReactNode[] = [];

  if (greenLength > 0) {
    slices.push(
      <circle
        key="green"
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
        strokeDasharray={`${greenLength} ${circumference}`}
        strokeDashoffset={-currentOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    currentOffset += greenLength;
  }
  if (amberLength > 0) {
    slices.push(
      <circle
        key="amber"
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={strokeWidth}
        strokeDasharray={`${amberLength} ${circumference}`}
        strokeDashoffset={-currentOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    currentOffset += amberLength;
  }
  if (redLength > 0) {
    slices.push(
      <circle
        key="red"
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#ef4444"
        strokeWidth={strokeWidth}
        strokeDasharray={`${redLength} ${circumference}`}
        strokeDashoffset={-currentOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    currentOffset += redLength;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="block mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth + 0.5} />
      {slices}
      <circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill="#ffffff" />
      <text x={cx} y={cy + 2} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="5" fill="#64748b" letterSpacing="0.5">TOTAL</text>
    </svg>
  );
}

interface ReportPrintViewProps {
  projects: Project[];
  onClose: () => void;
}

export default function ReportPrintView({ projects, onClose }: ReportPrintViewProps) {
  useEffect(() => {
    // Automatically trigger print on mount for smooth user experience, after short delay for rendering
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const total = projects.length;
  const redCount = projects.filter(p => p.ragStatus === 'Red').length;
  const amberCount = projects.filter(p => p.ragStatus === 'Amber').length;
  const greenCount = projects.filter(p => p.ragStatus === 'Green').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 sm:p-8 print:bg-white print:p-0 relative z-50">
      {/* Printable Control bar */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border border-slate-200 shadow-lg rounded-xl p-4 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Print Preview Mode</h2>
          <p className="text-xs text-slate-500">Review the report below. Use your browser's PDF options to save as high-fidelity PDF.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print / Save to PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-all border border-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
            Exit Preview
          </button>
        </div>
      </div>

      {/* Main Report Page */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 print:border-none shadow-xl print:shadow-none rounded-2xl print:rounded-none p-8 sm:p-12 min-h-[297mm]">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black bg-blue-900 text-white px-2 py-0.5 rounded font-mono uppercase tracking-widest">EquitasPM</span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {projects.length === 1 ? 'Project Status Sheet' : 'Portfolio Cockpit Report'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {projects.length === 1 ? `Project Status: ${projects[0].name}` : 'Executive Portfolio Management Status'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Generated: {formatDate(new Date())} at {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <EquitasIcon className="h-10 w-10" />
              <EquitasTextLogo className="h-8 w-auto" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">
              {projects.length === 1 ? 'PROJECT COCKPIT • OFFICIAL STATUS REPORT' : 'PORTFOLIO COCKPIT • OFFICIAL STATUS REPORT'}
            </span>
          </div>
        </div>

        {/* Portfolio Indicators Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {projects.length === 1 ? 'Project Health Status Summary' : 'Portfolio Indicators Summary'}
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  {projects.length === 1 ? 'Managed Tracks' : 'Total Managed'}
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{total}</span>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-[10px] text-red-600 font-bold uppercase block flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Red - At Risk
                </span>
                <span className="text-2xl font-black text-red-700 block mt-1">
                  {redCount} <span className="text-xs font-normal text-red-500">({total ? Math.round((redCount / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-[10px] text-amber-600 font-bold uppercase block flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Amber - Slight Delay
                </span>
                <span className="text-2xl font-black text-amber-700 block mt-1">
                  {amberCount} <span className="text-xs font-normal text-amber-500">({total ? Math.round((amberCount / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Green - On-Track
                </span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">
                  {greenCount} <span className="text-xs font-normal text-emerald-500">({total ? Math.round((greenCount / total) * 100) : 0}%)</span>
                </span>
              </div>
            </div>
          </div>
          <div className="w-36 h-36 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-2 shrink-0 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">RAG Health</span>
            {renderReactSvgPieChart(redCount, amberCount, greenCount, 96)}
          </div>
        </div>

        {/* Detailed Projects List */}
        <div className="space-y-12">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            {projects.length === 1 ? 'Detailed Project Status Track Sheet' : 'Individual Project Status Track Sheets'}
          </h2>

          {projects.map((project, idx) => {
            const dates = (project.timelineDates || {}) as Partial<TimelineDates>;
            const severityColors = {
              High: 'bg-red-50 text-red-700 border-red-200',
              Medium: 'bg-amber-50 text-amber-700 border-amber-200',
              Low: 'bg-blue-50 text-blue-700 border-blue-200',
            };

            const statusColors = {
              Red: 'bg-red-50 text-red-700 border-red-200',
              Amber: 'bg-amber-50 text-amber-700 border-amber-200',
              Green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            };

            return (
              <div key={project.id} className="p-6 border border-slate-200 rounded-xl bg-white space-y-5 shadow-sm print:shadow-none break-inside-avoid page-break-after-always">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{project.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColors[project.severity]}`}>{project.severity} Severity</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{project.name}</h3>
                    <div className="text-xs text-slate-600 border-l-2 border-slate-200 pl-3 italic">
                      <strong>Description: </strong>{project.description || 'No description provided.'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 text-center w-28">
                      {renderReactSvgPieChart(
                        project.ragStatus === 'Red' ? 1 : 0,
                        project.ragStatus === 'Amber' ? 1 : 0,
                        project.ragStatus === 'Green' ? 1 : 0,
                        55
                      )}
                      <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 block ${
                        project.ragStatus === 'Red' ? 'text-red-600' : project.ragStatus === 'Amber' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {project.ragStatus === 'Red' ? 'Red - At Risk' : project.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">PM Leader</span>
                    <span className="font-bold text-slate-800">{project.pmName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">Application Owner</span>
                    <span className="font-bold text-slate-800">{project.applicationOwnerName || '—'}</span>
                  </div>
                </div>

                {/* Key Stakeholders Table */}
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Registered Key Stakeholders & Permissions</span>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <th className="p-2 font-bold text-slate-700" width="160">Role</th>
                        <th className="p-2 font-bold text-slate-700">Name</th>
                        <th className="p-2 font-bold text-slate-700" width="100">Emp ID</th>
                        <th className="p-2 font-bold text-slate-700" width="140">Department</th>
                        <th className="p-2 font-bold text-slate-700" width="100">Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.stakeholders && project.stakeholders.length > 0 ? (
                        project.stakeholders.map((s) => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2 font-semibold text-slate-800">{s.roleType}</td>
                            <td className="p-2 text-slate-600">{s.name || '—'}</td>
                            <td className="p-2 font-mono text-slate-500">{s.employeeId || '—'}</td>
                            <td className="p-2 text-slate-600">{s.department || '—'}</td>
                            <td className="p-2 text-slate-600 font-medium">{s.access}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">No stakeholders defined.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Key Milestone Dates */}
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Milestone Schedule & Dates</span>
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <th className="p-2 font-bold text-slate-700 text-left">Milestone Phase</th>
                        <th className="p-2 font-bold text-slate-700" width="140">Planned Start</th>
                        <th className="p-2 font-bold text-slate-700" width="140">Actual Start</th>
                        <th className="p-2 font-bold text-slate-700" width="140">Planned End</th>
                        <th className="p-2 font-bold text-slate-700" width="140">Actual End</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">Project Kick-Off</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.projectKickOff)}</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 text-slate-400">—</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">URD Sign-Off</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.urdSignOff)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">Business Requirements (BRD)</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedBrdStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualBrdStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedBrdEnd)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualBrdEnd)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">Functional Specifications (FSD)</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedFsdStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualFsdStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedFsdEnd)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualFsdEnd)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">Development Phase</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedDevStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualDevStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedDevEnd)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualDevEnd)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">System Integration Testing (SIT)</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedSitStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualSitStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedSitEnd)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualSitEnd)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">User Acceptance Testing (UAT)</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedUatStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualUatStart)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedUatEnd)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualUatEnd)}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2 text-left font-medium text-slate-800">Go-Live & Rollout</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 text-slate-400">—</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.plannedGoLive)}</td>
                        <td className="p-2 font-mono text-slate-600">{formatDate(dates.actualGoLive)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Risks Summary in brief */}
                {project.risks && project.risks.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-2">Registered Risks & ETAs</span>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-y border-slate-200">
                          <th className="p-2 font-bold text-slate-700" width="30">#</th>
                          <th className="p-2 font-bold text-slate-700" width="250">Risk Description</th>
                          <th className="p-2 font-bold text-slate-700" width="100">Owner</th>
                          <th className="p-2 font-bold text-slate-700">ETA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.risks.map((r, rIdx) => (
                          <tr key={r.id} className="border-b border-slate-100">
                            <td className="p-2 font-mono text-slate-400 text-center">{rIdx + 1}</td>
                            <td className="p-2 font-semibold text-slate-800">{r.risk}</td>
                            <td className="p-2 text-slate-600">{r.owner || '—'}</td>
                            <td className="p-2 text-slate-600">{r.eta || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Notes */}
        <div className="mt-16 border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400 print:mt-12">
          <p>Equitas Small Finance Bank Portfolio Cockpit - CONFIDENTIAL INTERNAL USE ONLY</p>
          <p className="mt-1">Generated electronically. For modifications, please authorize via registered Key Stakeholder credentials.</p>
        </div>
      </div>
    </div>
  );
}
