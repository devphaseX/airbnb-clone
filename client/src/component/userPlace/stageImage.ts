import {
  FetchImageResourceComplete,
  FetchImageResourceFail,
  FetchImageResourceProgress,
  FetchServerCompleteImage,
  FetchServerFailedImage,
  FetchServerProgressImage,
  FileLoadImageComplete,
  FileLoadImageFail,
  FileLoadImageProgress,
  ImageUploadComplete,
  ImageUploadFail,
  ImageUploadProgress,
  RenderImage,
  RenderImageBase,
  genNaiveRandomId,
} from './preview';

type StageImageStatus = NonNullable<RenderImage['status']>;
type StageImageType = NonNullable<RenderImage['type']>;

declare global {
  type PickShared<A, B> = Pick<A, Extract<keyof A, keyof B>>;
  type AnyFunction = (...args: any) => any;
  type RemoveEmptyValue<O> = {
    [K in keyof O as [O[K]] extends [never]
      ? never
      : O[K] extends null
      ? never
      : O[K] extends undefined
      ? never
      : K]: O[K];
  };

  type GetStageFunctionPart<T extends AnyFunction> = [
    Omit<Parameters<T>[0], '__'>,
    ReturnType<T>
  ];
}

type StageImageStatusProgress<A, B> = {
  passThrough: PickShared<A, B>;
  distinct: {} extends Omit<A, keyof B> ? void : Omit<A, keyof B>;
};

type StageImageEntry = {
  process: {
    task: StageImageStatusProgress<any, any>;
    next: Record<
      string,
      StageComplete<any, any> | [StageImageStatusProgress<any, any>]
    >;
  };
};

type StageComplete<Stage extends RenderImage, StageBase extends RenderImage> = [
  StageImageStatusProgress<Stage, StageBase>,
  StageImage['uploaded']
];

interface StageImage {
  fetching: {
    process: {
      task: StageImageStatusProgress<
        FetchImageResourceProgress,
        RenderImageBase
      >;
      next: {
        complete: StageComplete<
          FetchImageResourceComplete,
          FetchImageResourceProgress
        >;
        failed: [
          StageImageStatusProgress<
            FetchImageResourceFail,
            FetchImageResourceProgress
          >
        ];
      };
    };
  };
  fetchingS: {
    process: {
      task: StageImageStatusProgress<FetchServerProgressImage, RenderImage>;
      next: {
        complete: [
          StageImageStatusProgress<
            FetchServerCompleteImage,
            FetchServerProgressImage
          >
        ];
        failed: [
          StageImageStatusProgress<
            FetchServerFailedImage,
            FetchServerProgressImage
          >
        ];
      };
    };
  };

  loaded: {
    process: {
      task: StageImageStatusProgress<FileLoadImageProgress, RenderImageBase>;
      next: {
        complete: StageComplete<FileLoadImageComplete, FileLoadImageProgress>;
        failed: [
          StageImageStatusProgress<FileLoadImageFail, FileLoadImageProgress>
        ];
      };
    };
  };

  uploaded: {
    process: {
      task: StageImageStatusProgress<ImageUploadProgress, RenderImageBase>;
      next: {
        complete: [
          StageImageStatusProgress<ImageUploadComplete, ImageUploadProgress>
        ];
        failed: [
          StageImageStatusProgress<ImageUploadFail, ImageUploadProgress>
        ];
      };
    };
  };
}

type InferProgressStateType<Stage> = Stage extends StageImageStatusProgress<
  infer Result,
  any
>
  ? Result
  : never;

type StageImageResult<Stage extends StageImageEntry> = {
  process: (args: Stage['process']['task']['distinct']) => {
    current: () => InferProgressStateType<Stage['process']['task']>;

    transit: {
      [K in keyof Stage['process']['next']]: (
        args: Stage['process']['next'][K]['0']['distinct']
      ) => {
        current: () => InferProgressStateType<Stage['process']['next'][K]['0']>;
        revert?: () => ReturnType<StageImageResult<Stage>['process']>;
      } & (Stage['process']['next'][K] extends [
        any,
        infer R extends StageImageEntry
      ]
        ? { migrate: () => StageImageResult<R> }
        : {});
    };
  };
};

type CreateStageOptionTraitProps = {
  onId?: (id: string) => void;
  onStageChange?: OnStageFn;
  onMigrate?: (payload: RenderImage) => void;
  __?: {
    preMadeOnStage?: ReturnType<typeof createStatusObserver>;
    prevMadeOnMigrate?: ReturnType<typeof createMigrateObserver>;
  };
};

type CreateStageOption<
  Stage extends StageImageEntry,
  RemoveProps extends string = ''
> = Omit<Stage['process']['task']['passThrough'], RemoveProps> &
  CreateStageOptionTraitProps;

type _InternalDefStageKey = 'type' | 'status';

function createFetchServerStage(
  option: CreateStageOption<
    StageImage['fetchingS'],
    _InternalDefStageKey | 'id'
  >
): StageImageResult<StageImage['fetchingS']> {
  return {
    process: ({ imageServer }) => {
      const onStage =
        option.__?.preMadeOnStage ??
        (option.onStageChange
          ? createStatusObserver(option.onStageChange)
          : idenity);

      let processStage: FetchServerProgressImage = {
        id: genNaiveRandomId(),
        type: 'fetching',
        status: 'process',
        ...option,
        imageServer,
      };

      option.onId?.(processStage.id);

      onStage(null, { current: () => ({ ...processStage }) });
      const current: () => FetchServerProgressImage = () => ({
        ...processStage,
      });
      return {
        current,
        transit: {
          complete: () =>
            onStage(null, {
              current: () => ({
                ...processStage,
                status: 'complete',
              }),
              revert: () =>
                createFetchServerStage({
                  ...option,
                  __: {
                    preMadeOnStage: onStage,
                  },
                }).process({ imageServer }),
            }),
          failed: () =>
            onStage(
              { ...processStage },
              {
                current: () => ({ ...processStage, status: 'failed' }),
                revert: () =>
                  createFetchServerStage({
                    ...option,
                    __: {
                      preMadeOnStage: onStage,
                    },
                  }).process({ imageServer }),
              }
            ),
        },
      };
    },
  };
}

function createFetchResourceStage(
  option: CreateStageOption<StageImage['fetching'], _InternalDefStageKey | 'id'>
): StageImageResult<StageImage['fetching']> {
  return {
    process: ({ href }) => {
      const onStage =
        option.__?.preMadeOnStage ??
        (option.onStageChange
          ? createStatusObserver(option.onStageChange)
          : idenity);
      const onMigrate =
        option.__?.prevMadeOnMigrate ??
        (option.onMigrate ? createMigrateObserver(option.onMigrate) : idenity);
      let processStage: FetchImageResourceProgress = {
        id: genNaiveRandomId(),
        type: 'fetching',
        status: 'process',
        ...option,
        href,
      };

      option.onId?.(processStage.id);
      const current: () => FetchImageResourceProgress = () => ({
        ...processStage,
      });
      onStage(null, { current });
      return {
        current,
        transit: {
          complete: ({ data }) =>
            onMigrate(
              onStage(
                { ...processStage },
                {
                  current: () => ({
                    ...processStage,
                    status: 'complete',
                    data,
                  }),
                  migrate: () =>
                    createUploadStage({
                      id: processStage.id,
                      filename: option.filename!,
                    }),
                  revert: () =>
                    createFetchResourceStage({
                      ...option,
                      __: {
                        preMadeOnStage: onStage,
                        prevMadeOnMigrate: onMigrate,
                      },
                    }).process({ href }),
                }
              )
            ),
          failed: () =>
            onStage(
              { ...processStage },
              {
                current: () => ({ ...processStage, status: 'failed' }),
                revert: () =>
                  createFetchResourceStage({
                    ...option,
                    __: {
                      preMadeOnStage: onStage,
                      prevMadeOnMigrate: onMigrate,
                    },
                  }).process({ href }),
              }
            ),
        },
      };
    },
  };
}

function createLoadStage(
  option: CreateStageOption<StageImage['loaded'], _InternalDefStageKey | 'id'>
): StageImageResult<StageImage['loaded']> {
  return {
    process: () => {
      const onStage =
        option.__?.preMadeOnStage ??
        (option.onStageChange
          ? createStatusObserver(option.onStageChange)
          : idenity);
      const onMigrate =
        option.__?.prevMadeOnMigrate ??
        (option.onMigrate ? createMigrateObserver(option.onMigrate) : idenity);
      const processStage: FileLoadImageProgress = {
        id: genNaiveRandomId(),
        type: 'loaded',
        status: 'process',
        ...option,
      };

      option.onId?.(processStage.id);
      const current: () => FileLoadImageProgress = () => ({
        ...processStage,
      });
      onStage(null, { current });
      return {
        current,
        transit: {
          complete: ({ data }) =>
            onMigrate(
              onStage(
                { ...processStage },
                {
                  current: () => ({
                    ...processStage,
                    data,
                    status: 'complete',
                  }),
                  migrate: () =>
                    createUploadStage({
                      id: processStage.id,
                      filename: option.filename!,
                      __: {
                        preMadeOnStage: onStage,
                        prevMadeOnMigrate: onMigrate,
                      },
                    }),
                  revert: () =>
                    createLoadStage({
                      ...option,
                      __: {
                        preMadeOnStage: onStage,
                        prevMadeOnMigrate: onMigrate,
                      },
                    }).process(),
                }
              )
            ),
          failed: () =>
            onStage(
              { ...processStage },
              {
                current: () => ({ ...processStage, status: 'failed' }),
                revert: () =>
                  createLoadStage({
                    ...option,
                    __: {
                      preMadeOnStage: onStage,
                      prevMadeOnMigrate: onMigrate,
                    },
                  }).process(),
              }
            ),
        },
      };
    },
  };
}

function createUploadStage(
  option: CreateStageOption<StageImage['uploaded'], _InternalDefStageKey>
): StageImageResult<StageImage['uploaded']> {
  return {
    process: ({ data }) => {
      const onStage =
        option.__?.preMadeOnStage ??
        (option.onStageChange
          ? createStatusObserver(option.onStageChange)
          : idenity);

      let processStage: ImageUploadProgress = {
        type: 'uploaded',
        status: 'process',
        ...option,
        data,
      };
      const current: () => ImageUploadProgress = () => ({
        ...processStage,
      });
      onStage(null, { current });
      return {
        current,
        transit: {
          complete: ({ serverImgInfo }) =>
            onStage(
              { ...processStage },
              {
                current: () => ({
                  ...processStage,
                  data,
                  serverImgInfo,
                  status: 'complete',
                }),
                revert: () =>
                  createUploadStage({
                    ...option,
                    __: {
                      preMadeOnStage: onStage,
                    },
                  }).process({ data }),
              }
            ),

          failed: () =>
            onStage(
              { ...processStage },
              {
                current: () => ({ ...processStage, status: 'failed' }),
                revert: () =>
                  createUploadStage({
                    ...option,
                    __: {
                      preMadeOnStage: onStage,
                    },
                  }).process({ data }),
              }
            ),
        },
      };
    },
  };
}

type StageBaseFn = (
  option: CreateStageOption<StageImageEntry>
) => StageImageResult<StageImageEntry>;

type StageCreateFn<Entry extends StageImageEntry, RemoveKey extends string> = (
  option: CreateStageOption<Entry, RemoveKey>
) => StageImageResult<Entry>;

type StatusObserverOption<Payload> = { current: () => Payload };
type OnStageFn = (prev: RenderImage | null, next: RenderImage) => void;
function createStatusObserver(cb: OnStageFn) {
  return function observe<
    Payload extends RenderImage,
    State extends StatusObserverOption<Payload>
  >(prevStage: null | RenderImage, stateV: State) {
    cb(prevStage, { ...stateV.current() });
    return stateV as any;
  };
}

type MigrateObserverOption<Payload, NextProgressStage> =
  StatusObserverOption<Payload> & {
    migrate: () => {
      process: (args: any) => { current: () => NextProgressStage };
    };
  };

function createMigrateObserver(cb: (oldStage: RenderImage) => void) {
  return function observe<
    Payload extends RenderImage,
    NextProgressStage extends RenderImage,
    Migrate extends MigrateObserverOption<Payload, NextProgressStage>
  >(stateV: Migrate) {
    const realMigrate = stateV.migrate;
    stateV.migrate = () => {
      cb({ ...stateV.current() });
      return realMigrate.call(stateV);
    };

    return stateV;
  };
}

function idenity<V>(v: V) {
  return v;
}

type LoadSigPart = GetStageFunctionPart<typeof createLoadStage>;
type FetchServerSigPart = GetStageFunctionPart<typeof createFetchServerStage>;
type FetchExternalServerSigPart = GetStageFunctionPart<
  typeof createFetchResourceStage
>;
type UploadSigPart = GetStageFunctionPart<typeof createUploadStage>;

export {
  createFetchServerStage,
  createLoadStage,
  createStatusObserver,
  createMigrateObserver,
  createFetchResourceStage,
};
export type {
  StageImageType,
  StageImageStatus,
  CreateStageOption,
  StageImageResult,
  StageImage,
  StageImageEntry,
  OnStageFn,
  UploadSigPart,
  LoadSigPart,
  FetchServerSigPart,
  FetchExternalServerSigPart,
  StageBaseFn,
  StageCreateFn,
  _InternalDefStageKey,
  GetStageFunctionPart,
  CreateStageOptionTraitProps,
};
