import { UserCreateFormData, UserDoc } from '../../model';
import bcrypt from 'bcrypt';

const salt = bcrypt.genSaltSync(10);
const encodePassword = (user: Readonly<UserCreateFormData>) => {
  return bcrypt.hash(user.password!, salt);
};

const comparePassword = (user: UserDoc, password: string) => {
  return bcrypt.compare(password, user.password!);
};

export { encodePassword, comparePassword };
