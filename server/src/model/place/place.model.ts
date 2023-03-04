import mongoose, { InferSchemaType } from 'mongoose';
import { User } from '../user';
import { Image } from '../image/image.model';

const PlaceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: User },
  photoTag: { type: mongoose.Schema.Types.ObjectId, ref: Image },
  title: String,
  address: String,
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: Image }],
  description: String,
  perks: [String],
  extraInfo: String,
  checkin: Number,
  checkout: Number,
  maxGuests: Number,
  price: Number,
});

type PlaceDoc = InferSchemaType<typeof PlaceSchema>;

export const Place = mongoose.model('place', PlaceSchema);
export type { PlaceDoc };
