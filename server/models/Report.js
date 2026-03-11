import mongoose from 'mongoose';

const reportSchema = mongoose.Schema(
  {
    ward: { type: String, required: true },
    issueType: { type: String, required: true },
    description: { type: String, required: true },
    reportId: { type: String, required: true },
    trackingCode: { type: String, required: true },
    status: { type: String, default: 'RECEIVED' },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
