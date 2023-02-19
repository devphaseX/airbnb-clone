import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema(
  {
    filename: { type: String, require: true },
    data: { binary: Buffer, contentType: String },
  },
  { timestamps: true }
);

export const Image = mongoose.model('image', ImageSchema);
