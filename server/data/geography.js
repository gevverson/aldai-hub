/**
 * geography.js — County → Constituency catalogue.
 *
 * This is the navigation backbone of the platform. It is intentionally
 * separate from project data: the hierarchy is a fact about Kenya, while
 * coverage (which constituencies we have audited data for) is a fact about
 * our ingestion progress. Keeping them apart means the UI can honestly show
 * "this constituency exists but we have no data yet" instead of pretending
 * a place does not exist.
 *
 * Scaling nationwide = adding entries here and running the harvester
 * (ai-service/pipeline/) for the new county. No code changes required.
 *
 * `covered` marks constituencies with OAG data ingested today.
 */

export const counties = [
  {
    name: 'Nandi',
    code: 29,
    constituencies: [
      { name: 'Aldai',       covered: true  },
      { name: 'Chesumei',    covered: true  },
      { name: 'Emgwen',      covered: true  },
      { name: 'Mosop',       covered: true  },
      { name: 'Nandi Hills', covered: true  },
      { name: 'Tinderet',    covered: false },
    ],
  },
  {
    name: 'Uasin Gishu',
    code: 27,
    constituencies: [
      { name: 'Ainabkoi', covered: true  },
      { name: 'Kapseret', covered: true  },
      { name: 'Kesses',   covered: true  },
      { name: 'Soy',      covered: true  },
      { name: 'Moiben',   covered: false },
      { name: 'Turbo',    covered: false },
    ],
  },
  {
    name: 'Kericho',
    code: 35,
    // Kericho's published NG-CDF reports carry narrative findings but no
    // per-project verification appendices, so there are audit findings to
    // read but no project register to map yet.
    constituencies: [
      { name: 'Ainamoi',         covered: false },
      { name: 'Belgut',          covered: false },
      { name: 'Bureti',          covered: false },
      { name: 'Kipkelion East',  covered: false },
      { name: 'Kipkelion West',  covered: false },
      { name: 'Sigowet/Soin',    covered: false },
    ],
  },
];

/** Flat list of every constituency, each tagged with its county. */
export const allConstituencies = counties.flatMap((c) =>
  c.constituencies.map((k) => ({ ...k, county: c.name }))
);

export const findCounty = (name) =>
  counties.find((c) => c.name.toLowerCase() === String(name).toLowerCase());

export const findConstituency = (name) =>
  allConstituencies.find(
    (k) => k.name.toLowerCase() === String(name).toLowerCase()
  );
