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

const canPreviewStageImage = (
  stage: RenderImage
): stage is
  | LoadedImage
  | FetchImageResourceComplete
  | UploadedImage
  | FetchServerCompleteImage =>
  (stage.status === 'complete' &&
    (stage.type === 'loaded' || stage.type === 'fetching')) ||
  stage.type === 'uploaded';

const getstagedImageReadyStatus = (
  staged: RenderImage
): staged is FetchServerCompleteImage | ImageUploadComplete =>
  staged.status === 'complete' &&
  (staged.type === 'uploaded' ||
    (staged.type === 'fetching' && 'imageServer' in staged));

const getStagedImageProcessStatus = (
  staged: RenderImage
): staged is
  | FetchImageResourceProgress
  | FetchServerProgressImage
  | ImageUploadProgress
  | ImageUploadProgress =>
  staged.status === 'process' &&
  (staged.type === 'fetching' ||
    staged.type === 'uploaded' ||
    staged.type === 'loaded');

const getStagedImageFailedStatus = (
  staged: RenderImage
): staged is
  | FetchImageResourceFail
  | ImageUploadFail
  | FetchServerFailedImage
  | ImageUploadFail => staged.status === 'failed';

const unwrapServerStageResult = (
  stage: FetchServerImage | ImageUploadComplete
) => ('imageServer' in stage ? stage.imageServer : stage.serverImgInfo);

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
    .map((record) => mapServerIdToClient(unwrapServerStageResult(record)))
    .filter((info): info is NonNullable<typeof info> => !!info);

const clientQualifyToSendStageImage = (
  stages: Array<RenderImage>
): stages is Array<ImageUploadComplete | FetchServerCompleteImage> =>
  !!stages.length && stages.every(getstagedImageReadyStatus);

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
  const qualifyForPreview = canPreviewStageImage(staged);
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
            if (getstagedImageReadyStatus(staged))
              setAsPlacePhotoTag(getItemId(staged), removePhoto);
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
  clientQualifyToSendStageImage,
  genNaiveRandomId,
  getstagedImageReadyStatus,
  getStagedImageProcessStatus,
  getStagedImageFailedStatus,
  unwrapServerStageResult,
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
