import mongoose, { InferSchemaType } from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, require: true },
    lastName: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    birthday: { type: Date, require: true },
    password: { type: String, require: true },
  },
  { timestamps: true }
);

const User = mongoose.model('user', UserSchema);
type UserDoc = InferSchemaType<typeof UserSchema>;

export type { UserDoc };
export { User };
