import { SchemaTimestampsConfig } from 'mongoose';
import { z } from 'zod';
import type { PlaceDoc } from './place.model';
import { CreateImagePayload } from '../../controller/image/upload';

type PlaceDocWithoutServerGen = Omit<
  PlaceDoc,
  keyof SchemaTimestampsConfig | 'owner' | 'photos'
> & { id?: string };
type PlaceSchemaShapeMapStringId = Required<
  Expand<MapObjectIdString<PlaceDocWithoutServerGen>>
> & { photos: Array<CreateImagePayload> };

const placeCreateDocSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  photoTag: z.string().optional(),
  address: z.string(),
  checkin: z.number({ coerce: true }),
  checkout: z.number({ coerce: true }),
  description: z.string(),
  extraInfo: z.string(),
  maxGuests: z.number({ coerce: true }),
  perks: z.string().array(),
  photos: z
    .array(
      z.object({
        filename: z.string(),
        id: z.string(),
        imgUrlPath: z.string().optional(),
      } as Record<keyof CreateImagePayload, any>)
    )
    .min(1),
} satisfies Record<keyof PlaceSchemaShapeMapStringId, any>);

export { placeCreateDocSchema, type PlaceSchemaShapeMapStringId };
