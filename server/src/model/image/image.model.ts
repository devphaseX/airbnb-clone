import mongoose, { InferSchemaType } from 'mongoose';

const ImageSchema = new mongoose.Schema(
  {
    filename: { type: String, require: true },
    data: { binary: Buffer, contentType: String },
    imgUrlPath: { type: String, requrie: true },
  },
  { timestamps: true }
);

export const Image = mongoose.model('image', ImageSchema);

type ImageDoc = InferSchemaType<typeof ImageSchema>;
export { type ImageDoc };
