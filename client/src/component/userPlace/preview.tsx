import './style.preview.css';
import type { CreateImagePayload } from '../../../../server/src/controller/image/upload';
import { getItemId } from '../../util';
import './style.preview.css';

type RenderImageObserver = (staged: Readonly<RenderImage>) => void;

interface RenderImageBase {
  id: string;
  type: string;
  filename?: string;
  status?: 'process' | 'failed' | 'complete';
  subscribe?: (observer: RenderImageObserver) => void;
}

interface FetchImageBase extends RenderImageBase {
  type: 'fetching';
  status: 'process' | 'failed' | 'complete';
}

interface FetchServerImage extends FetchImageBase {
  imageServer: CreateImagePayload;
}

interface FetchServerProgressImage extends FetchServerImage {
  status: 'process';
}

interface FetchServerFailedImage extends FetchServerImage {
  status: 'failed';
}

interface FetchServerCompleteImage extends FetchServerImage {
  status: 'complete';
}

interface FetchImageResourceBase extends FetchImageBase {
  href: string;
}

interface FetchImageResourceProgress extends FetchImageResourceBase {
  status: 'process';
}

interface FetchImageResourceFail extends FetchImageResourceBase {
  status: 'failed';
  notFound?: boolean;
}

interface FetchImageResourceComplete extends FetchImageResourceBase {
  status: 'complete';
  data: File | Blob;
}

type FetchImage =
  | FetchImageResourceProgress
  | FetchImageResourceFail
  | FetchImageResourceComplete
  | FetchServerCompleteImage
  | FetchServerFailedImage
  | FetchServerProgressImage;

interface FileLoadImageBase extends RenderImageBase {
  type: 'loaded';
}

interface FileLoadImageProgress extends FileLoadImageBase {
  filename: string;
  status: 'process';
}

interface FileLoadImageComplete extends FileLoadImageBase {
  filename: string;
  status: 'complete';
  data: File | Blob;
}

interface FileLoadImageFail extends FileLoadImageBase {
  filename: string;
  status: 'failed';
}

type LoadedImage =
  | FileLoadImageProgress
  | FileLoadImageComplete
  | FileLoadImageFail;

interface UploadImageBase extends RenderImageBase {
  type: 'uploaded';
  filename: string;
}

interface ImageUploadProgress extends UploadImageBase {
  data: Blob | File;
  status: 'process';
  progress?: number;
}

interface ImageUploadFail extends UploadImageBase {
  data: Blob | File;
  status: 'failed';
}

interface ImageUploadComplete extends UploadImageBase {
  status: 'complete';
  data: Blob | File;
  serverImgInfo: CreateImagePayload;
}

type UploadedImage =
  | ImageUploadProgress
  | ImageUploadFail
  | ImageUploadComplete;

type RenderImage = FetchImage | LoadedImage | UploadedImage;

const genNaiveRandomId = () => Math.random().toString(32).slice(2);

const createLoadedImage = (file: File, id?: string): FileLoadImageProgress => ({
  id: id ?? genNaiveRandomId(),
  type: 'loaded',
  status: 'process',
  filename: file.name,
});

const createFetchImage = (href: string): FetchImageResourceProgress => ({
  id: genNaiveRandomId(),
  type: 'fetching',
  status: 'process',
  href,
});

const createServerFetchImage = (
  file: CreateImagePayload
): FetchServerProgressImage => ({
  id: getItemId(file),
  status: 'process',
  type: 'fetching',
  filename: file.filename,
  imageServer: file,
});

const createUploadImage = (
  id: string,
  file: File | Blob,
  filename: string
): ImageUploadProgress => ({
  id,
  type: 'uploaded',
  status: 'process',
  filename,
  data: file,
});

const canRenderImagePreview = (
  image: RenderImage
): image is
  | LoadedImage
  | FetchImageResourceComplete
  | UploadedImage
  | FetchServerCompleteImage =>
  image.type === 'loaded' ||
  (image.type === 'fetching' && image.status === 'complete') ||
  image.type === 'uploaded';

const progressFetchImageComplete = (
  stage: FetchImageResourceProgress,
  data: FetchImageResourceComplete['data']
): FetchImageResourceComplete => ({
  ...stage,
  status: 'complete',
  data,
});

const progressFetchImageFailed = (
  stage: FetchImageResourceProgress,
  notFound?: boolean
): FetchImageResourceFail => ({ ...stage, status: 'failed', notFound });

const progressImageUploadComplete = (
  stage: ImageUploadProgress,
  serverImgInfo: CreateImagePayload
): ImageUploadComplete => ({
  id: stage.id,
  type: stage.type,
  status: 'complete',
  filename: stage.filename,
  data: stage.data,
  serverImgInfo,
});

const mapServerIdToClient = <
  IdentifiableItem extends { _id?: string; id: string }
>({
  _id,
  id,
  ...rest
}: IdentifiableItem) => ({ id: _id ?? id, ...rest });

const getStageImageServerInfo = (
  staged: Array<ImageUploadComplete | FetchServerCompleteImage>
) =>
  staged
    .map((record) =>
      mapServerIdToClient(
        record.type === 'fetching' ? record.imageServer : record.serverImgInfo
      )
    )
    .filter((info): info is NonNullable<typeof info> => !!info);

const progressImageUploadFailed = (
  stage: ImageUploadProgress
): ImageUploadFail => ({ ...stage, status: 'failed' });

const hasUploadImagesComplete = (
  stageImages: Array<RenderImage>
): stageImages is Array<ImageUploadComplete> =>
  !!stageImages.length &&
  stageImages.every(
    (stage) =>
      stage.type === 'uploaded' ||
      (stage.type === 'fetching' && 'imageServer' in stage)
  );

type DisplayImagePreviewProps = PreviewProp & {
  setAsPlacePhotoTag: (
    imageId: string,
    removePhoto: DisplayImagePreviewProps['removePhoto']
  ) => void;
  removePhoto: (imageId: string, shouldKeepFind?: boolean) => void;
};

const DisplayImagePreview = ({
  staged,
  ...sametype
}: DisplayImagePreviewProps) => (
  <ImagePreviewStageLoader staged={staged} {...sametype} />
);

interface PreviewProp {
  staged: RenderImage;
  resolveImageLink: (staged: RenderImage, id: string) => string | undefined;
}

type ImagePreviewStageLoaderProps = DisplayImagePreviewProps & {};

const ImagePreviewStageLoader = ({
  staged,
  resolveImageLink,
  setAsPlacePhotoTag,
  removePhoto,
}: ImagePreviewStageLoaderProps) => {
  const qualifyForPreview = canRenderImagePreview(staged);
  const url = resolveImageLink(staged, staged.id);
  //fetching staged
  const _isStagedFetch = staged.type === 'fetching';
  const isProcessingFetch = _isStagedFetch && staged.status === 'process';
  const isFailedFetch = _isStagedFetch && staged.status === 'failed';
  //loaded staged
  const isStagedLoaded = staged.type === 'loaded';

  //upload staged
  const _isStagedUpload = staged.type === 'uploaded';
  const isProcessingUpload = _isStagedUpload && staged.status === 'process';
  const isFailedUpload = _isStagedUpload && staged.status === 'failed';

  if (isProcessingFetch) {
    //show loading skeleton
    return <div>Loading...</div>;
  }

  if (isFailedFetch) {
    return <div>Fetch Failed</div>;
  }

  if (isFailedUpload) {
    return <div>Failed to upload</div>;
  }

  if (isProcessingUpload) {
    return <div>Uploading...</div>;
  }

  return isStagedLoaded || qualifyForPreview ? (
    <div className="complete-preview">
      <img src={url} alt={staged.filename} loading="lazy" />
      <div className="task">
        <span
          onClick={() => {
            if (
              (staged.type === 'fetching' && 'imageServer' in staged) ||
              staged.type === 'uploaded'
            ) {
              setAsPlacePhotoTag(
                getItemId(
                  staged.type === 'fetching'
                    ? staged.imageServer
                    : staged.serverImgInfo
                ),
                removePhoto
              );
            }
          }}
        >
          Mark
        </span>
        <span onClick={() => removePhoto(getItemId(staged))}>Delete</span>
      </div>
    </div>
  ) : null;
};

export {
  getStageImageServerInfo,
  DisplayImagePreview,
  createFetchImage,
  createLoadedImage,
  createUploadImage,
  hasUploadImagesComplete,
  progressFetchImageComplete,
  progressFetchImageFailed,
  progressImageUploadFailed,
  progressImageUploadComplete,
  createServerFetchImage,
  genNaiveRandomId,
};

export type {
  RenderImage,
  FetchImageResourceProgress,
  FetchImageResourceComplete,
  FetchImageResourceFail,
  ImageUploadProgress,
  ImageUploadComplete,
  ImageUploadFail,
  FetchServerCompleteImage,
  FetchServerFailedImage,
  FetchServerProgressImage,
  LoadedImage,
  RenderImageBase,
  FileLoadImageProgress,
  FileLoadImageComplete,
  FileLoadImageFail,
};
