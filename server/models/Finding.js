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

    // Why `amountKsh` may disagree with the figure quoted inside `summary`.
    // OAG text layers carry OCR damage that can inflate a number by orders of
    // magnitude (a real case: 'Kshs.14,603,311,047,800' for a balance of
    // 14,603,311). The repair pipeline fixes the headline figure but quotes the
    // source text verbatim, so without this note the card appears to contradict
    // itself. Set by ai-service/pipeline/repair_data.py; null for the ~99.7% of
    // findings whose amount parsed cleanly.
    amountNote:   { type: String, default: null },

    summary:      { type: String, required: true },
    source:       { type: String, required: true },   // OAG report + page citation
  },
  { timestamps: true }
);

findingSchema.index({ county: 1, constituency: 1, year: 1 });

const Finding = mongoose.model('Finding', findingSchema);
export default Finding;
