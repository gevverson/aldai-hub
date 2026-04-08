import mongoose from 'mongoose';

const verificationSchema = mongoose.Schema(
  {
    projectId:        { type: String, required: true },
    projectName:      { type: String, required: true },
    ward:             { type: String, required: true },
    lat:              { type: Number, required: true },
    lng:              { type: Number, required: true },
    description:      { type: String, required: true, maxlength: 500 },
    photoUrl:         { type: String, default: null },
    verifierCodename: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['CONFIRMS_GHOST', 'CONFIRMS_STALLED', 'CONFIRMS_COMPLETE', 'DISPUTES_OFFICIAL'],
    },

    // GPS evidence chain — populated by VerifyModal
    locationVerified: { type: Boolean, default: false },        // Was user within 2km of site?
    distanceFromSite: { type: Number, default: null },          // Metres from project coords at time of submission
    gpsSource:        { type: String, default: 'unavailable' }, // 'live' | 'fallback' | 'unavailable'
  },
  { timestamps: true }
);

// Compound index for fast consensus queries
verificationSchema.index({ projectId: 1, createdAt: -1 });
verificationSchema.index({ projectId: 1, status: 1 });

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
