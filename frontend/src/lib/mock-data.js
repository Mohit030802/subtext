// Mock data for Subtext - Phase 1 development

export const mockClients = [
  {
    id: "c1",
    name: "Meridian Health Systems",
    industry: "Healthcare",
    created_at: "2025-11-15T10:30:00Z",
    project_count: 3,
    document_count: 7,
    high_risk_count: 4,
  },
  {
    id: "c2",
    name: "Atlas Financial Group",
    industry: "Finance",
    created_at: "2025-12-01T14:00:00Z",
    project_count: 2,
    document_count: 5,
    high_risk_count: 2,
  },
  {
    id: "c3",
    name: "Vortex Technologies",
    industry: "Technology",
    created_at: "2026-01-10T09:00:00Z",
    project_count: 1,
    document_count: 3,
    high_risk_count: 1,
  },
  {
    id: "c4",
    name: "Greenfield Properties",
    industry: "Real Estate",
    created_at: "2026-02-20T11:30:00Z",
    project_count: 2,
    document_count: 4,
    high_risk_count: 3,
  },
];

export const mockProjects = {
  c1: [
    {
      id: "p1",
      client_id: "c1",
      name: "EHR Platform Migration",
      description: "Migration of legacy electronic health records to cloud-based platform",
      created_at: "2025-11-20T10:00:00Z",
      document_count: 3,
      high_risk_count: 2,
      upcoming_deadlines: 4,
    },
    {
      id: "p2",
      client_id: "c1",
      name: "HIPAA Compliance Audit",
      description: "Annual HIPAA compliance review and vendor assessment",
      created_at: "2026-01-05T10:00:00Z",
      document_count: 2,
      high_risk_count: 1,
      upcoming_deadlines: 2,
    },
    {
      id: "p3",
      client_id: "c1",
      name: "Telehealth Expansion",
      description: "New telehealth service provider agreements",
      created_at: "2026-03-01T10:00:00Z",
      document_count: 2,
      high_risk_count: 1,
      upcoming_deadlines: 1,
    },
  ],
  c2: [
    {
      id: "p4",
      client_id: "c2",
      name: "Fintech API Integration",
      description: "Third-party API integration for payment processing",
      created_at: "2025-12-10T10:00:00Z",
      document_count: 3,
      high_risk_count: 1,
      upcoming_deadlines: 3,
    },
    {
      id: "p5",
      client_id: "c2",
      name: "Regulatory Filing Q1 2026",
      description: "Quarterly regulatory compliance filings",
      created_at: "2026-02-01T10:00:00Z",
      document_count: 2,
      high_risk_count: 1,
      upcoming_deadlines: 2,
    },
  ],
  c3: [
    {
      id: "p6",
      client_id: "c3",
      name: "Cloud Infrastructure Deal",
      description: "AWS enterprise agreement and SLA negotiation",
      created_at: "2026-01-15T10:00:00Z",
      document_count: 3,
      high_risk_count: 1,
      upcoming_deadlines: 2,
    },
  ],
  c4: [
    {
      id: "p7",
      client_id: "c4",
      name: "Commercial Lease Portfolio",
      description: "Office space lease agreements across 3 locations",
      created_at: "2026-02-25T10:00:00Z",
      document_count: 2,
      high_risk_count: 2,
      upcoming_deadlines: 3,
    },
    {
      id: "p8",
      client_id: "c4",
      name: "Construction Partnership",
      description: "General contractor agreement for new development",
      created_at: "2026-04-01T10:00:00Z",
      document_count: 2,
      high_risk_count: 1,
      upcoming_deadlines: 2,
    },
  ],
};

export const mockDocuments = {
  p1: [
    {
      id: "d1",
      project_id: "p1",
      title: "Master Services Agreement — CloudMed Inc.",
      doc_type: "MSA",
      file_url: "/sample.pdf",
      is_ocr_processed: false,
      risk_score: "HIGH",
      summary: {
        key_takeaways: [
          "36-month commitment with automatic renewal",
          "CloudMed retains IP rights to all customizations",
          "Liability cap of $50,000 — significantly below contract value",
          "Mandatory binding arbitration in Delaware",
        ],
        core_obligations: [
          "Monthly SLA reports due by 5th of each month",
          "Data migration completion by Q2 2026",
          "Annual security audit required",
        ],
        parties_involved: ["Meridian Health Systems", "CloudMed Inc."],
        effective_date: "2026-01-01",
        expiry_date: "2028-12-31",
      },
      page_count: 24,
      created_at: "2025-11-22T10:00:00Z",
    },
    {
      id: "d2",
      project_id: "p1",
      title: "Statement of Work — Phase 1 Data Migration",
      doc_type: "SOW",
      file_url: "/sample.pdf",
      is_ocr_processed: false,
      risk_score: "MEDIUM",
      summary: {
        key_takeaways: [
          "Fixed price $450,000 for Phase 1",
          "Scope limited to legacy EHR data only",
          "Change orders require 2-week lead time",
        ],
        core_obligations: [
          "Milestone 1: Data mapping — Feb 28, 2026",
          "Milestone 2: Test migration — Apr 15, 2026",
          "Milestone 3: Production cutover — Jun 30, 2026",
        ],
        parties_involved: ["Meridian Health Systems", "CloudMed Inc."],
        effective_date: "2026-01-15",
        expiry_date: "2026-06-30",
      },
      page_count: 12,
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "d3",
      project_id: "p1",
      title: "Non-Disclosure Agreement — CloudMed Inc.",
      doc_type: "NDA",
      file_url: "/sample.pdf",
      is_ocr_processed: false,
      risk_score: "LOW",
      summary: {
        key_takeaways: [
          "Mutual NDA with standard 3-year duration",
          "Standard carve-outs for public information",
        ],
        core_obligations: [
          "Return or destroy confidential materials within 30 days of termination",
        ],
        parties_involved: ["Meridian Health Systems", "CloudMed Inc."],
        effective_date: "2025-11-20",
        expiry_date: "2028-11-20",
      },
      page_count: 6,
      created_at: "2025-11-20T10:00:00Z",
    },
  ],
  p4: [
    {
      id: "d4",
      project_id: "p4",
      title: "API License Agreement — PayStream",
      doc_type: "SLA",
      file_url: "/sample.pdf",
      is_ocr_processed: false,
      risk_score: "HIGH",
      summary: {
        key_takeaways: [
          "Usage-based pricing with no cap on overage charges",
          "Vendor can modify API with 30-day notice",
          "Non-exclusive license terminable at vendor's discretion",
        ],
        core_obligations: [
          "Quarterly usage review meetings",
          "Security compliance certification annually",
        ],
        parties_involved: ["Atlas Financial Group", "PayStream Technologies"],
        effective_date: "2026-01-01",
        expiry_date: "2027-12-31",
      },
      page_count: 18,
      created_at: "2025-12-15T10:00:00Z",
    },
  ],
  p6: [
    {
      id: "d5",
      project_id: "p6",
      title: "Enterprise Agreement — AWS",
      doc_type: "MSA",
      file_url: "/sample.pdf",
      is_ocr_processed: false,
      risk_score: "MEDIUM",
      summary: {
        key_takeaways: [
          "3-year commit with $2.4M minimum spend",
          "Credits apply only to listed services",
          "SLA guarantees 99.99% uptime",
        ],
        core_obligations: [
          "Minimum monthly spend of $66,700",
          "Annual architecture review",
          "Quarterly billing reconciliation",
        ],
        parties_involved: ["Vortex Technologies", "Amazon Web Services Inc."],
        effective_date: "2026-02-01",
        expiry_date: "2029-01-31",
      },
      page_count: 42,
      created_at: "2026-01-20T10:00:00Z",
    },
  ],
};

export const mockClauseRisks = {
  d1: [
    {
      id: "cr1",
      document_id: "d1",
      clause_text:
        "This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least ninety (90) days prior to the expiration of the then-current term.",
      risk_level: "HIGH",
      explanation:
        "Auto-renewal with a 90-day notice window is aggressive. Missing the notice window locks you into another full year. Many organizations miss these deadlines, resulting in unwanted contract extensions.",
      suggested_redline:
        "This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least thirty (30) days prior to the expiration of the then-current term. Provider shall send a written reminder to Client at least sixty (60) days before each renewal date.",
      page_number: 3,
      created_at: "2025-11-22T10:00:00Z",
    },
    {
      id: "cr2",
      document_id: "d1",
      clause_text:
        "Provider's total aggregate liability under this Agreement shall not exceed the fees paid by Client during the twelve (12) month period immediately preceding the claim, up to a maximum of Fifty Thousand Dollars ($50,000).",
      risk_level: "HIGH",
      explanation:
        "The $50,000 liability cap is dangerously low for a contract of this magnitude. If a data breach exposes patient records, potential HIPAA fines alone could be in the millions. This cap shifts virtually all financial risk to the client.",
      suggested_redline:
        "Provider's total aggregate liability under this Agreement shall not exceed two (2) times the total fees paid or payable during the twelve (12) month period immediately preceding the claim. This limitation shall not apply to Provider's indemnification obligations, breaches of confidentiality, or willful misconduct.",
      page_number: 8,
      created_at: "2025-11-22T10:00:00Z",
    },
    {
      id: "cr3",
      document_id: "d1",
      clause_text:
        "All intellectual property, including but not limited to customizations, configurations, and derivative works created during the performance of this Agreement, shall be the sole and exclusive property of Provider.",
      risk_level: "HIGH",
      explanation:
        "CloudMed owns all customizations built specifically for Meridian's systems. If you switch vendors, you lose all custom work you paid for. This creates extreme vendor lock-in.",
      suggested_redline:
        "All intellectual property created specifically for Client's use during the performance of this Agreement shall be jointly owned by Client and Provider. Provider retains ownership of its pre-existing IP and general-purpose tools. Client receives a perpetual, irrevocable license to use all deliverables.",
      page_number: 12,
      created_at: "2025-11-22T10:00:00Z",
    },
    {
      id: "cr4",
      document_id: "d1",
      clause_text:
        "Any disputes arising under this Agreement shall be resolved exclusively through binding arbitration conducted in Wilmington, Delaware, under the rules of the American Arbitration Association.",
      risk_level: "MEDIUM",
      explanation:
        "Mandatory binding arbitration in Delaware may be inconvenient and costly. Arbitration also limits discovery rights and appeal options compared to litigation.",
      suggested_redline:
        "Any disputes arising under this Agreement shall first be subject to good-faith mediation for a period of thirty (30) days. If unresolved, disputes shall be resolved through binding arbitration conducted in a mutually agreed location.",
      page_number: 18,
      created_at: "2025-11-22T10:00:00Z",
    },
  ],
  d2: [
    {
      id: "cr5",
      document_id: "d2",
      clause_text:
        "Client acknowledges that the timeline set forth in this SOW is an estimate only and that Provider shall not be liable for any delays caused by factors outside its reasonable control.",
      risk_level: "MEDIUM",
      explanation:
        'The phrase "estimate only" effectively eliminates any accountability for timeline adherence. The vendor has wide latitude to miss deadlines without consequence.',
      suggested_redline:
        "Provider shall use commercially reasonable efforts to meet the timeline. If delays occur due to factors within Provider's control, Provider shall notify Client within five (5) business days and provide a revised timeline.",
      page_number: 4,
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "cr6",
      document_id: "d2",
      clause_text:
        "Change orders requested by Client may result in additional fees and timeline adjustments, which shall be determined by Provider in its sole discretion.",
      risk_level: "HIGH",
      explanation:
        '"Sole discretion" for pricing change orders is a blank check. The vendor can charge any amount for scope changes with no objective pricing methodology.',
      suggested_redline:
        "Change orders shall be priced based on Provider's standard hourly rates as set forth in Exhibit B. Provider shall provide a written estimate within five (5) business days, and work shall not commence until Client provides written approval.",
      page_number: 6,
      created_at: "2026-01-15T10:00:00Z",
    },
  ],
  d4: [
    {
      id: "cr7",
      document_id: "d4",
      clause_text:
        "Provider reserves the right to modify, deprecate, or discontinue any API endpoint with thirty (30) days prior written notice. Client acknowledges that such modifications may require Client to update its integration at its own expense.",
      risk_level: "HIGH",
      explanation:
        "30-day notice to change or kill an API endpoint is extremely short for a financial integration. Any breaking change requires development resources, QA, and regulatory review — all at the client's expense.",
      suggested_redline:
        "Provider shall provide at least one hundred eighty (180) days prior written notice before deprecating or discontinuing any API endpoint. Provider shall maintain backward compatibility for deprecated endpoints during this notice period.",
      page_number: 7,
      created_at: "2025-12-15T10:00:00Z",
    },
  ],
  d5: [
    {
      id: "cr8",
      document_id: "d5",
      clause_text:
        "Credits earned under this Agreement may only be applied to the specific AWS services listed in Exhibit A and shall expire at the end of each calendar quarter if not utilized.",
      risk_level: "MEDIUM",
      explanation:
        "Quarterly credit expiration creates a use-it-or-lose-it dynamic that pressures spending even when not operationally necessary. Combined with the limited service scope, this reduces practical value.",
      suggested_redline:
        "Credits earned under this Agreement may be applied to any generally available AWS service. Unused credits shall roll over and accumulate throughout the term of this Agreement, expiring only upon termination.",
      page_number: 5,
      created_at: "2026-01-20T10:00:00Z",
    },
  ],
};

export const mockObligations = {
  d1: [
    {
      id: "o1",
      document_id: "d1",
      project_id: "p1",
      title: "Monthly SLA Report Submission",
      description: "CloudMed must submit monthly SLA performance reports by the 5th of each month",
      due_date: "2026-09-05",
      obligation_type: "DELIVERABLE",
      party_responsible: "CLIENT",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "PENDING",
      created_at: "2025-11-22T10:00:00Z",
    },
    {
      id: "o2",
      document_id: "d1",
      project_id: "p1",
      title: "Contract Renewal Decision Deadline",
      description: "90-day notice window for non-renewal. Must decide before Oct 2, 2028.",
      due_date: "2028-10-02",
      obligation_type: "RENEWAL_NOTICE",
      party_responsible: "US",
      is_synced_calendar: true,
      calendar_event_id: "cal_abc123",
      status: "PENDING",
      created_at: "2025-11-22T10:00:00Z",
    },
    {
      id: "o3",
      document_id: "d1",
      project_id: "p1",
      title: "Annual Security Audit",
      description: "Conduct annual security audit of CloudMed platform and data handling",
      due_date: "2026-12-31",
      obligation_type: "COMPLIANCE",
      party_responsible: "US",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "PENDING",
      created_at: "2025-11-22T10:00:00Z",
    },
  ],
  d2: [
    {
      id: "o4",
      document_id: "d2",
      project_id: "p1",
      title: "Milestone 1: Data Mapping Complete",
      description: "Complete data mapping for all legacy EHR systems",
      due_date: "2026-02-28",
      obligation_type: "DELIVERABLE",
      party_responsible: "CLIENT",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "COMPLETED",
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "o5",
      document_id: "d2",
      project_id: "p1",
      title: "Milestone 2: Test Migration",
      description: "Complete test migration with full data validation and sign-off",
      due_date: "2026-04-15",
      obligation_type: "DELIVERABLE",
      party_responsible: "CLIENT",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "OVERDUE",
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "o6",
      document_id: "d2",
      project_id: "p1",
      title: "Milestone 3: Production Cutover",
      description: "Final production cutover and go-live",
      due_date: "2026-06-30",
      obligation_type: "DELIVERABLE",
      party_responsible: "US",
      is_synced_calendar: true,
      calendar_event_id: "cal_def456",
      status: "PENDING",
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "o7",
      document_id: "d2",
      project_id: "p1",
      title: "Final Payment — Phase 1",
      description: "Final payment of $150,000 due upon production cutover sign-off",
      due_date: "2026-07-15",
      obligation_type: "PAYMENT",
      party_responsible: "US",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "PENDING",
      created_at: "2026-01-15T10:00:00Z",
    },
  ],
  d4: [
    {
      id: "o8",
      document_id: "d4",
      project_id: "p4",
      title: "Quarterly Usage Review",
      description: "Joint review meeting for API usage metrics and billing",
      due_date: "2026-09-30",
      obligation_type: "DELIVERABLE",
      party_responsible: "US",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "PENDING",
      created_at: "2025-12-15T10:00:00Z",
    },
  ],
  d5: [
    {
      id: "o9",
      document_id: "d5",
      project_id: "p6",
      title: "Minimum Monthly AWS Spend",
      description: "Ensure minimum $66,700 monthly spend on listed AWS services",
      due_date: "2026-09-01",
      obligation_type: "PAYMENT",
      party_responsible: "US",
      is_synced_calendar: false,
      calendar_event_id: null,
      status: "PENDING",
      created_at: "2026-01-20T10:00:00Z",
    },
  ],
};

// Navigation tree for sidebar
export const mockNavTree = [
  {
    id: "c1",
    name: "Meridian Health Systems",
    industry: "Healthcare",
    projects: [
      {
        id: "p1",
        client_id: "c1",
        name: "EHR Platform Migration",
        documents: [
          { id: "d1", project_id: "p1", title: "MSA — CloudMed Inc.", doc_type: "MSA", risk_score: "HIGH" },
          { id: "d2", project_id: "p1", title: "SOW — Phase 1 Migration", doc_type: "SOW", risk_score: "MEDIUM" },
          { id: "d3", project_id: "p1", title: "NDA — CloudMed Inc.", doc_type: "NDA", risk_score: "LOW" },
        ],
      },
      { id: "p2", client_id: "c1", name: "HIPAA Compliance Audit", documents: [] },
      { id: "p3", client_id: "c1", name: "Telehealth Expansion", documents: [] },
    ],
  },
  {
    id: "c2",
    name: "Atlas Financial Group",
    industry: "Finance",
    projects: [
      {
        id: "p4",
        client_id: "c2",
        name: "Fintech API Integration",
        documents: [
          { id: "d4", project_id: "p4", title: "API License — PayStream", doc_type: "SLA", risk_score: "HIGH" },
        ],
      },
      { id: "p5", client_id: "c2", name: "Regulatory Filing Q1 2026", documents: [] },
    ],
  },
  {
    id: "c3",
    name: "Vortex Technologies",
    industry: "Technology",
    projects: [
      {
        id: "p6",
        client_id: "c3",
        name: "Cloud Infrastructure Deal",
        documents: [
          { id: "d5", project_id: "p6", title: "Enterprise Agreement — AWS", doc_type: "MSA", risk_score: "MEDIUM" },
        ],
      },
    ],
  },
  {
    id: "c4",
    name: "Greenfield Properties",
    industry: "Real Estate",
    projects: [
      { id: "p7", client_id: "c4", name: "Commercial Lease Portfolio", documents: [] },
      { id: "p8", client_id: "c4", name: "Construction Partnership", documents: [] },
    ],
  },
];

// Dashboard stats
export const mockDashboardStats = {
  totalDocuments: 19,
  highRiskClauses: 11,
  upcomingDeadlines: 14,
  totalClients: 4,
  riskDistribution: { high: 6, medium: 8, low: 5 },
};

// Recent documents (flat list for dashboard)
export const mockRecentDocuments = [
  { ...mockDocuments.p1[0], client_id: "c1", client_name: "Meridian Health Systems", project_name: "EHR Platform Migration" },
  { ...mockDocuments.p4[0], client_id: "c2", client_name: "Atlas Financial Group", project_name: "Fintech API Integration" },
  { ...mockDocuments.p1[1], client_id: "c1", client_name: "Meridian Health Systems", project_name: "EHR Platform Migration" },
  { ...mockDocuments.p6[0], client_id: "c3", client_name: "Vortex Technologies", project_name: "Cloud Infrastructure Deal" },
  { ...mockDocuments.p1[2], client_id: "c1", client_name: "Meridian Health Systems", project_name: "EHR Platform Migration" },
];

// Upcoming obligations for dashboard
export const mockUpcomingObligations = [
  { ...mockObligations.d1[0], document_title: "MSA — CloudMed Inc.", client_name: "Meridian Health Systems" },
  { ...mockObligations.d2[2], document_title: "SOW — Phase 1 Migration", client_name: "Meridian Health Systems" },
  { ...mockObligations.d2[3], document_title: "SOW — Phase 1 Migration", client_name: "Meridian Health Systems" },
  { ...mockObligations.d4[0], document_title: "API License — PayStream", client_name: "Atlas Financial Group" },
  { ...mockObligations.d5[0], document_title: "Enterprise Agreement — AWS", client_name: "Vortex Technologies" },
];

// Sample chat messages
export const mockChatMessages = [
  {
    id: "msg1",
    role: "user",
    content: "What are the key risks in the CloudMed MSA?",
    timestamp: "2026-08-14T10:00:00Z",
  },
  {
    id: "msg2",
    role: "assistant",
    content: "Based on my analysis of the CloudMed MSA, there are **3 high-risk clauses** and **1 medium-risk clause**:\n\n1. **Auto-Renewal Trap** (Page 3) — The contract auto-renews with a 90-day notice window, which is aggressive and easy to miss.\n\n2. **Liability Cap** (Page 8) — The $50,000 liability cap is dangerously low for a healthcare contract of this magnitude.\n\n3. **IP Ownership** (Page 12) — CloudMed retains ownership of all customizations, creating severe vendor lock-in.\n\nI recommend addressing the liability cap and IP ownership clauses as top priorities in negotiations.",
    citations: [
      { chunk_id: "ch1", page: 3, content: "Auto-renewal clause text..." },
      { chunk_id: "ch2", page: 8, content: "Liability cap clause text..." },
    ],
    timestamp: "2026-08-14T10:00:05Z",
  },
  {
    id: "msg3",
    role: "user",
    content: "Does the SOW conflict with the MSA regarding timelines?",
    timestamp: "2026-08-14T10:01:00Z",
  },
  {
    id: "msg4",
    role: "assistant",
    content: "Yes, there is a potential conflict. The **MSA** (Section 4.2) states that all project timelines are \"estimates only\" and Provider is not liable for delays. However, the **SOW** sets firm milestone dates with specific deliverables tied to each date.\n\nThis creates ambiguity — if CloudMed misses the June 30 cutover date, the MSA's \"estimate only\" language could be used to avoid accountability.\n\n**Recommendation:** Add a clause to the SOW explicitly stating that SOW timelines supersede MSA general terms, and include financial penalties for milestone delays within Provider's control.",
    citations: [{ chunk_id: "ch3", page: 4, content: "SOW timeline clause..." }],
    timestamp: "2026-08-14T10:01:10Z",
  },
];
