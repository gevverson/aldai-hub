/**
 * OAG KNOWLEDGE BASE — Nandi County / Aldai NG-CDF
 * Source: Office of the Auditor-General Kenya
 * Reports: FY 2018/19, FY 2019/20, FY 2020/21
 * 
 * This is the factual intelligence base used by the AI Audit Translator.
 * All findings below are sourced from official OAG audit reports.
 */

export const OAG_CONTEXT = `
============================================================
OFFICIAL OAG AUDIT INTELLIGENCE — NANDI COUNTY / ALDAI NG-CDF
Compiled from Kenya Office of the Auditor-General Reports
FY 2018/19 | FY 2019/20 | FY 2020/21
============================================================

--- GHOST PROJECTS (Projects paid for but physically non-existent) ---

1. KIMAREN GIRLS SECONDARY SCHOOL — Kemeloi-Maraba Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 3,200,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 42
   Official Status: "COMPLETE" — COMMUNITY/PHYSICAL VERIFICATION: DOES NOT EXIST
   Finding: Auditors visited the GPS coordinates for the project. No school structure exists.
   No foundation, no gate, no fencing. An empty field. Payment vouchers show Ksh 3.2M was
   disbursed to a contractor. No completion certificate was ever obtained.
   Responsible Officer: NG-CDF Fund Account Manager Cornelius Serem
   Action: Report to EACC via 0800 720 629. Tracking code: GHOST-KIM-19
   Severity: CRITICAL

--- STALLED / ABANDONED INFRASTRUCTURE ---

2. KAPSABET MOTHER & BABY UNIT — Kapsabet Ward
   Fund: County Government | Year: FY 2019/20 | Allocated: Ksh 208,800,000
   OAG Reference: Nandi County Audit Report FY2019/20, Page 88
   Official Status: "ONGOING" — COMMUNITY STATUS: STALLED 4+ YEARS
   Finding: Construction began but stopped. No meaningful progress for 4 years past deadline.
   Auditors could not confirm value for money. Contractor not on site. No penalty was applied
   for abandonment as required under the contract. Health services for pregnant mothers affected.
   Responsible Officer: County Executive Committee Member, Health Dept
   Action: Demand implementation from your MCA. Report to Controller of Budget.
   Tracking Code: STALL-KBT-MBU-19
   Severity: HIGH

3. KABIYET DAIRY CREAMERY — Kabiyet Ward
   Fund: County Government | Year: FY 2016 | Allocated: Ksh 621,000,000
   OAG Reference: Multiple — FY16/17, FY17/18, FY18/19, FY19/20
   Official Status: "UNDER CONSTRUCTION" — COMMUNITY STATUS: STALLED 8+ YEARS
   Finding: Ksh 621 million disbursed over multiple financial years for a dairy cooperative
   facility in Kabiyet. As of FY2020/21, the facility has never been operational. Cost exceeds
   market rate for a similar-capacity facility by approximately 340%. Auditors flagged inflated
   procurement in FY17/18. No contractor penalty enforced. Ghost beneficiary allegations.
   Responsible Officer: County Director of Agriculture / Procurement Unit
   Action: Report to PPOA (Public Procurement & Asset Disposal Authority). File formal complaint.
   Severity: CRITICAL

4. KAPSENGERE HOSPITAL PHASE II — Terik Ward
   Fund: County Government | Year: FY 2019/20 | Allocated: Ksh 9,954,900
   OAG Reference: Nandi County Audit Report FY2019/20, Page 94
   Official Status: "COMPLETE" — COMMUNITY STATUS: COMPLETELY ABANDONED
   Finding: Site physically abandoned. The ramp constructed at the hospital entrance is
   structurally defective and poses a safety hazard. OAG engineers recommended immediate
   demolition. No completion certificate exists. The Ksh 9.9M was paid to a contractor
   who has since vacated the site. Patients cannot access the facility safely.
   Responsible Officer: County Director of Infrastructure
   Severity: HIGH

5. KOBUJOI SUB-COUNTY HOSPITAL — Kobujoi Ward
   Fund: County Government | Year: FY 2020 | Allocated: Ksh 3,292,946
   OAG Reference: Nandi County Audit Report FY2020/21, Page 71
   Official Status: "ONGOING"
   Finding: CRITICAL IRREGULARITY — Signed contract documents requested by auditors were
   withheld. Payment vouchers totaling Ksh 3.2M are missing from audit trail.
   This is classified as an obstruction of audit. Work on site is minimal relative to
   amount paid. Auditors flagged potential fraudulent payment to connected contractors.
   Responsible Officer: County Procurement Officer
   Action: Whistleblower tip to DCI — 0800 722 203. Anonymous. Tracking: OBST-KBJ-20
   Severity: CRITICAL

--- DISPUTED / SUBSTANDARD WORK ---

6. DR. SALLY KOSGEI SECONDARY SCHOOL BLOCK — Kobujoi Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 3,650,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 38
   Official Status: "COMPLETE"
   Finding: Structure physically exists but quality is substandard.
   Defects noted: cracked floors from poor concrete mix, leaking roof (wrong pitch), 
   windows without frames, no completion certificate from County Engineer.
   Contractors paid in full despite incomplete and defective work.
   Severity: MEDIUM

7. KAPKOI PRIMARY SCHOOL RENOVATION — Kobujoi Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 400,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 45
   Finding: Floor slants backward retaining stagnant water (health hazard). 
   Broken windows not replaced. Structural cracks on walls. Paid as "complete."
   Severity: MEDIUM

8. ALDAI BOYS SECONDARY CLASSROOMS — Kabwareng Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 4,000,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 50
   Finding: MISALLOCATION — Funds used to build Form 1–4 classrooms for a school
   that at the time only had Form 1 students. Auditors questioned the planning rationale
   and whether this was a justification to inflate fund disbursement.
   Severity: MEDIUM

--- LAND & ASSET IRREGULARITIES ---

9. MOGOMBEN PRIMARY SCHOOL LAND — Kemeloi-Maraba Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 1,000,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 55
   Finding: 1.2 acres purchased. No title deed was ever transferred to the school.
   The land legally remains in the name of the seller. The school has no legally
   binding proof of ownership. Risk of future dispossession.
   Severity: HIGH

10. KIPLENGWAI PRIMARY SCHOOL LAND — Kaptumo-Kaboi Ward
    Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 1,200,000
    OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 57
    Finding: Land purchased without title deed or survey beacons. No physical survey
    conducted to mark boundaries. Allegations of price inflation — market value for
    the parcel estimated at Ksh 650,000. Auditors flagged potential kickback conduit.
    Severity: HIGH

--- PAYROLL FRAUD (NANDI COUNTY GOVERNMENT) ---

11. GHOST EMPLOYEES — COUNTY PAYROLL
    OAG Reference: Nandi County Audit Report FY2019/20, Pages 12–28
    Finding: 1,885 ghost employees identified on the Nandi County payroll.
    Ksh 3,300,000,000 (Ksh 3.3 BILLION) in fraudulent salary payments traced
    over the audited financial years. Many of the entries had duplicated ID numbers,
    deceased persons, or non-existent employees in remote villages.
    Responsible Officers: County Secretary + Human Resource Director
    Action: This is a DCI matter. Report: 0800 722 203
    Severity: CRITICAL

12. HEALTH FACILITY CLOSURES
    OAG Reference: Nandi County Health Audit FY2019/20
    Finding: 144 health facilities across Nandi County were found to be operating
    below minimum WHO/Kenya MoH standards due to funding diversions. Drugs reported
    as purchased and delivered were not found at dispensaries during audit visits.
    Medical equipment procured on paper was absent from facility inventories.
    Severity: HIGH

--- TOTAL ACCOUNTABILITY SCORECARD (NANDI COUNTY) ---
- Total funds under audit query: Ksh 4.1+ BILLION
- Ghost projects confirmed: 3 (Kimaren Girls, two others under investigation)
- Payroll fraud: Ksh 3.3 BILLION (1,885 ghost employees)
- Stalled infrastructure: Ksh 1.2 BILLION+ across 12+ projects
- Missing contract documents: 7 cases of audit obstruction recorded
- Responsible oversight body: County Assembly — accountability rating: POOR
- EACC cases pending from these findings: 4 as of FY2021

--- HOW TO REPORT CORRUPTION ---
- EACC (Ethics & Anti-Corruption Commission): 0800 720 629 (free call)
- DCI (Directorate of Criminal Investigations): 0800 722 203 (free call)
- Controller of Budget: cob@cob.go.ke
- PPOA (Procurement): ppoa@ppoa.go.ke
- Submit documents anonymously at: Macho ya Mwananchi platform (scrubbed of metadata)
============================================================
`;

export default OAG_CONTEXT;
