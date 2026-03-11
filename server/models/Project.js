import mongoose from 'mongoose';

const projectSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    ward: { type: String, required: true },
    fund: { type: String, required: true },
    allocated: { type: Number, required: true },
    year: { type: Number, required: true },
    officialStatus: { type: String, required: true },
    communityStatus: { type: String, required: true },
    auditNote: { type: String, required: true },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
