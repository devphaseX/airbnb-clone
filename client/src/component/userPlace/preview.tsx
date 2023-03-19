import { InfinitySpin, ProgressBar } from 'react-loader-spinner';

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
  data: File | Blob;
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

  let stagedImageAction: React.ReactNode | null;
  if (isProcessingFetch) {
    stagedImageAction = null;
  } else {
    stagedImageAction = (
      <div className="task">
        <span
          className="action-icon"
          onClick={() => {
            if (stageImageServerFinalizeStatus(staged))
              setAsPlacePhotoTag(getItemId(staged), removePhoto);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
            />
          </svg>
        </span>
        <span
          className="action-icon"
          onClick={() => removePhoto(getItemId(staged))}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </span>
      </div>
    );
  }

  if (isProcessingFetch) {
    //show loading skeleton
    return (
      <div className="stage-preview loading">
        <InfinitySpin />
        {stagedImageAction}
      </div>
    );
  }

  if (isFailedFetch || isFailedUpload) {
    return (
      <div className="stage-preview loading" style={{ fontSize: '1.6rem' }}>
        {retryStage ? (
          <span className="retry-icon" onClick={retryStage}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        ) : null}
        {stagedImageAction}
      </div>
    );
  }

  return isStagedLoaded || qualifyForPreview ? (
    <div className="stage-preview complete-preview">
      <img src={url} alt={staged.filename} />
      {isProcessingUpload ? (
        <div className="upload-icon center-progress">
          <ProgressBar />
        </div>
      ) : null}
      {stagedImageAction}
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
