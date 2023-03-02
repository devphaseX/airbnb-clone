import { RequestHandler } from 'express';
import {
  Place,
  placeCreateDocSchema,
  PlaceSchemaShapeMapStringId,
} from '../../model/place';
import { Image, ImageDoc } from '../../model';

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
      owner: req.user!._id,
    });

    return res.status(201).json(place);
  } catch (e) {
    console.log(e);
  }
};

type UpdatePlaceFormData = typeof placeCreateDocSchema._output & {
  id: string;
  _id: string;
};

type UpdatePlaceHandler = RequestHandler<any, any, UpdatePlaceFormData>;
type ImageServerInfo = { id: string; filename: string; imgUrlPath: string };

const updatePlace: UpdatePlaceHandler = async (req, res) => {
  try {
    console.log(req.body);
    const placeFormData = (await placeCreateDocSchema.parseAsync({
      ...req.body,
      id: req.body._id ?? req.body.id,
    })) as UpdatePlaceFormData;

    const place = await Place.findById(placeFormData.id).populate('photos');
    if (!place) {
      return res
        .status(404)
        .json({ message: 'A place with this id cannot be found' });
    }

    const standByPhotos: Set<string> = new Set();
    const newlyAddedPhotos: Map<string, ImageServerInfo> = new Map();
    placeFormData.photos.forEach((clientPhoto) => {
      place.photos.forEach((serverPhoto) => {
        if (clientPhoto.id.toString() !== serverPhoto.id.toString()) {
          newlyAddedPhotos.set(clientPhoto.id!, clientPhoto as ImageServerInfo);
        }
      });
    });

    const deletedPhotos: Set<string> = new Set();
    (
      place.photos as unknown as Array<ImageDoc & { _id?: string; id: string }>
    ).forEach((serverPhoto) => {
      placeFormData.photos.forEach((clientPhoto) => {
        if (
          clientPhoto.id.toString() !== serverPhoto.id.toString() &&
          !newlyAddedPhotos.has(clientPhoto.id)
        ) {
          deletedPhotos.add((serverPhoto._id ?? serverPhoto.id).toString());
        }

        if (
          !newlyAddedPhotos.has(serverPhoto.id.toString()) &&
          clientPhoto.id.toString() === serverPhoto.id.toString()
        ) {
          standByPhotos.add(clientPhoto.id.toString());
        }
      });
    });

    await Promise.allSettled(
      Array.from(newlyAddedPhotos, async ([_, { id }]) => {
        const image = await Image.findById(id);
        if (!image) return;
        standByPhotos.add(image.id!.toString());
      })
    );

    const { photos: _, ...restData } = placeFormData;
    await place.remove();

    const updatePlace = await Place.create({
      ...restData,
      photos: Array.from(standByPhotos),
      owner: req.user!._id,
    });

    return res
      .status(203)
      .json((await updatePlace.populate('photos')).toObject());
  } catch (e) {
    console.log(e);
  }
};

type GetPlacesHandler = RequestHandler;

const getPlaces: GetPlacesHandler = async (req, res) => {
  try {
    const places = await Place.find({
      owner: req.user._id! || req.user.id!,
    }).populate('photos', 'id filename imgUrlPath');
    return res.status(200).json(places);
  } catch (e) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

interface GetPlaceQuery extends qs.ParsedQs {
  placeId: string;
}
type GetPlaceHandler = RequestHandler<GetPlaceQuery>;

const getPlace: GetPlaceHandler = async (req, res) => {
  try {
    const { placeId } = req.params;
    const place = await Place.findOne({ id: placeId }).populate(
      'photos',
      'id filename imgUrlPath'
    );
    if (place) {
      return res.status(200).json(place);
    }

    return res
      .status(404)
      .json({ message: 'place with such id does not exist' });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { createAccomodation, getPlaces, getPlace, updatePlace };
