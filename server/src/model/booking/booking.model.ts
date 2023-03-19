import mongoose, { InferSchemaType } from 'mongoose';
import { Place } from '../place/place.model';
import { User } from '../user';

const BookingSchema = new mongoose.Schema(
  {
    placeId: { type: mongoose.Schema.Types.ObjectId, ref: Place },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: User },
    guests: { type: Number, require: true },
    checkIn: { type: Date, require: true },
    checkOut: { type: Date, require: true },
    price: { type: Number, require: true },
  },
  { timestamps: true }
);

type BookingDocRaw = InferSchemaType<typeof BookingSchema>;

export const Booking = mongoose.model('booking', BookingSchema);
export { type BookingDocRaw };
