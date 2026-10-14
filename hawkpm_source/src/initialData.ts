import { Project } from './types';

const INITIAL_TIMELINE_DATES_EP00001 = {
  projectKickOff: "2026-04-01",
  urdSignOff: "2026-04-25",
  plannedBrdStart: "2026-04-12",
  actualBrdStart: "2026-04-15",
  plannedBrdEnd: "2026-05-10",
  actualBrdEnd: "",
  plannedFsdStart: "2026-05-15",
  actualFsdStart: "",
  plannedFsdEnd: "2026-06-15",
  actualFsdEnd: "",
  plannedDevStart: "2026-06-20",
  actualDevStart: "",
  plannedDevEnd: "2026-10-01",
  actualDevEnd: "",
  plannedSitStart: "2026-10-02",
  actualSitStart: "",
  plannedSitEnd: "2026-10-20",
  actualSitEnd: "",
  plannedUatStart: "2026-10-21",
  actualUatStart: "",
  plannedUatEnd: "2026-11-15",
  actualUatEnd: "",
  plannedGoLive: "2026-12-15",
  actualGoLive: ""
};

const INITIAL_TIMELINE_DATES_EP00002 = {
  projectKickOff: "2026-02-01",
  urdSignOff: "2026-02-12",
  plannedBrdStart: "2026-02-15",
  actualBrdStart: "2026-02-14",
  plannedBrdEnd: "2026-02-28",
  actualBrdEnd: "2026-02-28",
  plannedFsdStart: "2026-03-01",
  actualFsdStart: "2026-03-01",
  plannedFsdEnd: "2026-03-10",
  actualFsdEnd: "2026-03-10",
  plannedDevStart: "2026-03-15",
  actualDevStart: "2026-03-15",
  plannedDevEnd: "2026-07-15",
  actualDevEnd: "",
  plannedSitStart: "2026-07-16",
  actualSitStart: "",
  plannedSitEnd: "2026-08-05",
  actualSitEnd: "",
  plannedUatStart: "2026-08-06",
  actualUatStart: "",
  plannedUatEnd: "2026-09-01",
  actualUatEnd: "",
  plannedGoLive: "2026-09-30",
  actualGoLive: ""
};

const INITIAL_TIMELINE_DATES_EP00003 = {
  projectKickOff: "2026-01-02",
  urdSignOff: "2026-01-15",
  plannedBrdStart: "2026-01-16",
  actualBrdStart: "2026-01-16",
  plannedBrdEnd: "2026-02-05",
  actualBrdEnd: "2026-02-05",
  plannedFsdStart: "2026-02-06",
  actualFsdStart: "2026-02-15",
  plannedFsdEnd: "2026-02-25",
  actualFsdEnd: "2026-02-25",
  plannedDevStart: "2026-03-01",
  actualDevStart: "2026-03-01",
  plannedDevEnd: "2026-06-01",
  actualDevEnd: "2026-06-01",
  plannedSitStart: "2026-06-02",
  actualSitStart: "2026-06-02",
  plannedSitEnd: "2026-07-15",
  actualSitEnd: "2026-07-15",
  plannedUatStart: "2026-07-16",
  actualUatStart: "2026-07-16",
  plannedUatEnd: "2026-08-20",
  actualUatEnd: "2026-08-20",
  plannedGoLive: "2026-10-30",
  actualGoLive: ""
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "EP00001",
    name: "Enterprise Core Banking Ledger Upgrade",
    description: "Legacy ledger database replacement and migration to high-performance architecture. High-risk migration path requiring multi-region data consistency verification and strict security audits.",
    severity: "High",
    methodology: "Waterfall",
    jiraLink: "https://jira.stratos.internal/browse/EP-1093",
    createdPMId: "admin",
    ragStatus: "Red",
    deliveryDate: "2026-12-15",
    applicationOwnerName: "Barani",
    pmName: "Vinothraj",
    requirementsPhaseTitle: "Requirements Phase",
    developmentPhaseTitle: "Development Phase",
    timelineDates: INITIAL_TIMELINE_DATES_EP00001,
    timelineVersions: [
      {
        version: 1,
        timestamp: "2026-04-01T10:00:00Z",
        updatedBy: "Vinothraj",
        changeSummary: "Initial project baseline timeline established.",
        dates: {
          ...INITIAL_TIMELINE_DATES_EP00001,
          plannedBrdStart: "2026-04-10",
          actualBrdStart: "",
        }
      },
      {
        version: 2,
        timestamp: "2026-04-15T14:30:00Z",
        updatedBy: "Vinothraj",
        changeSummary: "Shifted BRD planned start and logged actual start date delay due to resources.",
        dates: INITIAL_TIMELINE_DATES_EP00001
      }
    ],
    risks: [
      { id: "r1", risk: "Database locking during core migration batch job", owner: "Guhan", eta: "2026-10-15" },
      { id: "r2", risk: "Regulatory compliance audit bottleneck for ledger transaction storage", owner: "Gopi", eta: "2026-08-30" }
    ],
    delays: [
      { id: "d1", reason: "DB team resource shortage on migration testing scripts", owner: "Guhan", impactedWeek: "Week 12" }
    ],
    stakeholders: [
      { id: "s1", roleType: "Project Owner", name: "Gopi", employeeId: "EMP8890", access: "View-only" },
      { id: "s2", roleType: "Business Technology", name: "Raja", employeeId: "EMP2312", access: "View-only" },
      { id: "s3", roleType: "Application SPOC", name: "Guhan", employeeId: "EMP9087", access: "Edit" },
      { id: "s4", roleType: "Application Owner", name: "Barani", employeeId: "EMP1104", access: "Edit" }
    ],
    requirements: {
      urd: {
        id: "urd",
        name: "User Requirements Document (URD)",
        preparedOn: "2026-04-10",
        signedOffOn: "",
        signedOffStatus: "Pending",
        documentUrl: "https://docs.stratos.internal/EP00001_URD.pdf",
        attachments: ["business_signoff_request.eml"],
        approvalRounds: [
          { id: '1', assignedTo: 'Barani', status: 'Pending', approvedOn: '' },
          { id: '2', assignedTo: 'Gopi', status: 'Pending', approvedOn: '' },
          { id: '3', assignedTo: 'Vinothraj', status: 'Pending', approvedOn: '' }
        ]
      },
      brd: {
        id: "brd",
        name: "Business Requirements Document (BRD)",
        preparedOn: "2026-04-18",
        signedOffOn: "",
        signedOffStatus: "Pending",
        documentUrl: "",
        attachments: [],
        approvalRounds: [
          { id: '1', assignedTo: '', status: 'Pending', approvedOn: '' },
          { id: '2', assignedTo: '', status: 'Pending', approvedOn: '' },
          { id: '3', assignedTo: '', status: 'Pending', approvedOn: '' }
        ]
      },
      fsd: {
        id: "fsd",
        name: "Functional Specifications Document (FSD)",
        preparedOn: "",
        signedOffOn: "",
        signedOffStatus: "Pending",
        documentUrl: "",
        attachments: [],
        approvalRounds: [
          { id: '1', assignedTo: '', status: 'Pending', approvedOn: '' },
          { id: '2', assignedTo: '', status: 'Pending', approvedOn: '' },
          { id: '3', assignedTo: '', status: 'Pending', approvedOn: '' }
        ]
      },
      isCompleted: false
    },
    developmentPhase: {
      id: "dev-EP00001",
      name: "Development Phase",
      ragStatus: "Red",
      jiraId: "EP-DEV-109",
      description: "Implementing transactional safety routines. Current progress is delayed due to unexpected load-testing transaction bottlenecks in primary ledger database.",
      devCompletionDate: "2026-10-01",
      sitCompletionDate: "2026-10-20",
      uatCompletionDate: "2026-11-15",
      productionDate: "2026-12-15",
      attachments: ["performance_bottleneck_log.txt"],
      isCustom: false,
      isCollapsed: false
    },
    customPhases: []
  },
  {
    id: "EP00002",
    name: "Customer Feedback Analytics Platform",
    description: "AI-driven text mining and categorization system for omni-channel customer support feedbacks and reviews.",
    severity: "Medium",
    methodology: "Agile",
    jiraLink: "https://jira.stratos.internal/browse/EP-2241",
    createdPMId: "admin",
    ragStatus: "Amber",
    deliveryDate: "2026-09-30",
    applicationOwnerName: "Saravanan A",
    pmName: "Venkat",
    requirementsPhaseTitle: "Requirements Phase",
    developmentPhaseTitle: "Development Phase",
    timelineDates: INITIAL_TIMELINE_DATES_EP00002,
    timelineVersions: [
      {
        version: 1,
        timestamp: "2026-02-01T09:00:00Z",
        updatedBy: "Venkat",
        changeSummary: "Initial project timeline baseline.",
        dates: INITIAL_TIMELINE_DATES_EP00002
      }
    ],
    risks: [
      { id: "r3", risk: "API rate limits reached on external social feed connectors", owner: "Chandru", eta: "2026-07-25" }
    ],
    delays: [],
    stakeholders: [
      { id: "s5", roleType: "Project Owner", name: "Saravanan A", employeeId: "EMP5543", access: "Edit" },
      { id: "s6", roleType: "Business Technology", name: "Saravanan D", employeeId: "EMP4321", access: "View-only" },
      { id: "s7", roleType: "Application SPOC", name: "Mahesh", employeeId: "EMP1099", access: "Edit" },
      { id: "s8", roleType: "Application Owner", name: "Saravanan A", employeeId: "EMP5543", access: "Edit" }
    ],
    requirements: {
      urd: {
        id: "urd",
        name: "User Requirements Document (URD)",
        preparedOn: "2026-02-05",
        signedOffOn: "2026-02-12",
        signedOffStatus: "Signed Off",
        documentUrl: "https://docs.stratos.internal/EP00002_URD.pdf",
        attachments: ["marketing_director_approval.eml"],
        approvalRounds: [
          { id: '1', assignedTo: 'Saravanan A', status: 'Approved', approvedOn: '2026-02-10' },
          { id: '2', assignedTo: 'Saravanan D', status: 'Approved', approvedOn: '2026-02-11' },
          { id: '3', assignedTo: 'Venkat', status: 'Approved', approvedOn: '2026-02-12' }
        ]
      },
      brd: {
        id: "brd",
        name: "Business Requirements Document (BRD)",
        preparedOn: "2026-02-20",
        signedOffOn: "2026-02-28",
        signedOffStatus: "Signed Off",
        documentUrl: "https://docs.stratos.internal/EP00002_BRD.docx",
        attachments: ["product_lead_signoff.eml"],
        approvalRounds: [
          { id: '1', assignedTo: 'Saravanan A', status: 'Approved', approvedOn: '2026-02-25' },
          { id: '2', assignedTo: 'Saravanan D', status: 'Approved', approvedOn: '2026-02-26' },
          { id: '3', assignedTo: 'Venkat', status: 'Approved', approvedOn: '2026-02-28' }
        ]
      },
      fsd: {
        id: "fsd",
        name: "Functional Specifications Document (FSD)",
        preparedOn: "2026-03-01",
        signedOffOn: "2026-03-10",
        signedOffStatus: "Signed Off",
        documentUrl: "https://docs.stratos.internal/EP00002_FSD.pdf",
        attachments: ["arch_review_approval.pdf"],
        approvalRounds: [
          { id: '1', assignedTo: 'Saravanan A', status: 'Approved', approvedOn: '2026-03-05' },
          { id: '2', assignedTo: 'Saravanan D', status: 'Approved', approvedOn: '2026-03-08' },
          { id: '3', assignedTo: 'Venkat', status: 'Approved', approvedOn: '2026-03-10' }
        ]
      },
      isCompleted: true
    },
    developmentPhase: {
      id: "dev-EP00002",
      name: "Development Phase",
      ragStatus: "Amber",
      jiraId: "EP-DEV-224",
      description: "Frontend integration with sentiment analyzer APIs. Minor delays in API response times are being investigated, but core components are 80% complete.",
      devCompletionDate: "2026-07-15",
      sitCompletionDate: "2026-08-05",
      uatCompletionDate: "2026-09-01",
      productionDate: "2026-09-30",
      attachments: ["api_specs_v1.json"],
      isCustom: false,
      isCollapsed: false
    },
    customPhases: [
      {
        id: "cust-EP00002-1",
        name: "Model Validation Phase",
        ragStatus: "Green",
        jiraId: "EP-CUST-225",
        description: "Post-development validation of the sentiment classification accuracy against representative golden dataset.",
        devCompletionDate: "2026-08-10",
        sitCompletionDate: "2026-08-25",
        uatCompletionDate: "2026-09-10",
        productionDate: "2026-09-20",
        attachments: ["validation_report_draft.xlsx"],
        isCustom: true,
        isCollapsed: true
      }
    ]
  },
  {
    id: "EP00003",
    name: "Multi-Region Cloud Infrastructure Migration",
    description: "Re-platforming of high-throughput public website services onto secure, automated multi-region serverless infrastructure.",
    severity: "High",
    methodology: "Hybrid",
    jiraLink: "https://jira.stratos.internal/browse/EP-9912",
    createdPMId: "pm_lucas",
    ragStatus: "Green",
    deliveryDate: "2026-10-30",
    applicationOwnerName: "Chandru",
    pmName: "Deepan",
    requirementsPhaseTitle: "Requirements Phase",
    developmentPhaseTitle: "Development & Infra Provisioning",
    timelineDates: INITIAL_TIMELINE_DATES_EP00003,
    timelineVersions: [
      {
        version: 1,
        timestamp: "2026-01-02T08:30:00Z",
        updatedBy: "Deepan",
        changeSummary: "Initial project timeline baseline setup.",
        dates: INITIAL_TIMELINE_DATES_EP00003
      }
    ],
    risks: [],
    delays: [],
    stakeholders: [
      { id: "s9", roleType: "Project Owner", name: "Chandru", employeeId: "EMP7731", access: "Edit" },
      { id: "s10", roleType: "Business Technology", name: "Saravanan A", employeeId: "EMP1122", access: "Edit" },
      { id: "s11", roleType: "Application SPOC", name: "Padma", employeeId: "EMP8000", access: "View-only" },
      { id: "s12", roleType: "Application Owner", name: "Chandru", employeeId: "EMP7731", access: "Edit" }
    ],
    requirements: {
      urd: {
        id: "urd",
        name: "User Requirements Document (URD)",
        preparedOn: "2026-01-10",
        signedOffOn: "2026-01-15",
        signedOffStatus: "Signed Off",
        documentUrl: "https://docs.stratos.internal/EP00003_URD.pdf",
        attachments: ["all_stakeholders_ok.eml"],
        approvalRounds: [
          { id: '1', assignedTo: 'Chandru', status: 'Approved', approvedOn: '2026-01-12' },
          { id: '2', assignedTo: 'Padma', status: 'Approved', approvedOn: '2026-01-14' },
          { id: '3', assignedTo: 'Deepan', status: 'Approved', approvedOn: '2026-01-15' }
        ]
      },
      brd: {
        id: "brd",
        name: "Business Requirements Document (BRD)",
        preparedOn: "2026-02-01",
        signedOffOn: "2026-02-05",
        signedOffStatus: "Signed Off",
        documentUrl: "https://docs.stratos.internal/EP00003_BRD.docx",
        attachments: ["finance_vp_approval.pdf"],
        approvalRounds: [
          { id: '1', assignedTo: 'Chandru', status: 'Approved', approvedOn: '2026-02-02' },
          { id: '2', assignedTo: 'Saravanan A', status: 'Approved', approvedOn: '2026-02-04' },
          { id: '3', assignedTo: 'Deepan', status: 'Approved', approvedOn: '2026-02-05' }
        ]
      },
      fsd: {
        id: "fsd",
        name: "Functional Specifications Document (FSD)",
        preparedOn: "2026-02-15",
        signedOffOn: "2026-02-25",
        signedOffStatus: "Signed Off",
        documentUrl: "https://docs.stratos.internal/EP00003_FSD.pdf",
        attachments: ["infosec_approved.eml"],
        approvalRounds: [
          { id: '1', assignedTo: 'Chandru', status: 'Approved', approvedOn: '2026-02-20' },
          { id: '2', assignedTo: 'Padma', status: 'Approved', approvedOn: '2026-02-22' },
          { id: '3', assignedTo: 'Deepan', status: 'Approved', approvedOn: '2026-02-25' }
        ]
      },
      isCompleted: true
    },
    developmentPhase: {
      id: "dev-EP00003",
      name: "Development & Infra Provisioning",
      ragStatus: "Green",
      jiraId: "EP-DEV-991",
      description: "Terraform automation scripting for active-active multi-region cluster setup. Pipeline has been fully automated and deployment works perfectly.",
      devCompletionDate: "2026-06-01",
      sitCompletionDate: "2026-07-15",
      uatCompletionDate: "2026-08-20",
      productionDate: "2026-10-30",
      attachments: ["infra_architecture_v2.png"],
      isCustom: false,
      isCollapsed: false
    },
    customPhases: [],
    tasks: [
      {
        id: "task_dev_3",
        sNo: "1",
        name: "Development",
        startDate: "2026-03-01",
        originalStartDate: "2026-03-01",
        finishDate: "2026-06-01",
        originalFinishDate: "2026-06-01",
        assignedTo: "Vinothraj",
        subTasks: [
          { id: "sub_dev_3_1", name: "New Screen Development", startDate: "2026-03-01", originalStartDate: "2026-03-01", finishDate: "2026-04-15", originalFinishDate: "2026-04-15", assignedTo: "Guhan" },
          { id: "sub_dev_3_2", name: "Existing screen Validation", startDate: "2026-04-16", originalStartDate: "2026-04-16", finishDate: "2026-05-10", originalFinishDate: "2026-05-10", assignedTo: "Guhan" },
          { id: "sub_dev_3_3", name: "SIT/UAT Release Notes", startDate: "2026-05-11", originalStartDate: "2026-05-11", finishDate: "2026-06-01", originalFinishDate: "2026-05-11", assignedTo: "Deepan" }
        ]
      },
      {
        id: "task_sit_3",
        sNo: "2",
        name: "SIT",
        startDate: "2026-06-02",
        originalStartDate: "2026-06-02",
        finishDate: "2026-07-15",
        originalFinishDate: "2026-07-15",
        assignedTo: "Saravanan D",
        subTasks: [
          { id: "sub_sit_3_1", name: "SIT Test case", startDate: "2026-06-02", originalStartDate: "2026-06-02", finishDate: "2026-06-15", originalFinishDate: "2026-06-15", assignedTo: "Mahesh" },
          { id: "sub_sit_3_2", name: "SIT Test Design", startDate: "2026-06-16", originalStartDate: "2026-06-16", finishDate: "2026-06-25", originalFinishDate: "2026-06-25", assignedTo: "Deepan" },
          { id: "sub_sit_3_3", name: "SIT Execution", startDate: "2026-06-26", originalStartDate: "2026-06-26", finishDate: "2026-07-10", originalFinishDate: "2026-07-10", assignedTo: "Deepan" },
          { id: "sub_sit_3_4", name: "SIT Sign-off", startDate: "2026-07-11", originalStartDate: "2026-07-11", finishDate: "2026-07-15", originalFinishDate: "2026-07-15", assignedTo: "Saravanan A" }
        ]
      },
      {
        id: "task_uat_3",
        sNo: "3",
        name: "UAT",
        startDate: "2026-07-16",
        originalStartDate: "2026-07-16",
        finishDate: "2026-08-20",
        originalFinishDate: "2026-08-20",
        assignedTo: "Padma",
        subTasks: [
          { id: "sub_uat_3_1", name: "UAT Test Cases", startDate: "2026-07-16", originalStartDate: "2026-07-16", finishDate: "2026-07-25", originalFinishDate: "2026-07-25", assignedTo: "Chandru" },
          { id: "sub_uat_3_2", name: "UAT Test Design", startDate: "2026-07-26", originalStartDate: "2026-07-26", finishDate: "2026-07-31", originalFinishDate: "2026-07-31", assignedTo: "Chandru" },
          { id: "sub_uat_3_3", name: "UAT Execution DSRS", startDate: "2026-08-01", originalStartDate: "2026-08-01", finishDate: "2026-08-15", originalFinishDate: "2026-08-15", assignedTo: "Padma" },
          { id: "sub_uat_3_4", name: "UAT Sign Off", startDate: "2026-08-16", originalStartDate: "2026-08-16", finishDate: "2026-08-20", originalFinishDate: "2026-08-20", assignedTo: "Chandru" }
        ]
      },
      {
        id: "task_infosec_3",
        sNo: "4",
        name: "Infosec Reviews",
        startDate: "2026-08-21",
        originalStartDate: "2026-08-21",
        finishDate: "2026-09-10",
        originalFinishDate: "2026-09-10",
        assignedTo: "Saravanan D",
        subTasks: [
          { id: "sub_infosec_3_1", name: "VAPT Reports", startDate: "2026-08-21", originalStartDate: "2026-08-21", finishDate: "2026-08-28", originalFinishDate: "2026-08-28", assignedTo: "Saravanan A" },
          { id: "sub_infosec_3_2", name: "Infosec Application Review Reports", startDate: "2026-08-29", originalStartDate: "2026-08-29", finishDate: "2026-09-05", originalFinishDate: "2026-09-05", assignedTo: "Saravanan A" },
          { id: "sub_infosec_3_3", name: "Infosec Approvals", startDate: "2026-09-06", originalStartDate: "2026-09-06", finishDate: "2026-09-10", originalFinishDate: "2026-09-10", assignedTo: "Venkat" }
        ]
      },
      {
        id: "task_contracts_3",
        sNo: "5",
        name: "Contracts",
        startDate: "2026-09-11",
        originalStartDate: "2026-09-11",
        finishDate: "2026-09-20",
        originalFinishDate: "2026-09-20",
        assignedTo: "Raja",
        subTasks: [
          { id: "sub_contracts_3_1", name: "Vendor Contracts", startDate: "2026-09-11", originalStartDate: "2026-09-11", finishDate: "2026-09-20", originalFinishDate: "2026-09-20", assignedTo: "Gopi" }
        ]
      },
      {
        id: "task_golive_3",
        sNo: "6",
        name: "Go-Live Documents",
        startDate: "2026-09-21",
        originalStartDate: "2026-09-21",
        finishDate: "2026-10-15",
        originalFinishDate: "2026-10-15",
        assignedTo: "Barani",
        subTasks: [
          { id: "sub_golive_3_1", name: "Go Live Checklist", startDate: "2026-09-21", originalStartDate: "2026-09-21", finishDate: "2026-09-30", originalFinishDate: "2026-09-30", assignedTo: "Guhan" },
          { id: "sub_golive_3_2", name: "All Signoffs", startDate: "2026-10-01", originalStartDate: "2026-10-01", finishDate: "2026-10-15", originalFinishDate: "2026-10-15", assignedTo: "Deepan" }
        ]
      },
      {
        id: "task_plan_3",
        sNo: "7",
        name: "Plan",
        startDate: "2026-01-02",
        originalStartDate: "2026-01-02",
        finishDate: "2026-10-30",
        originalFinishDate: "2026-10-30",
        assignedTo: "Deepan",
        subTasks: [
          { id: "sub_plan_3_1", name: "Overall Plan and its versions", startDate: "2026-01-02", originalStartDate: "2026-01-02", finishDate: "2026-10-30", originalFinishDate: "2026-10-30", assignedTo: "Vinothraj" }
        ]
      }
    ]
  }
];

// Default execution task template for NEW projects.
// Dates and assignees are intentionally left BLANK so the Project Manager
// fills them in. Only the task/sub-task structure and names are pre-defined.
export const DEFAULT_TASKS_TEMPLATE = [
  {
    id: "task_dev",
    sNo: "1",
    name: "Development",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_dev_1", name: "New Screen Development", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_dev_2", name: "Existing screen Validation", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_dev_3", name: "SIT/UAT Release Notes", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  },
  {
    id: "task_sit",
    sNo: "2",
    name: "SIT",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_sit_1", name: "SIT Test case", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_sit_2", name: "SIT Test Design", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_sit_3", name: "SIT Execution", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_sit_4", name: "SIT Sign-off", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  },
  {
    id: "task_uat",
    sNo: "3",
    name: "UAT",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_uat_1", name: "UAT Test Cases", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_uat_2", name: "UAT Test Design", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_uat_3", name: "UAT Execution DSRS", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_uat_4", name: "UAT Sign Off", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  },
  {
    id: "task_infosec",
    sNo: "4",
    name: "Infosec Reviews",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_infosec_1", name: "VAPT Reports", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_infosec_2", name: "Infosec Application Review Reports", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_infosec_3", name: "Infosec Approvals", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  },
  {
    id: "task_contracts",
    sNo: "5",
    name: "Contracts",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_contracts_1", name: "Vendor Contracts", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  },
  {
    id: "task_golive",
    sNo: "6",
    name: "Go-Live Documents",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_golive_1", name: "Go Live Checklist", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" },
      { id: "sub_golive_2", name: "All Signoffs", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  },
  {
    id: "task_plan",
    sNo: "7",
    name: "Support Handover",
    startDate: "",
    originalStartDate: "",
    finishDate: "",
    originalFinishDate: "",
    assignedTo: "",
    subTasks: [
      { id: "sub_plan_1", name: "Overall Plan and its versions", startDate: "", originalStartDate: "", finishDate: "", originalFinishDate: "", assignedTo: "" }
    ]
  }
];
