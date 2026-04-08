import mongoose from 'mongoose';

const projectSchema = mongoose.Schema(
  {
    name:            { type: String, required: true },
    ward:            { type: String, required: true },
    fund:            { type: String, required: true },          // "NG-CDF" | "County"
    category:        { type: String, default: 'other' },        // "education" | "health" | "agriculture" | "transport" | "other"
    allocated:       { type: Number, required: true },
    contractValue:   { type: Number, default: null },           // If contract value differs from allocation
    year:            { type: String, required: true },          // String to support "2018/2019" format
    officialStatus:  { type: String, required: true },
    communityStatus: { type: String, required: true },
    auditNote:       { type: String, required: true },
    source:          { type: String, default: '' },             // OAG document citation
    lat:             { type: Number, default: null },
    lng:             { type: Number, default: null },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
