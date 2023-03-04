import { z } from 'zod';
import { CreateImagePayload } from '../../controller/image/upload';

const imageSchema = z.array(
  z.object({
    owner: z.string().optional(),
    filename: z.string(),
    id: z.string(),
    imgUrlPath: z.string().optional(),
  } as Record<keyof CreateImagePayload, any>)
);

export { imageSchema };
