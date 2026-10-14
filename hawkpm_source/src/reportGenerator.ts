import { Project, Stakeholder, TimelineDates } from './types';

// Helper to format date strings consistently to dd-mm-yyyy
export function formatDate(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '—';
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateVal);
  }
}

// Generates an inline vector SVG donut chart representation for RAG values
export function generateSvgPieChart(red: number, amber: number, green: number, size = 120): string {
  const total = red + amber + green;
  if (total === 0) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="12" />
        <text x="50" y="55" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="8" fill="#94a3b8">No Data</text>
      </svg>
    `;
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

  const redColor = '#ef4444';
  const amberColor = '#f59e0b';
  const greenColor = '#10b981';

  let svgSlices = '';

  if (greenLength > 0) {
    svgSlices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${greenColor}" stroke-width="${strokeWidth}" stroke-dasharray="${greenLength} ${circumference}" stroke-dashoffset="${-currentOffset}" transform="rotate(-90 ${cx} ${cy})" />`;
    currentOffset += greenLength;
  }
  if (amberLength > 0) {
    svgSlices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${amberColor}" stroke-width="${strokeWidth}" stroke-dasharray="${amberLength} ${circumference}" stroke-dashoffset="${-currentOffset}" transform="rotate(-90 ${cx} ${cy})" />`;
    currentOffset += amberLength;
  }
  if (redLength > 0) {
    svgSlices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${redColor}" stroke-width="${strokeWidth}" stroke-dasharray="${redLength} ${circumference}" stroke-dashoffset="${-currentOffset}" transform="rotate(-90 ${cx} ${cy})" />`;
    currentOffset += redLength;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth + 0.5}" />
      ${svgSlices}
      <circle cx="${cx}" cy="${cy}" r="${r - strokeWidth / 2}" fill="#ffffff" />
      <text x="${cx}" y="${cy + 2}" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" font-size="12" fill="#1e293b">${total}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" font-size="5" fill="#64748b" letter-spacing="0.5">TOTAL</text>
    </svg>
  `;
}

// Generates an Excel-compatible pie/doughnut chart using QuickChart.io (online) and a backup HTML-table progress bar (offline)
export function generateExcelPieChart(red: number, amber: number, green: number, size = 120): string {
  const total = red + amber + green;
  if (total === 0) {
    return `
      <table style="width: 100%; border-collapse: collapse; text-align: center;">
        <tr>
          <td style="background-color: #f1f5f9; color: #94a3b8; font-size: 11px; padding: 10px; font-weight: bold; border: 1px solid #cbd5e1;">No Data</td>
        </tr>
      </table>
    `;
  }

  const redPct = total ? Math.round((red / total) * 100) : 0;
  const amberPct = total ? Math.round((amber / total) * 100) : 0;
  const greenPct = total ? Math.round((green / total) * 100) : 0;

  // Build high-fidelity QuickChart.io configuration for the chart image
  const chartConfig = {
    type: 'doughnut',
    data: {
      labels: ['Red', 'Amber', 'Green'],
      datasets: [{
        data: [red, amber, green],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
      }]
    },
    options: {
      legend: { display: false },
      plugins: {
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold', size: 10 }
        }
      }
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  const quickChartUrl = `https://quickchart.io/chart?c=${encodedConfig}&w=${size}&h=${size}`;

  // Build offline-safe HTML bar indicator that Excel renders perfectly without internet
  let progressBar = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: 1px solid #94a3b8; height: 18px;">
      <tr>
  `;
  if (green > 0) {
    progressBar += `<td style="width: ${greenPct}%; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: bold; text-align: center; padding: 4px;">Green ${greenPct}%</td>`;
  }
  if (amber > 0) {
    progressBar += `<td style="width: ${amberPct}%; background-color: #f59e0b; color: #ffffff; font-size: 10px; font-weight: bold; text-align: center; padding: 4px;">Amber ${amberPct}%</td>`;
  }
  if (red > 0) {
    progressBar += `<td style="width: ${redPct}%; background-color: #ef4444; color: #ffffff; font-size: 10px; font-weight: bold; text-align: center; padding: 4px;">Red ${redPct}%</td>`;
  }
  progressBar += `
      </tr>
    </table>
  `;

  return `
    <div style="text-align: center;">
      <!-- Embedded Chart Image (Loads when connected to internet) -->
      <img src="${quickChartUrl}" width="${size}" height="${size}" style="display: block; margin: 0 auto; border: none;" alt="Portfolio Health Chart" />
      
      <!-- Fallback / Static layout (Renders offline in all Excel engines) -->
      <div style="font-size: 10px; color: #475569; margin-top: 4px; font-weight: bold; text-align: center;">RAG Distribution:</div>
      ${progressBar}
    </div>
  `;
}

// 1. GENERATE EXCEL-COMPATIBLE HTML REPORT
export function generateExcelReport(projects: Project[]): string {
  const total = projects.length;
  const redCount = projects.filter(p => p.ragStatus === 'Red').length;
  const amberCount = projects.filter(p => p.ragStatus === 'Amber').length;
  const greenCount = projects.filter(p => p.ragStatus === 'Green').length;

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 11px; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 12px; }
        
        .title-header { font-size: 18px; font-weight: bold; color: #0a3a82; padding: 15px 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-bottom: 15px; }
        
        .stats-table { border: none; width: 350px; }
        .stats-table td { border: none; padding: 5px; font-size: 12px; }
        .stats-header { font-weight: bold; font-size: 13px; color: #0f172a; border-bottom: 2px solid #cbd5e1; }
        
        .rag-red { background-color: #fef2f2; color: #991b1b; font-weight: bold; border-left: 4px solid #ef4444; }
        .rag-amber { background-color: #fffbeb; color: #92400e; font-weight: bold; border-left: 4px solid #f59e0b; }
        .rag-green { background-color: #ecfdf5; color: #065f46; font-weight: bold; border-left: 4px solid #10b981; }
        
        .section-header { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
        .font-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .bg-light { background-color: #f8fafc; }
        .timeline-header { background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <div class="title-header">STRATOSPM - EQUITAS PORTFOLIO STATUS REPORT</div>
      <div class="subtitle">Generated on: ${formatDate(new Date())} at ${new Date().toLocaleTimeString()}</div>

      <table style="border: none; width: 550px; margin-bottom: 20px;">
        <tr>
          <td style="border: none; padding: 0; vertical-align: top;">
            <table class="stats-table" style="width: 350px; margin-bottom: 0;">
              <tr>
                <td colspan="2" class="stats-header">Portfolio Indicators Summary</td>
              </tr>
              <tr>
                <td class="font-bold">Total Managed Projects:</td>
                <td>${total}</td>
              </tr>
              <tr style="background-color: #fee2e2;">
                <td class="font-bold" style="color: #991b1b;">Critical Status (Red):</td>
                <td style="color: #991b1b; font-weight: bold;">${redCount} (${(total ? (redCount / total) * 100 : 0).toFixed(1)}%)</td>
              </tr>
              <tr style="background-color: #fef3c7;">
                <td class="font-bold" style="color: #92400e;">At Risk Status (Amber):</td>
                <td style="color: #92400e; font-weight: bold;">${amberCount} (${(total ? (amberCount / total) * 100 : 0).toFixed(1)}%)</td>
              </tr>
              <tr style="background-color: #d1fae5;">
                <td class="font-bold" style="color: #065f46;">On Track Status (Green):</td>
                <td style="color: #065f46; font-weight: bold;">${greenCount} (${(total ? (greenCount / total) * 100 : 0).toFixed(1)}%)</td>
              </tr>
            </table>
          </td>
          <td style="border: none; padding: 0 0 0 20px; vertical-align: middle;" width="160">
            <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px; text-align: center; width: 140px;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Portfolio Health</div>
              ${generateExcelPieChart(redCount, amberCount, greenCount, 120)}
            </div>
          </td>
        </tr>
      </table>

      <div class="section-header">Active Tracks Dashboard</div>
      <table>
        <thead>
          <tr>
            <th width="80">Track ID</th>
            <th width="100">RAG Status</th>
            <th width="200">Project Name</th>
            <th width="80">Severity</th>
            <th width="120">PM Leader</th>
            <th width="150">Application Owner</th>
            <th width="300">Registered Key Stakeholders</th>
            <th width="100">Kick-Off</th>
            <th width="100">URD Sign-Off</th>
            <th width="100">BRD Planned End</th>
            <th width="100">BRD Actual End</th>
            <th width="100">FSD Planned End</th>
            <th width="100">FSD Actual End</th>
            <th width="100">Dev Planned End</th>
            <th width="100">Dev Actual End</th>
            <th width="100">SIT Planned End</th>
            <th width="100">SIT Actual End</th>
            <th width="100">UAT Planned End</th>
            <th width="100">UAT Actual End</th>
            <th width="100">Go-Live Target</th>
          </tr>
        </thead>
        <tbody>
  `;

  projects.forEach(p => {
    const rClass = p.ragStatus === 'Red' ? 'rag-red' : p.ragStatus === 'Amber' ? 'rag-amber' : 'rag-green';
    const labelUpper = p.ragStatus === 'Red' ? 'RED - AT RISK' : p.ragStatus === 'Amber' ? 'AMBER - SLIGHT DELAY' : 'GREEN - ON-TRACK';
    
    // Format stakeholders list as clean string
    const stakeholdersStr = p.stakeholders
      .map(s => `${s.name} (${s.roleType}${s.department ? `, ${s.department}` : ''})`)
      .join('; ');

    const dates = (p.timelineDates || {}) as Partial<TimelineDates>;

    html += `
          <tr>
            <td class="font-bold text-center">${p.id}</td>
            <td class="${rClass} text-center">${labelUpper}</td>
            <td class="font-bold">${p.name}</td>
            <td class="text-center">${p.severity}</td>
            <td>${p.pmName}</td>
            <td>${p.applicationOwnerName || '—'}</td>
            <td>${stakeholdersStr || '—'}</td>
            <td class="text-center">${formatDate(dates.projectKickOff)}</td>
            <td class="text-center">${formatDate(dates.urdSignOff)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedBrdEnd)}</td>
            <td class="text-center">${formatDate(dates.actualBrdEnd)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedFsdEnd)}</td>
            <td class="text-center">${formatDate(dates.actualFsdEnd)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedDevEnd)}</td>
            <td class="text-center">${formatDate(dates.actualDevEnd)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedSitEnd)}</td>
            <td class="text-center">${formatDate(dates.actualSitEnd)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedUatEnd)}</td>
            <td class="text-center">${formatDate(dates.actualUatEnd)}</td>
            <td class="text-center font-bold" style="background-color: #eff6ff;">${formatDate(dates.actualGoLive || dates.plannedGoLive)}</td>
          </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
}

// 2. GENERATE WORD-COMPATIBLE EXECUTIVE SUMMARY
export function generateWordReport(projects: Project[]): string {
  const total = projects.length;
  const redCount = projects.filter(p => p.ragStatus === 'Red').length;
  const amberCount = projects.filter(p => p.ragStatus === 'Amber').length;
  const greenCount = projects.filter(p => p.ragStatus === 'Green').length;

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>EquitasPM Portfolio Report</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
        h1 { color: #0a3a82; font-size: 24px; border-bottom: 2px solid #e11b22; padding-bottom: 8px; margin-bottom: 5px; }
        h2 { color: #0f172a; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        h3 { color: #2563eb; font-size: 13px; margin-top: 15px; margin-bottom: 5px; }
        
        .meta-text { font-size: 11px; color: #64748b; margin-bottom: 20px; }
        .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
        
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
        
        .badge { display: inline-block; padding: 3px 8px; font-weight: bold; font-size: 10px; border-radius: 4px; text-transform: uppercase; }
        .badge-red { background-color: #fee2e2; color: #991b1b; }
        .badge-amber { background-color: #fef3c7; color: #92400e; }
        .badge-green { background-color: #d1fae5; color: #065f46; }
        
        .project-card { border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 25px; border-radius: 8px; background-color: #ffffff; page-break-after: always; }
        .project-title { font-size: 16px; font-weight: bold; color: #0a3a82; margin-bottom: 10px; }
        .bold { font-weight: bold; }
        .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
        .mb-2 { margin-bottom: 8px; }
        .text-slate { color: #64748b; }
      </style>
    </head>
    <body>
      <h1>STRATOSPM - EXECUTIVE PORTFOLIO MANAGEMENT BRIEF</h1>
      <div class="meta-text">Generated On: ${formatDate(new Date())} at ${new Date().toLocaleTimeString()}</div>

      <table class="summary-box" style="width: 100%; border: 1px solid #e2e8f0; background-color: #f8fafc; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="border: none; padding: 15px; vertical-align: middle;">
            <strong style="font-size: 14px; color: #0a3a82;">Portfolio Health Dashboard Summary</strong>
            <p style="font-size: 12px; margin: 8px 0 0 0; line-height: 1.6;">
              Total Projects Tracked: <strong>${total}</strong><br/>
              <span style="color: #ef4444; font-weight: bold; display: inline-block; margin-top: 4px;">• Critical (Red): ${redCount} (${(total ? (redCount / total) * 100 : 0).toFixed(1)}%)</span><br/>
              <span style="color: #f59e0b; font-weight: bold; display: inline-block; margin-top: 4px;">• At Risk (Amber): ${amberCount} (${(total ? (amberCount / total) * 100 : 0).toFixed(1)}%)</span><br/>
              <span style="color: #10b981; font-weight: bold; display: inline-block; margin-top: 4px;">• On Track (Green): ${greenCount} (${(total ? (greenCount / total) * 100 : 0).toFixed(1)}%)</span>
            </p>
          </td>
          <td style="border: none; padding: 15px; width: 130px; text-align: center; vertical-align: middle;">
            <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; width: 110px; display: inline-block;">
              ${generateSvgPieChart(redCount, amberCount, greenCount, 110)}
            </div>
          </td>
        </tr>
      </table>

      <h2>INDIVIDUAL PROJECT TRACK SHEETS</h2>
  `;

  projects.forEach((p, idx) => {
    const badgeStyle = p.ragStatus === 'Red' ? 'badge-red' : p.ragStatus === 'Amber' ? 'badge-amber' : 'badge-green';
    const labelStatus = p.ragStatus === 'Red' ? 'Red - At Risk' : p.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track';
    const dates = (p.timelineDates || {}) as Partial<TimelineDates>;

    html += `
      <div class="project-card">
        <div class="project-title">
          [${p.id}] ${p.name} 
          <span class="badge ${badgeStyle}">${labelStatus}</span>
        </div>
        
        <p style="font-size: 12px; margin-top: 5px;">
          <strong>Description:</strong> ${p.description || 'No description provided.'}<br/>
          <strong>Severity Impact:</strong> ${p.severity} | <strong>Project Lead (PM):</strong> ${p.pmName} | <strong>App Owner:</strong> ${p.applicationOwnerName || '—'}
        </p>

        <h3>Registered Stakeholders Registry</h3>
        <table>
          <thead>
            <tr>
              <th width="150">Role</th>
              <th width="150">Name</th>
              <th width="100">Employee ID</th>
              <th width="150">Department</th>
              <th width="100">Permissions</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (p.stakeholders && p.stakeholders.length > 0) {
      p.stakeholders.forEach(s => {
        html += `
            <tr>
              <td class="bold">${s.roleType}</td>
              <td>${s.name || '—'}</td>
              <td class="font-mono">${s.employeeId || '—'}</td>
              <td>${s.department || '—'}</td>
              <td>${s.access}</td>
            </tr>
        `;
      });
    } else {
      html += `
            <tr>
              <td colspan="5" class="text-slate" style="text-align: center;">No registered stakeholders found for this project.</td>
            </tr>
      `;
    }

    html += `
          </tbody>
        </table>

        <h3>Milestone Timeline Dates</h3>
        <table>
          <thead>
            <tr>
              <th>Phase / Milestone Item</th>
              <th style="text-align: center;">Planned Start</th>
              <th style="text-align: center;">Actual Start</th>
              <th style="text-align: center;">Planned End</th>
              <th style="text-align: center;">Actual End</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bold">Project Kick-Off</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.projectKickOff)}</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
            </tr>
            <tr>
              <td class="bold">URD Sign-Off</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.urdSignOff)}</td>
            </tr>
            <tr>
              <td class="bold">Business Requirements (BRD)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedBrdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualBrdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedBrdEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualBrdEnd)}</td>
            </tr>
            <tr>
              <td class="bold">Functional Specifications (FSD)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedFsdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualFsdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedFsdEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualFsdEnd)}</td>
            </tr>
            <tr>
              <td class="bold">Development Phase</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedDevStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualDevStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedDevEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualDevEnd)}</td>
            </tr>
            <tr>
              <td class="bold">System Integration Testing (SIT)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedSitStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualSitStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedSitEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualSitEnd)}</td>
            </tr>
            <tr>
              <td class="bold">User Acceptance Testing (UAT)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedUatStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualUatStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedUatEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualUatEnd)}</td>
            </tr>
            <tr>
              <td class="bold">Go-Live & Rollout</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedGoLive)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualGoLive)}</td>
            </tr>
          </tbody>
        </table>

        <h3>Active Risks & Mitigations</h3>
        <table>
          <thead>
            <tr>
              <th width="30">#</th>
              <th width="250">Risk Description</th>
              <th width="100">Owner</th>
              <th width="150">ETA</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (p.risks && p.risks.length > 0) {
      p.risks.forEach((r, rIdx) => {
        html += `
            <tr>
              <td style="text-align: center;">${rIdx + 1}</td>
              <td class="bold">${r.risk}</td>
              <td>${r.owner || '—'}</td>
              <td>${r.eta || '—'}</td>
            </tr>
        `;
      });
    } else {
      html += `
            <tr>
              <td colspan="4" class="text-slate" style="text-align: center;">No active risks registered.</td>
            </tr>
      `;
    }

    html += `
          </tbody>
        </table>

        <h3>Logged Project Delays</h3>
        <table>
          <thead>
            <tr>
              <th width="30">#</th>
              <th width="300">Reason for Delay</th>
              <th width="100">Owner</th>
              <th width="100">Impacted Week</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (p.delays && p.delays.length > 0) {
      p.delays.forEach((d, dIdx) => {
        html += `
            <tr>
              <td style="text-align: center;">${dIdx + 1}</td>
              <td class="bold">${d.reason}</td>
              <td>${d.owner || '—'}</td>
              <td style="text-align: center;">${d.impactedWeek || '—'}</td>
            </tr>
        `;
      });
    } else {
      html += `
            <tr>
              <td colspan="4" class="text-slate" style="text-align: center;">No logged delays reported.</td>
            </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  html += `
    </body>
    </html>
  `;

  return html;
}

// 3. LEGACY CSV REPORT
export function generateProjectReportCSV(projects: Project[]): string {
  const total = projects.length;
  const redCount = projects.filter(p => p.ragStatus === 'Red').length;
  const amberCount = projects.filter(p => p.ragStatus === 'Amber').length;
  const greenCount = projects.filter(p => p.ragStatus === 'Green').length;

  const csvRows: string[] = [];

  csvRows.push('STRATOSPM - PROJECT MANAGEMENT PORTFOLIO REPORT');
  csvRows.push(`Report Generated On: ${formatDate(new Date())} ${new Date().toLocaleTimeString()}`);
  csvRows.push('');
  csvRows.push('--- DASHBOARD STATUS SUMMARY ---');
  csvRows.push(`Total Managed Projects,${total}`);
  csvRows.push(`RED (At Risk),${redCount},(${(total ? (redCount / total) * 100 : 0).toFixed(1)}%)`);
  csvRows.push(`AMBER (Slight Delay),${amberCount},(${(total ? (amberCount / total) * 100 : 0).toFixed(1)}%)`);
  csvRows.push(`GREEN (On-Track),${greenCount},(${(total ? (greenCount / total) * 100 : 0).toFixed(1)}%)`);
  
  // High-fidelity Pie Chart text visualizer for CSV
  const redBar = total ? Math.round((redCount / total) * 20) : 0;
  const amberBar = total ? Math.round((amberCount / total) * 20) : 0;
  const greenBar = total ? Math.round((greenCount / total) * 20) : 0;
  const chartBar = '🟢'.repeat(greenBar) + '🟡'.repeat(amberBar) + '🔴'.repeat(redBar);
  csvRows.push(`Portfolio Health Pie-Chart Indicator,"${chartBar} (Green: ${greenCount} | Amber: ${amberCount} | Red: ${redCount})"`);
  csvRows.push('');

  csvRows.push('--- MANAGED PROJECTS INVENTORY ---');
  csvRows.push('Project ID,RAG Status,Project Name,Severity,Go-Live Date,PM Leader,Application Owner,Jira Link,Requirements Status');
  
  projects.forEach(p => {
    const reqStatus = p.requirements.isCompleted ? 'Signed Off' : 'Pending';
    const escapedName = p.name.replace(/"/g, '""');
    const escapedOwner = p.applicationOwnerName.replace(/"/g, '""');
    const escapedPM = p.pmName.replace(/"/g, '""');
    const ragLabel = p.ragStatus === 'Red' ? 'Red - At Risk' : p.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track';
    csvRows.push(`${p.id},"${ragLabel}","${escapedName}",${p.severity},${p.deliveryDate || 'N/A'},"${escapedPM}","${escapedOwner}","${p.jiraLink}",${reqStatus}`);
  });

  return csvRows.join('\n');
}

// Trigger Client Downloads
export function downloadFile(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCSV(csvContent: string, fileName: string = 'EquitasPM_Portfolio_Report.csv') {
  downloadFile(csvContent, 'text/csv;charset=utf-8;', fileName);
}

export function downloadExcel(excelContent: string, fileName: string = 'EquitasPM_Portfolio_Report.xls') {
  downloadFile(excelContent, 'application/vnd.ms-excel;charset=utf-8;', fileName);
}

export function downloadWord(wordContent: string, fileName: string = 'EquitasPM_Portfolio_Report.doc') {
  downloadFile(wordContent, 'application/msword;charset=utf-8;', fileName);
}

export function downloadMPP(xmlContent: string, fileName: string = 'EquitasPM_Project_Plan.xml') {
  downloadFile(xmlContent, 'application/xml;charset=utf-8;', fileName);
}

// GENERATE INDIVIDUAL PROJECT MPP-COMPATIBLE XML REPORT (MSPDI Schema)
export function generateSingleProjectMPP(p: Project): string {
  function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  function getDurationString(start: string, finish: string): string {
    if (!start || !finish) return 'PT8H0M0S';
    const sDate = new Date(start);
    const fDate = new Date(finish);
    const diffTime = fDate.getTime() - sDate.getTime();
    if (isNaN(diffTime) || diffTime < 0) return 'PT8H0M0S';
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const hours = diffDays * 8;
    return `PT${hours}H0M0S`;
  }

  const nameEscaped = escapeXml(p.name);
  const descEscaped = escapeXml(p.description);
  const managerEscaped = escapeXml(p.pmName || 'Vinothraj');
  const companyEscaped = 'Equitas Small Finance Bank';
  const startStr = p.timelineDates?.projectKickOff ? `${p.timelineDates.projectKickOff}T08:00:00` : '2026-01-01T08:00:00';
  const finishStr = p.deliveryDate ? `${p.deliveryDate}T17:00:00` : '2026-12-31T17:00:00';

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${nameEscaped}</Name>
  <Title>${nameEscaped}</Title>
  <Subject>${descEscaped}</Subject>
  <Manager>${managerEscaped}</Manager>
  <Company>${companyEscaped}</Company>
  <StartDate>${startStr}</StartDate>
  <FinishDate>${finishStr}</FinishDate>
  <CalendarUID>1</CalendarUID>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultEndTime>17:00:00</DefaultEndTime>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard</Name>
      <IsBaseCalendar>1</IsBaseCalendar>
      <BaseCalendarUID>-1</BaseCalendarUID>
    </Calendar>
  </Calendars>
  <Tasks>
`;

  let tasksToExport: {
    uid: number;
    name: string;
    start: string;
    finish: string;
    outlineLevel: number;
    percentComplete: number;
    milestone: number;
    assignedTo: string;
  }[] = [];

  let nextUid = 1;

  if (p.tasks && p.tasks.length > 0) {
    p.tasks.forEach(task => {
      const parentUid = nextUid++;
      tasksToExport.push({
        uid: parentUid,
        name: task.name,
        start: task.startDate,
        finish: task.finishDate,
        outlineLevel: 1,
        percentComplete: 0,
        milestone: 0,
        assignedTo: task.assignedTo || ''
      });

      if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(sub => {
          tasksToExport.push({
            uid: nextUid++,
            name: sub.name,
            start: sub.startDate,
            finish: sub.finishDate,
            outlineLevel: 2,
            percentComplete: 0,
            milestone: 0,
            assignedTo: sub.assignedTo || ''
          });
        });
      }
    });
  } else {
    const dates = (p.timelineDates || {}) as Partial<TimelineDates>;
    
    // Summary Parent
    const summaryUid = nextUid++;
    tasksToExport.push({
      uid: summaryUid,
      name: p.name,
      start: dates.projectKickOff || '2026-01-01',
      finish: p.deliveryDate || '2026-12-31',
      outlineLevel: 1,
      percentComplete: 0,
      milestone: 0,
      assignedTo: p.pmName || ''
    });

    // 1. Kick-off
    if (dates.projectKickOff) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'Project Kick-off Milestone',
        start: dates.projectKickOff,
        finish: dates.projectKickOff,
        outlineLevel: 2,
        percentComplete: 100,
        milestone: 1,
        assignedTo: p.pmName || ''
      });
    }

    // 2. BRD
    if (dates.plannedBrdStart && dates.plannedBrdEnd) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'Business Requirements Phase (BRD)',
        start: dates.actualBrdStart || dates.plannedBrdStart,
        finish: dates.actualBrdEnd || dates.plannedBrdEnd,
        outlineLevel: 2,
        percentComplete: dates.actualBrdEnd ? 100 : 50,
        milestone: 0,
        assignedTo: p.requirements?.brd?.assignedTo || p.pmName || ''
      });
    }

    // 3. FSD
    if (dates.plannedFsdStart && dates.plannedFsdEnd) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'Functional Specification Phase (FSD)',
        start: dates.actualFsdStart || dates.plannedFsdStart,
        finish: dates.actualFsdEnd || dates.plannedFsdEnd,
        outlineLevel: 2,
        percentComplete: dates.actualFsdEnd ? 100 : 0,
        milestone: 0,
        assignedTo: p.requirements?.fsd?.assignedTo || p.pmName || ''
      });
    }

    // 4. Dev
    if (dates.plannedDevStart && dates.plannedDevEnd) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'Development Phase',
        start: dates.actualDevStart || dates.plannedDevStart,
        finish: dates.actualDevEnd || dates.plannedDevEnd,
        outlineLevel: 2,
        percentComplete: dates.actualDevEnd ? 100 : 0,
        milestone: 0,
        assignedTo: p.developmentPhase?.assignedTo || p.pmName || ''
      });
    }

    // 5. SIT
    if (dates.plannedSitStart && dates.plannedSitEnd) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'System Integration Testing (SIT)',
        start: dates.actualSitStart || dates.plannedSitStart,
        finish: dates.actualSitEnd || dates.plannedSitEnd,
        outlineLevel: 2,
        percentComplete: dates.actualSitEnd ? 100 : 0,
        milestone: 0,
        assignedTo: p.pmName || ''
      });
    }

    // 6. UAT
    if (dates.plannedUatStart && dates.plannedUatEnd) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'User Acceptance Testing (UAT)',
        start: dates.actualUatStart || dates.plannedUatStart,
        finish: dates.actualUatEnd || dates.plannedUatEnd,
        outlineLevel: 2,
        percentComplete: dates.actualUatEnd ? 100 : 0,
        milestone: 0,
        assignedTo: p.pmName || ''
      });
    }

    // 7. Go Live
    if (p.deliveryDate) {
      tasksToExport.push({
        uid: nextUid++,
        name: 'Go-Live / Production Rollout',
        start: dates.actualGoLive || p.deliveryDate,
        finish: dates.actualGoLive || p.deliveryDate,
        outlineLevel: 2,
        percentComplete: dates.actualGoLive ? 100 : 0,
        milestone: 1,
        assignedTo: p.pmName || ''
      });
    }
  }

  tasksToExport.forEach(task => {
    const tName = escapeXml(task.name);
    const tStart = task.start ? `${task.start}T08:00:00` : startStr;
    const tFinish = task.finish ? `${task.finish}T17:00:00` : finishStr;
    const durationStr = getDurationString(task.start, task.finish);
    const assigned = escapeXml(task.assignedTo);

    xml += `    <Task>
      <UID>${task.uid}</UID>
      <ID>${task.uid}</ID>
      <Name>${tName}</Name>
      <Type>0</Type>
      <Start>${tStart}</Start>
      <Finish>${tFinish}</Finish>
      <Duration>${durationStr}</Duration>
      <OutlineLevel>${task.outlineLevel}</OutlineLevel>
      <PercentComplete>${task.percentComplete}</PercentComplete>
      <Milestone>${task.milestone}</Milestone>
      <Priority>500</Priority>
      <Contact>${assigned}</Contact>
    </Task>\n`;
  });

  xml += `  </Tasks>
</Project>`;

  return xml;
}

// 4. GENERATE INDIVIDUAL PROJECT EXCEL-COMPATIBLE HTML REPORT
export function generateSingleProjectExcelReport(p: Project): string {
  const dates = (p.timelineDates || {}) as Partial<TimelineDates>;
  const rClass = p.ragStatus === 'Red' ? 'rag-red' : p.ragStatus === 'Amber' ? 'rag-amber' : 'rag-green';
  const stakeholdersStr = p.stakeholders
    .map(s => `${s.name} (${s.roleType}${s.department ? `, ${s.department}` : ''})`)
    .join('; ');

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 11px; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 12px; }
        
        .title-header { font-size: 18px; font-weight: bold; color: #0a3a82; padding: 15px 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-bottom: 15px; }
        
        .section-header { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
        .rag-red { background-color: #fef2f2; color: #991b1b; font-weight: bold; border-left: 4px solid #ef4444; }
        .rag-amber { background-color: #fffbeb; color: #92400e; font-weight: bold; border-left: 4px solid #f59e0b; }
        .rag-green { background-color: #ecfdf5; color: #065f46; font-weight: bold; border-left: 4px solid #10b981; }
        
        .font-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .bg-light { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="title-header">EQUITASPM - INDIVIDUAL PROJECT STATUS REPORT</div>
      <div class="subtitle">Generated on: ${formatDate(new Date())} at ${new Date().toLocaleTimeString()}</div>

      <div class="section-header">Project Overview: ${p.name} [${p.id}]</div>
      <table style="border: none; width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="border: none; padding: 0; vertical-align: top;">
            <table style="width: 100%; margin-bottom: 0;">
              <tr>
                <th width="200">Parameter</th>
                <th>Details</th>
              </tr>
              <tr>
                <td class="font-bold">Project ID</td>
                <td>${p.id}</td>
              </tr>
              <tr>
                <td class="font-bold">Project Name</td>
                <td>${p.name}</td>
              </tr>
              <tr>
                <td class="font-bold">RAG Status</td>
                <td class="${rClass}">${p.ragStatus === 'Red' ? 'RED - AT RISK' : p.ragStatus === 'Amber' ? 'AMBER - SLIGHT DELAY' : 'GREEN - ON-TRACK'}</td>
              </tr>
              <tr>
                <td class="font-bold">Severity</td>
                <td>${p.severity}</td>
              </tr>
              <tr>
                <td class="font-bold">PM Leader</td>
                <td>${p.pmName}</td>
              </tr>
              <tr>
                <td class="font-bold">Application Owner</td>
                <td>${p.applicationOwnerName || '—'}</td>
              </tr>
              <tr>
                <td class="font-bold">Scope & Description</td>
                <td>${p.description || 'No description provided.'}</td>
              </tr>
              <tr>
                <td class="font-bold">Jira / Workspace ID</td>
                <td>${p.jiraLink || '—'}</td>
              </tr>
              <tr>
                <td class="font-bold">Registered Stakeholders</td>
                <td>${stakeholdersStr || '—'}</td>
              </tr>
            </table>
          </td>
          <td style="border: none; padding: 0 0 0 20px; vertical-align: middle;" width="160">
            <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; text-align: center; width: 140px;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Project Health</div>
              ${generateExcelPieChart(p.ragStatus === 'Red' ? 1 : 0, p.ragStatus === 'Amber' ? 1 : 0, p.ragStatus === 'Green' ? 1 : 0, 110)}
              <div style="font-size: 11px; font-weight: bold; margin-top: 8px; color: ${p.ragStatus === 'Red' ? '#ef4444' : p.ragStatus === 'Amber' ? '#f59e0b' : '#10b981'}; text-transform: uppercase;">${p.ragStatus === 'Red' ? 'Red - At Risk' : p.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}</div>
            </div>
          </td>
        </tr>
      </table>

      <div class="section-header">Timeline & Milestones</div>
      <table>
        <thead>
          <tr>
            <th>Phase / Milestone</th>
            <th class="text-center">Planned Start</th>
            <th class="text-center">Actual Start</th>
            <th class="text-center">Planned End</th>
            <th class="text-center">Actual End</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-bold">Project Kick-Off</td>
            <td class="text-center">—</td>
            <td class="text-center">${formatDate(dates.projectKickOff)}</td>
            <td class="text-center">—</td>
            <td class="text-center">—</td>
          </tr>
          <tr>
            <td class="font-bold">URD Sign-Off</td>
            <td class="text-center">—</td>
            <td class="text-center">—</td>
            <td class="text-center">—</td>
            <td class="text-center">${formatDate(dates.urdSignOff)}</td>
          </tr>
          <tr>
            <td class="font-bold">BRD Phase</td>
            <td class="text-center">${formatDate(dates.plannedBrdStart)}</td>
            <td class="text-center">${formatDate(dates.actualBrdStart)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedBrdEnd)}</td>
            <td class="text-center">${formatDate(dates.actualBrdEnd)}</td>
          </tr>
          <tr>
            <td class="font-bold">FSD Phase</td>
            <td class="text-center">${formatDate(dates.plannedFsdStart)}</td>
            <td class="text-center">${formatDate(dates.actualFsdStart)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedFsdEnd)}</td>
            <td class="text-center">${formatDate(dates.actualFsdEnd)}</td>
          </tr>
          <tr>
            <td class="font-bold">Development Phase</td>
            <td class="text-center">${formatDate(dates.plannedDevStart)}</td>
            <td class="text-center">${formatDate(dates.actualDevStart)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedDevEnd)}</td>
            <td class="text-center">${formatDate(dates.actualDevEnd)}</td>
          </tr>
          <tr>
            <td class="font-bold">SIT Testing</td>
            <td class="text-center">${formatDate(dates.plannedSitStart)}</td>
            <td class="text-center">${formatDate(dates.actualSitStart)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedSitEnd)}</td>
            <td class="text-center">${formatDate(dates.actualSitEnd)}</td>
          </tr>
          <tr>
            <td class="font-bold">UAT Testing</td>
            <td class="text-center">${formatDate(dates.plannedUatStart)}</td>
            <td class="text-center">${formatDate(dates.actualUatStart)}</td>
            <td class="text-center bg-light">${formatDate(dates.plannedUatEnd)}</td>
            <td class="text-center">${formatDate(dates.actualUatEnd)}</td>
          </tr>
          <tr>
            <td class="font-bold" style="background-color: #eff6ff;">Go-Live & Rollout</td>
            <td class="text-center" style="background-color: #eff6ff;">—</td>
            <td class="text-center" style="background-color: #eff6ff;">—</td>
            <td class="text-center font-bold" style="background-color: #eff6ff;">${formatDate(dates.plannedGoLive)}</td>
            <td class="text-center font-bold" style="background-color: #eff6ff;">${formatDate(dates.actualGoLive)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-header">Active Risks & Mitigations</div>
      <table>
        <thead>
          <tr>
            <th width="40">No.</th>
            <th>Risk Description</th>
            <th width="150">Owner</th>
            <th>ETA</th>
          </tr>
        </thead>
        <tbody>
          ${(p.risks && p.risks.length > 0) ? p.risks.map((r, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td class="font-bold">${r.risk}</td>
              <td>${r.owner || '—'}</td>
              <td>${r.eta || '—'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="4" class="text-center" style="color: #64748b; font-style: italic;">No active risks registered.</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="section-header">Logged Project Delays</div>
      <table>
        <thead>
          <tr>
            <th width="40">No.</th>
            <th>Reason for Delay</th>
            <th width="150">Owner</th>
            <th width="150" class="text-center">Impacted Week</th>
          </tr>
        </thead>
        <tbody>
          ${(p.delays && p.delays.length > 0) ? p.delays.map((d, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td class="font-bold">${d.reason}</td>
              <td>${d.owner || '—'}</td>
              <td class="text-center">${d.impactedWeek || '—'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="4" class="text-center" style="color: #64748b; font-style: italic;">No logged delays reported.</td>
            </tr>
          `}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
}

// 5. GENERATE INDIVIDUAL PROJECT WORD-COMPATIBLE EXECUTIVE SUMMARY
export function generateSingleProjectWordReport(p: Project): string {
  const dates = (p.timelineDates || {}) as Partial<TimelineDates>;
  const badgeStyle = p.ragStatus === 'Red' ? 'badge-red' : p.ragStatus === 'Amber' ? 'badge-amber' : 'badge-green';

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>EquitasPM Single Project Status Report</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.5; color: #1e293b; padding: 20px; }
        h1 { color: #0a3a82; font-size: 24px; border-bottom: 2px solid #e11b22; padding-bottom: 8px; margin-bottom: 5px; }
        h2 { color: #0f172a; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        h3 { color: #2563eb; font-size: 13px; margin-top: 15px; margin-bottom: 5px; }
        
        .meta-text { font-size: 11px; color: #64748b; margin-bottom: 20px; }
        
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
        
        .badge { display: inline-block; padding: 3px 8px; font-weight: bold; font-size: 10px; border-radius: 4px; text-transform: uppercase; }
        .badge-red { background-color: #fee2e2; color: #991b1b; }
        .badge-amber { background-color: #fef3c7; color: #92400e; }
        .badge-green { background-color: #d1fae5; color: #065f46; }
        
        .project-card { border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 25px; border-radius: 8px; background-color: #ffffff; }
        .project-title { font-size: 18px; font-weight: bold; color: #0a3a82; margin-bottom: 10px; }
        .bold { font-weight: bold; }
        .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
        .text-slate { color: #64748b; }
      </style>
    </head>
    <body>
      <h1>EQUITASPM - SINGLE PROJECT STATUS BRIEF</h1>
      <div class="meta-text">Generated On: ${formatDate(new Date())} at ${new Date().toLocaleTimeString()}</div>

      <table class="project-card" style="width: 100%; border: 1px solid #cbd5e1; background-color: #ffffff; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="border: none; padding: 15px; vertical-align: top;">
            <div class="project-title">
              [${p.id}] ${p.name} 
              <span class="badge ${badgeStyle}">${p.ragStatus === 'Red' ? 'Red - At Risk' : p.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}</span>
            </div>
            
            <p style="font-size: 12px; margin-top: 10px; line-height: 1.6;">
              <strong>Description:</strong> ${p.description || 'No description provided.'}<br/>
              <strong>Severity Impact:</strong> <strong>${p.severity}</strong><br/>
              <strong>Project Lead (PM):</strong> ${p.pmName}<br/>
              <strong>Application Owner:</strong> ${p.applicationOwnerName || '—'}
            </p>
          </td>
          <td style="border: none; padding: 15px; width: 130px; text-align: center; vertical-align: middle;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; width: 110px; display: inline-block;">
              <div style="font-size: 9px; font-weight: bold; color: #64748b; margin-bottom: 5px; text-transform: uppercase;">Health Index</div>
              ${generateSvgPieChart(p.ragStatus === 'Red' ? 1 : 0, p.ragStatus === 'Amber' ? 1 : 0, p.ragStatus === 'Green' ? 1 : 0, 90)}
              <div style="font-size: 10px; font-weight: bold; margin-top: 5px; color: ${p.ragStatus === 'Red' ? '#ef4444' : p.ragStatus === 'Amber' ? '#f59e0b' : '#10b981'}; text-transform: uppercase;">${p.ragStatus === 'Red' ? 'AT RISK' : p.ragStatus === 'Amber' ? 'SLIGHT DELAY' : 'ON-TRACK'}</div>
            </div>
          </td>
        </tr>
      </table>

        <h2>Registered Stakeholders Registry</h2>
        <table>
          <thead>
            <tr>
              <th width="150">Role</th>
              <th width="150">Name</th>
              <th width="100">Employee ID</th>
              <th width="150">Department</th>
              <th width="100">Permissions</th>
            </tr>
          </thead>
          <tbody>
    `;

  if (p.stakeholders && p.stakeholders.length > 0) {
    p.stakeholders.forEach(s => {
      html += `
            <tr>
              <td class="bold">${s.roleType}</td>
              <td>${s.name || '—'}</td>
              <td class="font-mono">${s.employeeId || '—'}</td>
              <td>${s.department || '—'}</td>
              <td>${s.access}</td>
            </tr>
      `;
    });
  } else {
    html += `
            <tr>
              <td colspan="5" class="text-slate" style="text-align: center;">No registered stakeholders found for this project.</td>
            </tr>
    `;
  }

  html += `
          </tbody>
        </table>

        <h2>Milestone Timeline Dates</h2>
        <table>
          <thead>
            <tr>
              <th>Phase / Milestone Item</th>
              <th style="text-align: center;">Planned Start</th>
              <th style="text-align: center;">Actual Start</th>
              <th style="text-align: center;">Planned End</th>
              <th style="text-align: center;">Actual End</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bold">Project Kick-Off</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.projectKickOff)}</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
            </tr>
            <tr>
              <td class="bold">URD Sign-Off</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.urdSignOff)}</td>
            </tr>
            <tr>
              <td class="bold">Business Requirements (BRD)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedBrdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualBrdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedBrdEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualBrdEnd)}</td>
            </tr>
            <tr>
              <td class="bold">Functional Specifications (FSD)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedFsdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualFsdStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedFsdEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualFsdEnd)}</td>
            </tr>
            <tr>
              <td class="bold">Development Phase</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedDevStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualDevStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedDevEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualDevEnd)}</td>
            </tr>
            <tr>
              <td class="bold">System Integration Testing (SIT)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedSitStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualSitStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedSitEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualSitEnd)}</td>
            </tr>
            <tr>
              <td class="bold">User Acceptance Testing (UAT)</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedUatStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualUatStart)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedUatEnd)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualUatEnd)}</td>
            </tr>
            <tr>
              <td class="bold">Go-Live & Rollout</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;">—</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.plannedGoLive)}</td>
              <td style="text-align: center;" class="font-mono">${formatDate(dates.actualGoLive)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Active Risks & Mitigations</h2>
        <table>
          <thead>
            <tr>
              <th width="30">#</th>
              <th width="250">Risk Description</th>
              <th width="100">Owner</th>
              <th width="150">ETA</th>
            </tr>
          </thead>
          <tbody>
    `;

  if (p.risks && p.risks.length > 0) {
    p.risks.forEach((r, rIdx) => {
      html += `
            <tr>
              <td style="text-align: center;">${rIdx + 1}</td>
              <td class="bold">${r.risk}</td>
              <td>${r.owner || '—'}</td>
              <td>${r.eta || '—'}</td>
            </tr>
      `;
    });
  } else {
    html += `
            <tr>
              <td colspan="4" class="text-slate" style="text-align: center;">No active risks registered.</td>
            </tr>
    `;
  }

  html += `
          </tbody>
        </table>

        <h2>Logged Project Delays</h2>
        <table>
          <thead>
            <tr>
              <th width="30">#</th>
              <th width="300">Reason for Delay</th>
              <th width="100">Owner</th>
              <th width="100">Impacted Week</th>
            </tr>
          </thead>
          <tbody>
    `;

  if (p.delays && p.delays.length > 0) {
    p.delays.forEach((d, dIdx) => {
      html += `
            <tr>
              <td style="text-align: center;">${dIdx + 1}</td>
              <td class="bold">${d.reason}</td>
              <td>${d.owner || '—'}</td>
              <td style="text-align: center;">${d.impactedWeek || '—'}</td>
            </tr>
      `;
    });
  } else {
    html += `
            <tr>
              <td colspan="4" class="text-slate" style="text-align: center;">No logged delays reported.</td>
            </tr>
    `;
  }

  html += `
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  return html;
}

// 6. GENERATE INDIVIDUAL PROJECT CSV DATA
export function generateSingleProjectCSV(p: Project): string {
  const dates = (p.timelineDates || {}) as Partial<TimelineDates>;
  const csvRows: string[] = [];

  csvRows.push(`EQUITASPM - SINGLE PROJECT STATUS REPORT: ${p.name.toUpperCase()}`);
  csvRows.push(`Report Generated On: ${formatDate(new Date())} ${new Date().toLocaleTimeString()}`);
  csvRows.push('');
  
  csvRows.push('--- PROJECT DETAILS ---');
  csvRows.push(`Project ID,${p.id}`);
  csvRows.push(`Project Name,"${p.name.replace(/"/g, '""')}"`);
  csvRows.push(`RAG Status,${p.ragStatus === 'Red' ? 'Red - At Risk' : p.ragStatus === 'Amber' ? 'Amber - Slight Delay' : 'Green - On-Track'}`);
  
  // Single Project health pie-chart text visualizer
  const singleBar = p.ragStatus === 'Red' ? '🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴' : p.ragStatus === 'Amber' ? '🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡' : '🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢';
  csvRows.push(`Project Health Pie-Chart Indicator,"${singleBar} (${p.ragStatus.toUpperCase()})"`);
  
  csvRows.push(`Severity,${p.severity}`);
  csvRows.push(`PM Leader,"${p.pmName.replace(/"/g, '""')}"`);
  csvRows.push(`Application Owner,"${p.applicationOwnerName.replace(/"/g, '""')}"`);
  csvRows.push(`Jira Link,"${p.jiraLink}"`);
  csvRows.push(`Description,"${p.description.replace(/"/g, '""')}"`);
  csvRows.push('');

  csvRows.push('--- MILESTONE TIMELINE ---');
  csvRows.push('Milestone / Phase,Planned Start,Actual Start,Planned End,Actual End');
  csvRows.push(`Project Kick-Off,N/A,${formatDate(dates.projectKickOff)},N/A,N/A`);
  csvRows.push(`URD Sign-Off,N/A,N/A,N/A,${formatDate(dates.urdSignOff)}`);
  csvRows.push(`Business Requirements (BRD),${formatDate(dates.plannedBrdStart)},${formatDate(dates.actualBrdStart)},${formatDate(dates.plannedBrdEnd)},${formatDate(dates.actualBrdEnd)}`);
  csvRows.push(`Functional Specifications (FSD),${formatDate(dates.plannedFsdStart)},${formatDate(dates.actualFsdStart)},${formatDate(dates.plannedFsdEnd)},${formatDate(dates.actualFsdEnd)}`);
  csvRows.push(`Development Phase,${formatDate(dates.plannedDevStart)},${formatDate(dates.actualDevStart)},${formatDate(dates.plannedDevEnd)},${formatDate(dates.actualDevEnd)}`);
  csvRows.push(`System Integration Testing (SIT),${formatDate(dates.plannedSitStart)},${formatDate(dates.actualSitStart)},${formatDate(dates.plannedSitEnd)},${formatDate(dates.actualSitEnd)}`);
  csvRows.push(`User Acceptance Testing (UAT),${formatDate(dates.plannedUatStart)},${formatDate(dates.actualUatStart)},${formatDate(dates.plannedUatEnd)},${formatDate(dates.actualUatEnd)}`);
  csvRows.push(`Go-Live & Rollout,N/A,N/A,${formatDate(dates.plannedGoLive)},${formatDate(dates.actualGoLive)}`);
  csvRows.push('');

  csvRows.push('--- REGISTERED STAKEHOLDERS ---');
  csvRows.push('Role,Name,Employee ID,Department,Permissions');
  if (p.stakeholders && p.stakeholders.length > 0) {
    p.stakeholders.forEach(s => {
      csvRows.push(`"${s.roleType}","${(s.name || '').replace(/"/g, '""')}","${s.employeeId || ''}","${(s.department || '').replace(/"/g, '""')}","${s.access}"`);
    });
  } else {
    csvRows.push('No registered stakeholders');
  }
  csvRows.push('');

  csvRows.push('--- ACTIVE RISKS & ETAs ---');
  csvRows.push('Risk Description,Owner,ETA');
  if (p.risks && p.risks.length > 0) {
    p.risks.forEach(r => {
      csvRows.push(`"${r.risk.replace(/"/g, '""')}","${(r.owner || '').replace(/"/g, '""')}","${(r.eta || '').replace(/"/g, '""')}"`);
    });
  } else {
    csvRows.push('No active risks');
  }
  csvRows.push('');

  csvRows.push('--- LOGGED PROJECT DELAYS ---');
  csvRows.push('Reason for Delay,Owner,Impacted Week');
  if (p.delays && p.delays.length > 0) {
    p.delays.forEach(d => {
      csvRows.push(`"${d.reason.replace(/"/g, '""')}","${(d.owner || '').replace(/"/g, '""')}","${(d.impactedWeek || '').replace(/"/g, '""')}"`);
    });
  } else {
    csvRows.push('No logged delays');
  }

  return csvRows.join('\n');
}

