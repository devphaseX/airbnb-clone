import path from 'path';
import fs from 'fs/promises';
import { RequestHandler } from 'express';
import multer from 'multer';
import { Image, ImageDoc } from '../../model';
import { imageSchema } from '../../model/image/image.zod.schema';

const memoryStore = multer.memoryStorage();

const loadImage = multer({ storage: memoryStore }).single('image');

type CreateImagePayload = WithId<
  Pick<ImageDoc, 'filename' | 'imgUrlPath' | 'owner'>
>;

type CreateImageHandler = RequestHandler;
const createImage: CreateImageHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return next();

    const splitFileName = file.originalname.split('.');
    splitFileName.splice(-1, 0, new Date().toISOString());
    const filename = splitFileName.join('.');
    const image = await Image.create({
      filename,
      data: { binary: file.buffer, contentType: file.mimetype },
      imgUrlPath: `${req.protocol}://${req.headers.host}/image/${filename}`,
      owner: req.user.id.toString(),
    });

    const { data: _, ...clientData } = image.toObject();
    return res.status(201).json({ id: clientData._id, ...clientData });
  } catch (e) {
    next(e);
  }
};

type GetImageHandler = RequestHandler;
const getImage: GetImageHandler = async (req, res, next) => {
  try {
    let imageName = req.url.split('/').pop();
    if (!(imageName && /\..*$/.test(imageName))) return next();
    imageName = decodeURI(imageName);
    const image = await Image.findOne({ filename: imageName });
    if (image) {
      const imagePath = path.join(__dirname, 'file', 'images', imageName);
      await fs.writeFile(imagePath, image.data!.binary!);
      return res
        .set('content-type', image?.data?.contentType)
        .sendFile(imagePath, () => {
          fs.rm(imagePath).then(
            () => {},
            () => {}
          );
        });
    } else {
      return res.send('failed');
    }
  } catch (e) {
    next(e);
  }
};

type RemoveUntagImageHandler = RequestHandler<
  any,
  any,
  Array<WithId<Pick<ImageDoc, 'filename' | 'imgUrlPath' | 'owner'>>>
>;

const removeUnTagImage: RemoveUntagImageHandler = async (req, res, next) => {
  try {
    const untagImages = imageSchema
      .parse(req.body)
      .filter(({ owner }) =>
        owner && req.user ? owner.toString() === req.user.id.toString() : false
      );

    await Promise.all([
      untagImages.map(async ({ id }) => {
        const image = await Image.findOne({ id });
        await image?.remove();
      }),
    ]);

    return res.status(203).json({ message: 'deleted on untag image complete' });
  } catch (e) {
    // console.log(e);
    next(e);
  }
};
export {
  loadImage,
  createImage,
  getImage,
  removeUnTagImage,
  type CreateImagePayload,
};
