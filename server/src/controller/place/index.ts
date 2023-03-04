import { RequestHandler } from 'express';
import {
  Place,
  placeCreateDocSchema,
  PlaceSchemaShapeMapStringId,
} from '../../model/place';
import { Image, ImageDoc } from '../../model';
import { getEnv } from '../../server';

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
    return res.status(500).json({
      message: 'Internal server error',
      ...(getEnv().NODE_ENV === 'development' && { error: e }),
    });
  }
};

type UpdatePlaceFormData = typeof placeCreateDocSchema._output & {
  id: string;
  _id: string;
};

type UpdateUserPlaceHandler = RequestHandler<any, any, UpdatePlaceFormData>;
type ImageServerInfo = { id: string; filename: string; imgUrlPath: string };

const updateUserPlace: UpdateUserPlaceHandler = async (req, res, next) => {
  try {
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

    await Promise.all(
      Array.from(deletedPhotos, async ([id]) => {
        const image = await Image.findById(id);
        if (!image) return;
        await image.remove();
      })
    );

    let { photos: _, photoTag, ...restData } = placeFormData;
    if (photoTag && !standByPhotos.has(photoTag.toString())) {
      const serverImage = await Image.findById(photoTag);
      await serverImage?.remove();
      [photoTag] = standByPhotos;
    }

    const updatePlace = await Place.create({
      ...restData,
      photos: Array.from(standByPhotos),
      owner: req.user!._id,
      photoTag,
    });

    await place.remove();

    return res
      .status(203)
      .json(
        (
          await updatePlace.populate('photos', '_id filename imgUrlPath')
        ).toObject()
      );
  } catch (e) {
    next(e);
  }
};

type GetPlacesHandler = RequestHandler;

const createGetPlacesHandler =
  (protectAccess: boolean): GetPlacesHandler =>
  async (req, res, next) => {
    try {
      let places;
      if (protectAccess) {
        places = await Place.find({
          owner: req.user._id! || req.user.id!,
        })
          .populate('photos', 'id filename imgUrlPath')
          .select('-owner')
          .populate('photoTag', 'imgUrlPath');
      } else {
        places = await Place.find()
          .select('-owner')
          .populate('photoTag', 'imgUrlPath');
      }
      return res.status(200).json(places);
    } catch (e) {
      next(e);
    }
  };

const getUserPlaces = createGetPlacesHandler(true);
const getPlaces = createGetPlacesHandler(false);

interface GetPlaceQuery extends qs.ParsedQs {
  placeId: string;
}
type GetPlaceHandler = RequestHandler<GetPlaceQuery>;

const createGetPlaceHandler =
  (protectAccess: boolean): GetPlaceHandler =>
  async (req, res, next) => {
    try {
      const { placeId } = req.params;
      let place;
      if (protectAccess) {
        place = await Place.findById(placeId)
          .populate('photos', 'id filename imgUrlPath')
          .populate('photoTag', 'imgUrlPath');
      } else {
        place = await Place.findById(placeId)
          .populate('photos', 'id filename imgUrlPath')
          .populate('owner', '-password -birthday -createdAt -updatedAt')
          .populate('photoTag', 'imgUrlPath');
      }
      if (place) {
        return res.status(200).json(place);
      }

      return res
        .status(404)
        .json({ message: 'place with such id does not exist' });
    } catch (e) {
      next(e);
    }
  };

const getUserPlace = createGetPlaceHandler(true);

export {
  createAccomodation,
  getUserPlaces,
  getUserPlace,
  updateUserPlace,
  getPlaces,
};
