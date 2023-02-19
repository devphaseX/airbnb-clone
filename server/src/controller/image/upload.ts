import path from 'path';
import fs from 'fs/promises';
import { RequestHandler } from 'express';
import multer from 'multer';
import { Image } from '../../model';

const memoryStore = multer.memoryStorage();

const loadImage = multer({ storage: memoryStore }).single('image');

type CreateImageHandler = RequestHandler;
const createImage: CreateImageHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return next();

    const splitFileName = file.originalname.split('.');
    splitFileName.splice(-1, 0, new Date().toISOString());
    const image = await Image.create({
      filename: splitFileName.join('.'),
      data: { binary: file.buffer, contentType: file.mimetype },
    });

    return res.status(201).json({
      url: image.filename,
      path: `${req.protocol}://${req.headers.host}/${image.filename}`,
    });
  } catch (e) {
    console.log(e);
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
    console.log(e);
  }
};
export { loadImage, createImage, getImage };
