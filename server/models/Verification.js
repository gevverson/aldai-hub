import mongoose from 'mongoose';

const verificationSchema = mongoose.Schema(
  {
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    ward: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, default: null },
    verifierCodename: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['CONFIRMS_GHOST', 'CONFIRMS_STALLED', 'CONFIRMS_COMPLETE', 'DISPUTES_OFFICIAL'],
    },
  },
  { timestamps: true }
);

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
