import path from 'path';
import fs from 'fs/promises';
import { RequestHandler } from 'express';
import multer from 'multer';
import { Image } from '../../model';

const memoryStore = multer.memoryStorage();

const loadImage = multer({ storage: memoryStore }).single('image');

type CreateImagePayload = { id: string; filename: string; imgUrlPath: string };

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
      imgUrlPath: `${req.protocol}://${req.headers.host}/${filename}`,
    });

    const { data: _, ...clientData } = image.toObject();
    return res.status(201).json({ id: clientData._id, ...clientData });
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
export { loadImage, createImage, getImage, type CreateImagePayload };
