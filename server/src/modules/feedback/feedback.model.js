import { Schema, model } from 'mongoose';
const feedbackSchema = new Schema({
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    guestUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    categories: {
        room: { type: Number, required: true, min: 1, max: 5 },
        cleanliness: { type: Number, required: true, min: 1, max: 5 },
        staff: { type: Number, required: true, min: 1, max: 5 },
        food: { type: Number, required: true, min: 1, max: 5 },
        overall: { type: Number, required: true, min: 1, max: 5 },
    },
    isPublished: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
feedbackSchema.index({ rating: 1, createdAt: -1 });
export const FeedbackModel = model('Feedback', feedbackSchema);
