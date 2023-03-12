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

const stageImageUpForPreview = (
  stage: RenderImage
): stage is
  | LoadedImage
  | FetchImageResourceComplete
  | UploadedImage
  | FetchServerCompleteImage =>
  (stage.status === 'complete' &&
    (stage.type === 'loaded' || stage.type === 'fetching')) ||
  stage.type === 'uploaded';

const stageImageServerFinalizeStatus = (
  staged: RenderImage
): staged is FetchServerCompleteImage | ImageUploadComplete =>
  staged.status === 'complete' &&
  (staged.type === 'uploaded' ||
    (staged.type === 'fetching' && 'imageServer' in staged));

const stageImageOnProcess = (
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

const stagedImageFailStatus = (
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
  !!stages.length && stages.every(stageImageServerFinalizeStatus);

type DisplayImagePreviewProps = PreviewProp & {
  setAsPlacePhotoTag: (
    imageId: string,
    removePhoto: DisplayImagePreviewProps['removePhoto']
  ) => void;
  removePhoto: (imageId: string, shouldKeepFind?: boolean) => void;
  retryStage?: () => void;
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
  retryStage,
}: ImagePreviewStageLoaderProps) => {
  const qualifyForPreview = stageImageUpForPreview(staged);
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
    return (
      <div style={{ fontSize: '1.6rem' }}>
        <span>Fetch Failed</span>
        {retryStage ? <span onClick={retryStage}>Retry</span> : null}
      </div>
    );
  }

  if (isFailedUpload) {
    return (
      <div>
        <span>Failed to upload</span>
        <span>Retry</span>
      </div>
    );
  }

  if (isProcessingUpload) {
    return <div>Uploading...</div>;
  }

  return isStagedLoaded || qualifyForPreview ? (
    <div className="complete-preview">
      <img src={url} alt={staged.filename} />
      <div className="task">
        <span
          onClick={() => {
            if (stageImageServerFinalizeStatus(staged))
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
  stageImageServerFinalizeStatus,
  stageImageOnProcess,
  stagedImageFailStatus,
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
