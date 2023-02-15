import { SchemaTimestampsConfig } from 'mongoose';
import { z } from 'zod';
import { UserDoc } from './user.model';
import { encodePassword } from '../../controller/auth/encrypt';

type UserCreateFormData = Omit<UserDoc, keyof SchemaTimestampsConfig> & {
  confirmPassword?: string;
};
type UserSchemaShape = TypedZodType<UserCreateFormData>;

const userPasswordSchema = z
  .string()
  .regex(/^[A-Z]/, 'password must begin with a capital letter')
  .regex(/\W/, 'password must contain a unique non alphabetical letter')
  .regex(/\d/, 'password must contain as least one numerica value');

const userCreateDocSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    birthday: z.date({ coerce: true }),
    email: z.string().email(),
    password: userPasswordSchema,
    confirmPassword: userPasswordSchema.optional(),
  } satisfies UserSchemaShape)
  .refine(
    (record) =>
      typeof record.confirmPassword !== 'undefined'
        ? record.password === record.confirmPassword
        : true,
    {
      message: `password doesn't match with confirmPassword`,
      path: ['confirmPasswor'],
    }
  )
  .transform(async ({ confirmPassword: _, ...safeRecord }) => ({
    ...safeRecord,
    password: await encodePassword(safeRecord),
  }));

type UserLoginFormData = Pick<UserCreateFormData, 'email' | 'password'>;
type UserLoginSchemaFormShape = TypedZodType<UserLoginFormData>;

const userAuthDocSchema = z.object({
  email: z.string().trim().email(),
  password: userPasswordSchema.trim(),
} satisfies UserLoginSchemaFormShape);

export { userCreateDocSchema, userAuthDocSchema };
export type { UserLoginFormData, UserCreateFormData };
