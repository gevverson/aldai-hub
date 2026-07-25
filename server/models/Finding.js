import mongoose from 'mongoose';

/**
 * A constituency-level audit finding, drawn from the narrative of an OAG
 * NG-CDF report (the audit opinion + basis-for-qualification items). Distinct
 * from Project: a Finding is a financial/compliance issue the Auditor-General
 * raised, not a physical project — so it is never rendered as a "ghost project".
 * Every finding carries the report + page it was read from.
 */
const findingSchema = mongoose.Schema(
  {
    county:       { type: String, required: true, index: true },
    constituency: { type: String, required: true, index: true },
    year:         { type: String, required: true },
    opinion:      { type: String, default: null },   // "Qualified Opinion" | "Adverse Opinion" | "Disclaimer Opinion"
    heading:      { type: String, required: true },
    category:     { type: String, default: 'Audit Finding' },
    amountKsh:    { type: Number, default: null },
    summary:      { type: String, required: true },
    source:       { type: String, required: true },   // OAG report + page citation
  },
  { timestamps: true }
);

findingSchema.index({ county: 1, constituency: 1, year: 1 });

const Finding = mongoose.model('Finding', findingSchema);
export default Finding;
