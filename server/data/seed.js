export const projects = [
  { 
    id: 1,
    name: "Kimaren Girls Secondary School", 
    ward: "Kemeloi-Maraba", 
    fund: "NG-CDF", 
    allocated: 3200000, 
    year: 2019, 
    officialStatus: "Complete", 
    communityStatus: "GHOST PROJECT",
    auditNote: "School does not exist. Physical verification found nothing — empty field where school should be.",
    lat: 0.2153,
    lng: 35.2041
  },
  { 
    id: 2,
    name: "Dr. Sally Kosgei Secondary School Block", 
    ward: "Kobujoi",
    fund: "NG-CDF", 
    allocated: 3650000, 
    year: 2019,
    officialStatus: "Complete", 
    communityStatus: "DISPUTED",
    auditNote: "Cracked floors, leaking roof, no completion certificate. Paid as complete.",
    lat: 0.1512,
    lng: 35.1733
  },
  { 
    id: 3,
    name: "Kapsabet Mother & Baby Unit", 
    ward: "Kapsabet",
    fund: "County", 
    allocated: 208800000, 
    year: 2019,
    officialStatus: "Ongoing", 
    communityStatus: "STALLED",
    auditNote: "Incomplete 4+ years past deadline. Value for money unconfirmed. No contractor on site.",
    lat: 0.2002,
    lng: 35.0987
  },
  { 
    id: 4,
    name: "Kabiyet Dairy Creamery", 
    ward: "Kabiyet",
    fund: "County", 
    allocated: 621000000, 
    year: 2016,
    officialStatus: "Under Construction", 
    communityStatus: "STALLED",
    auditNote: "Non-operational after 8 years. Cost exceeds market rate by 340%. Procurement irregularities flagged.",
    lat: 0.4023,
    lng: 35.4189
  },
  { 
    id: 5,
    name: "Kobujoi Sub-County Hospital", 
    ward: "Kobujoi",
    fund: "County", 
    allocated: 3292946, 
    year: 2020,
    officialStatus: "Ongoing", 
    communityStatus: "STALLED",
    auditNote: "Signed contract documents withheld from auditors. Payment vouchers missing. Audit obstruction.",
    lat: 0.1633,
    lng: 35.1821
  },
  { 
    id: 6,
    name: "Kapsengere Hospital Phase II", 
    ward: "Terik",
    fund: "County", 
    allocated: 9954900, 
    year: 2019,
    officialStatus: "Complete", 
    communityStatus: "ABANDONED",
    auditNote: "Completely abandoned site. Defective ramp requires demolition. No completion certificate.",
    lat: -0.0812,
    lng: 35.2711
  },
  { 
    id: 7,
    name: "Mogomben Primary School Land", 
    ward: "Kemeloi-Maraba",
    fund: "NG-CDF", 
    allocated: 1000000, 
    year: 2019,
    officialStatus: "Complete", 
    communityStatus: "DISPUTED",
    auditNote: "1.2 acres purchased. No title deed transferred to school. Land ownership remains unclear.",
    lat: 0.2304,
    lng: 35.1944
  },
  { 
    id: 8,
    name: "Kiplengwai Primary School Land", 
    ward: "Kaptumo-Kaboi",
    fund: "NG-CDF", 
    allocated: 1200000, 
    year: 2019,
    officialStatus: "Complete", 
    communityStatus: "DISPUTED",
    auditNote: "Land purchased without title deed or survey beacons. Price inflated — market value Ksh 650,000.",
    lat: 0.5201,
    lng: 35.5534
  },
  { 
    id: 9,
    name: "Kapkoi Primary School Renovation", 
    ward: "Kobujoi",
    fund: "NG-CDF", 
    allocated: 400000, 
    year: 2019,
    officialStatus: "Complete", 
    communityStatus: "DISPUTED",
    auditNote: "Floor retains stagnant water. Broken windows. Structural cracks. Paid as complete.",
    lat: 0.1441,
    lng: 35.1678
  },
  { 
    id: 10,
    name: "Aldai Boys Secondary Classrooms", 
    ward: "Kabwareng",
    fund: "NG-CDF", 
    allocated: 4000000, 
    year: 2019,
    officialStatus: "Complete", 
    communityStatus: "MISALLOCATED",
    auditNote: "Built Form 1-4 classrooms for a school that only had Form 1 students. Suspected fund inflation.",
    lat: 0.0534,
    lng: 35.0781
  }
];

export const wards = [
  { name: "Kabwareng", budgetAllocated: 12000000, percentSpent: 85, stalledCount: 2, healthScore: "amber", lat: 0.055, lng: 35.08 },
  { name: "Terik", budgetAllocated: 15500000, percentSpent: 65, stalledCount: 4, healthScore: "red", lat: -0.08, lng: 35.27 },
  { name: "Kemeloi-Maraba", budgetAllocated: 18000000, percentSpent: 92, stalledCount: 3, healthScore: "red", lat: 0.22, lng: 35.20 },
  { name: "Kobujoi", budgetAllocated: 14200000, percentSpent: 78, stalledCount: 5, healthScore: "red", lat: 0.155, lng: 35.175 },
  { name: "Kaptumo-Kaboi", budgetAllocated: 11000000, percentSpent: 88, stalledCount: 1, healthScore: "amber", lat: 0.52, lng: 35.55 },
  { name: "Koyo-Ndurio", budgetAllocated: 13500000, percentSpent: 45, stalledCount: 1, healthScore: "green", lat: 0.30, lng: 35.30 }
];

export const globalStats = {
  payrollFraud: 3300000000,
  ghostEmployees: 1885,
  healthFacilitiesShut: 144,
  stalledInfrastructure: 1200000000
};
