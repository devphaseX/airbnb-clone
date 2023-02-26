import { RequestHandler } from 'express';
import {
  Place,
  placeCreateDocSchema,
  PlaceSchemaShapeMapStringId,
} from '../../model/place';
import { Image } from '../../model';

type CreateAccomodationHandler = RequestHandler<
  any,
  any,
  PlaceSchemaShapeMapStringId
>;

const createAccomodation: CreateAccomodationHandler = async (req, res) => {
  try {
    const placeFormData = await placeCreateDocSchema.parseAsync(
      JSON.parse(JSON.stringify(req.body))
    );

    const serverImageStatus = await Promise.all(
      Array.from(placeFormData.photos, async ({ id }) => {
        const image = await Image.findOne({ id });
        if (!image) return image;

        return image._id;
      })
    );
    const serverSortImages = serverImageStatus.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    const place = await Place.create({
      ...placeFormData,
      photos: serverSortImages,
    });

    return res.status(201).json(place);
  } catch (e) {
    console.log(e);
  }
};

export { createAccomodation };
