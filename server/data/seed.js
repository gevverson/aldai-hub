/**
 * Seed data — Macho ya Mwananchi
 * All project data sourced from official Auditor-General of Kenya reports.
 * Sources: OAG Aldai NG-CDF Audit 2018/2019 | OAG Nandi County Executive 2021/22 & 2023/24
 *
 * Every entry here is a documented fact, not an allegation.
 */

// ─────────────────────────────────────────────────────────────
// 21 DOCUMENTED PROJECTS & FINDINGS FROM OAG REPORTS
// NG-CDF (2018/19) · Nandi County Executive & Assembly (2023/24 & 2024/25)
// ─────────────────────────────────────────────────────────────
export const projects = [

  // ── NG-CDF PROJECTS (Source: OAG Aldai Constituency NG-CDF Audit 2018/2019) ──

  {
    name:            'Kimaren Girls Secondary School',
    ward:            'Kemeloi-Maraba',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       3_200_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'GHOST PROJECT',
    auditNote:       'Physical verification found the school does not exist. Ksh 3.2M disbursed. Auditors visited the site — empty field. Zero construction ever commenced.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.2134,
    lng:             35.1456,
  },

  {
    name:            'Dr. Sally Kosgei Secondary School',
    ward:            'Kobujoi',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       3_650_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       'Cracked floors, cracked walls, leaking roof. Only undercoat paint applied — no finishing coat. No certificate of completion issued. Paid as complete.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.2345,
    lng:             35.1234,
  },

  {
    name:            'Mogomben Primary School Land',
    ward:            'Kemeloi-Maraba',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       1_000_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       '1.2 acres purchased at Ksh 1M. No title deed transferred to the school. Land ownership remains with the seller. Suspected land laundering mechanism — public funds used to purchase land that remains in private hands.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.2304,
    lng:             35.1944,
  },

  {
    name:            'Kiplengwai Primary School Land',
    ward:            'Kaptumo-Kaboi',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       1_200_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       'Land purchased without title deed or survey beacons. Paid price: Ksh 1.2M. Market value independently assessed at Ksh 650,000. Overpayment of Ksh 550,000 unaccounted for.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.5201,
    lng:             35.5534,
  },

  {
    name:            'Kapkoi Primary School Renovation',
    ward:            'Kobujoi',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       400_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       'Floor slants backward, retaining stagnant water — health hazard for pupils. Broken windows throughout. Structural wall cracks visible. Paid as complete and certified.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.1441,
    lng:             35.1678,
  },

  {
    name:            'Kipsartuk Primary School',
    ward:            'Kaptumo-Kaboi',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       600_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       'Severe wall and floor fissures throughout the completed block. Construction quality does not meet minimum government standards. No engineer sign-off on record.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.5100,
    lng:             35.5600,
  },

  {
    name:            'Aldai Boys Secondary School Classrooms',
    ward:            'Kabwareng',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       4_000_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'MISALLOCATED',
    auditNote:       'Built Form 1–4 classrooms for a school that only had Form 1 students at time of construction. Three of four completed classrooms serve no students for 3+ years. Suspected fund inflation scheme.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.0534,
    lng:             35.0781,
  },

  {
    name:            'Koitabut Secondary School Bus',
    ward:            'Koyo-Ndurio',
    fund:            'NG-CDF',
    category:        'transport',
    allocated:       2_800_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       'School bus procured at Ksh 2.8M. Official vehicle logbook missing. No proof of delivery, no registration records provided to auditors. Current location of vehicle unknown.',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             0.2950,
    lng:             35.3050,
  },

  {
    name:            'Chepkongony Secondary School',
    ward:            'Terik',
    fund:            'NG-CDF',
    category:        'education',
    allocated:       3_000_000,
    year:            '2018/2019',
    officialStatus:  'Complete',
    communityStatus: 'DISPUTED',
    auditNote:       'Missing PVC gutters not installed despite being specified and paid for. No electricity sockets installed in classrooms. Paid in full as "complete".',
    source:          'OAG Aldai NG-CDF Audit 2018/2019',
    lat:             -0.0750,
    lng:             35.2650,
  },

  // ── NANDI COUNTY GOVERNMENT PROJECTS ──

  {
    name:            'Kapsabet Mother & Baby Unit',
    ward:            'Kapsabet',
    fund:            'County',
    category:        'health',
    allocated:       208_800_000,
    contractValue:   409_900_000,
    year:            '2019',
    officialStatus:  'Ongoing',
    communityStatus: 'STALLED',
    auditNote:       'Contracted April 2019 for 24-month completion. Still incomplete years past deadline. Ksh 208.8M paid of Ksh 409.9M contract. Auditor-General could not confirm value for money. No contractor on site at time of audit.',
    source:          'OAG Nandi County Executive Audit 2023/2024',
    lat:             0.2089,
    lng:             35.1089,
  },

  {
    name:            'Kabiyet Dairy Creamery',
    ward:            'Kabiyet',
    fund:            'County',
    category:        'agriculture',
    allocated:       621_000_000,
    year:            '2016',
    officialStatus:  'Under Construction',
    communityStatus: 'STALLED',
    auditNote:       'Non-operational 8 years after inception. Total expenditure approaching Ksh 1 billion. Cost exceeds standard market rate for a functional creamery by an estimated 340%. Serious procurement irregularities flagged by OAG. Not a single litre of milk processed.',
    source:          'OAG Nandi County Executive Audit 2023/2024',
    lat:             0.3456,
    lng:             35.0234,
  },

  {
    name:            'Kobujoi Sub-County Hospital',
    ward:            'Kobujoi',
    fund:            'County',
    category:        'health',
    allocated:       3_292_946,
    year:            '2020',
    officialStatus:  'Ongoing',
    communityStatus: 'STALLED',
    auditNote:       'Signed contract documents withheld from auditors. Payment vouchers and certificates of work completion missing. Constitutes audit obstruction under Section 68 of the Public Finance Management Act.',
    source:          'OAG Nandi County Executive Audit 2023/2024',
    lat:             0.1633,
    lng:             35.1821,
  },

  {
    name:            'Kapsengere Hospital Phase II',
    ward:            'Terik',
    fund:            'County',
    category:        'health',
    allocated:       9_954_900,
    year:            '2019',
    officialStatus:  'Complete',
    communityStatus: 'ABANDONED',
    auditNote:       'Completely abandoned construction site. Ramp structurally defective — requires full demolition and rebuild. Zero engineering supervision evident during construction. Certified and paid as complete. Waste of Ksh 9.9M of public funds.',
    source:          'OAG Nandi County Executive Audit 2021/2022',
    lat:             0.1567,
    lng:             35.0890,
  },

  {
    name:            'Chepterwai Sub-County Hospital',
    ward:            'Chepterwai',
    fund:            'County',
    category:        'health',
    allocated:       15_400_000,
    year:            '2023',
    officialStatus:  'Ongoing',
    communityStatus: 'STALLED',
    auditNote:       'Financial statements not submitted to Auditor-General for FY 2023/2024. Ksh 15.4M transferred — destination untraced. No evidence of expenditure or procurement process provided to auditors.',
    source:          'OAG Nandi County Executive Audit 2023/2024',
    lat:             0.3500,
    lng:             35.2500,
  },

  // ── NANDI COUNTY EXECUTIVE — 2024/2025 AUDIT CYCLE ──
  // Systemic findings (no single site) carry null coordinates and appear
  // in the project list but not on the map.

  {
    name:            'Nandi County Pending Bills Crisis',
    ward:            'County-wide',
    fund:            'County Executive',
    category:        'other',
    allocated:       985_121_904,
    year:            '2024/2025',
    officialStatus:  'Payable',
    communityStatus: 'IRREGULAR',
    auditNote:       'Outstanding pending bills stood at Ksh 985.1M at year-end. Includes Ksh 509.1M tied to stalled development projects, Ksh 91M in unremitted statutory deductions (PAYE and pension — exposing the county to penalties), and Ksh 62.9M in historical payables dating back to 2015/2016. Accumulation on this scale is a classic symptom of contractor payments withheld to solicit illicit kickbacks.',
    source:          'OAG Nandi County Executive Audit 2024/2025',
    lat:             null,
    lng:             null,
  },

  {
    name:            'Manual Payroll & Ghost Workers',
    ward:            'County-wide',
    fund:            'County Executive',
    category:        'other',
    allocated:       3_300_000_000,
    year:            '2024/2025',
    officialStatus:  'Salaries Paid',
    communityStatus: 'IRREGULAR',
    auditNote:       'The county processed hundreds of millions in salaries through manual Excel payrolls, deliberately bypassing the secure national IPPD system. Reported staff numbers dropped abruptly from 4,884 to 2,999 — leaving 1,885 employees completely unaccounted for. EACC investigations point to a payroll scheme consuming over Ksh 3.3B, nearly 44% of the county allocation. 2023/24 recruitment was 94% from a single ethnic community, violating the National Cohesion and Integration Act.',
    source:          'OAG Nandi County Executive Audit 2023/2024 & 2024/2025 · EACC Investigation',
    lat:             null,
    lng:             null,
  },

  {
    name:            'Kapsabet County Referral Hospital (KCRH)',
    ward:            'Kapsabet',
    fund:            'County Executive',
    category:        'health',
    allocated:       8_900_000,
    year:            '2024/2025',
    officialStatus:  'Operational',
    communityStatus: 'IRREGULAR',
    auditNote:       'The Senate flagged a catastrophic data-governance failure — the hospital handled thousands of citizens’ medical and financial records with no data-retention schedule, a "legal time bomb" under the Data Protection Act. Ksh 8.9M was lost to "irregular waivers" granted without the committee minutes required by Section 159 of the PFM Act. Its 34 occupied staff housing units reported a nil (zero) rental balance, strongly suggesting rent is collected off-book.',
    source:          'OAG Nandi County Executive Audit 2024/2025 · Senate PIC Special Funds Committee',
    lat:             0.2028,
    lng:             35.1056,
  },

  {
    name:            'KDSP II Donor Fund Under-Absorption',
    ward:            'County-wide',
    fund:            'County Executive',
    category:        'other',
    allocated:       57_500_000,
    year:            '2024/2025',
    officialStatus:  'Budgeted',
    communityStatus: 'IRREGULAR',
    auditNote:       'Under the World Bank / IDA-funded Second Kenya Devolution Support Programme (KDSP II) capacity-building grant, the county absorbed only Ksh 19.9M of a Ksh 57.5M budget — a 65% under-absorption of Ksh 37.6M. Failing to spend available donor funds directly deprives citizens of planned service-delivery improvements and signals administrative incompetence to international partners.',
    source:          'OAG Nandi County Executive Audit 2024/2025',
    lat:             null,
    lng:             null,
  },

  // ── NANDI COUNTY ASSEMBLY — 2023/2024 & 2024/2025 AUDIT CYCLES ──

  {
    name:            'County Assembly — Hidden Deferred Income',
    ward:            'County Assembly',
    fund:            'County Assembly',
    category:        'other',
    allocated:       56_027_772,
    year:            '2024/2025',
    officialStatus:  'Disclosed',
    communityStatus: 'IRREGULAR',
    auditNote:       'The Assembly — the body legally tasked with overseeing the Executive — failed to disclose deferred income of Ksh 56M in its own financial statements. Omitting tens of millions from the official statement of financial performance obscures the Assembly’s true liquidity and outstanding liabilities. Its accounts received a Qualified Opinion.',
    source:          'OAG Nandi County Assembly Audit 2024/2025',
    lat:             null,
    lng:             null,
  },

  {
    name:            'County Assembly — Backdated Expenditure',
    ward:            'County Assembly',
    fund:            'County Assembly',
    category:        'other',
    allocated:       77_115_027,
    year:            '2023/2024',
    officialStatus:  'Recorded 30 June 2024',
    communityStatus: 'IRREGULAR',
    auditNote:       'The Auditor-General flagged Ksh 77.1M paid out AFTER the financial year cut-off but deliberately backdated in the records to appear as if incurred on 30 June 2024. Falsifying transaction dates is a critical red flag used to manipulate budget-absorption rates and cover irregular spending outside the authorised fiscal window. An unexplained Ksh 35M variance was also found in County Revenue Fund transfers.',
    source:          'OAG Nandi County Assembly Audit 2023/2024',
    lat:             null,
    lng:             null,
  },

  {
    name:            'County Assembly — Unsupported Travel Allowances',
    ward:            'County Assembly',
    fund:            'County Assembly',
    category:        'transport',
    allocated:       54_200_000,
    year:            '2023/2024',
    officialStatus:  'Paid',
    communityStatus: 'IRREGULAR',
    auditNote:       'Over Ksh 54.2M in MCA travel was rendered highly questionable. This includes Ksh 9,999,999 in foreign travel and subsistence entirely unsupported by travel logs, boarding passes or back-to-office reports, and domestic transport paid at a flat Ksh 6,000 per MCA per day regardless of distance actually covered. The Assembly also ran a single-person internal audit function with no risk register — leaving it structurally unable to hold the Executive accountable.',
    source:          'OAG Nandi County Assembly Audit 2023/2024',
    lat:             null,
    lng:             null,
  },

];

// ─────────────────────────────────────────────────────────────
// WARD METADATA — Aldai Constituency (6 wards)
// ─────────────────────────────────────────────────────────────
export const wards = [
  {
    name:            'Kabwareng',
    budgetAllocated: 85_000_000,
    projectCount:    12,
    completionRate:  42,
    healthScore:     'red',
    hasGhost:        false,
    lat:             0.055,
    lng:             35.080,
  },
  {
    name:            'Terik',
    budgetAllocated: 72_000_000,
    projectCount:    9,
    completionRate:  35,
    healthScore:     'red',
    hasGhost:        false,
    lat:             -0.080,
    lng:             35.270,
  },
  {
    name:            'Kemeloi-Maraba',
    budgetAllocated: 91_000_000,
    projectCount:    14,
    completionRate:  28,
    healthScore:     'red',
    hasGhost:        true,   // Kimaren Girls Secondary
    lat:             0.220,
    lng:             35.200,
  },
  {
    name:            'Kobujoi',
    budgetAllocated: 68_000_000,
    projectCount:    8,
    completionRate:  45,
    healthScore:     'amber',
    hasGhost:        false,
    lat:             0.155,
    lng:             35.175,
  },
  {
    name:            'Kaptumo-Kaboi',
    budgetAllocated: 79_000_000,
    projectCount:    11,
    completionRate:  38,
    healthScore:     'red',
    hasGhost:        false,
    lat:             0.520,
    lng:             35.550,
  },
  {
    name:            'Koyo-Ndurio',
    budgetAllocated: 62_000_000,
    projectCount:    7,
    completionRate:  71,
    healthScore:     'green',
    hasGhost:        false,
    lat:             0.300,
    lng:             35.300,
  },
];

// ─────────────────────────────────────────────────────────────
// GLOBAL STATISTICS — Nandi County
// Source: OAG Kenya Reports + EACC Investigation Records
// ─────────────────────────────────────────────────────────────
export const globalStats = {
  payrollFraud:         3_300_000_000,   // Ksh 3.3B — EACC active payroll investigation
  ghostEmployees:       1_885,           // Staff unaccounted for (4,884 → 2,999) — OAG payroll audit
  pendingBills:         985_121_904,     // Ksh 985.1M — County Executive pending bills 2024/2025
  countyAssemblyHidden: 56_027_772,      // Ksh 56M — deferred income omitted by the County Assembly
  donorUnabsorbed:      37_600_000,      // Ksh 37.6M — KDSP II grant, 65% of budget unabsorbed
  healthFacilitiesShut: 144,             // Facilities shut across Nandi County
  stalledProjects:      491,             // 2018/2019 audit period alone
  bursaryUnreceipted:   50_200_000,      // Ksh 50.2M — bursaries with no acknowledgement receipts
  totalTracked:         21,              // Documented projects & findings in this database
};
