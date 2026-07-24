import mongoose from 'mongoose';

const projectSchema = mongoose.Schema(
  {
    name:            { type: String, required: true },

    // ── Geography ────────────────────────────────────────────────
    // County → Constituency → Ward. OAG audits NG-CDF at constituency
    // level, so `constituency` is the reliable unit. `constituency` is
    // null for county-wide projects (County Executive/Assembly reports),
    // and `ward` is only set where a source actually states it — it is
    // never inferred.
    county:          { type: String, required: true, index: true },
    constituency:    { type: String, default: null, index: true },
    ward:            { type: String, default: null },

    fund:            { type: String, required: true },          // "NG-CDF" | "County"
    category:        { type: String, default: 'other' },        // "education" | "health" | "agriculture" | "transport" | "security" | "other"
    allocated:       { type: Number, required: true },
    contractValue:   { type: Number, default: null },           // If contract value differs from allocation
    year:            { type: String, required: true },          // String to support "2018/2019" format
    officialStatus:  { type: String, required: true },
    communityStatus: { type: String, required: true, index: true },
    auditNote:       { type: String, required: true },
    source:          { type: String, default: '' },             // OAG document citation incl. page
    lat:             { type: Number, default: null },
    lng:             { type: Number, default: null },
  },
  { timestamps: true }
);

// Drill-down queries always narrow county → constituency → status.
projectSchema.index({ county: 1, constituency: 1, communityStatus: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
