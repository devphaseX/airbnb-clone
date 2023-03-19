import { getPromisePart } from '../../util';
import { RenderImage } from './preview';
import {
  FetchExternalServerSigPart,
  FetchServerSigPart,
  LoadSigPart,
  OnStageFn,
  StageCreateFn,
  StageImageEntry,
  StageImageType,
  StageState,
  _InternalDefStageKey,
  createFetchResourceStage,
  createFetchServerStage,
  createLoadStage,
} from './stageImage';

type RetrySignalFn = (retry: boolean) => void;
type StageMap = Map<StageImageType, Map<string, StageState<RenderImage>>>;
type StageSubscriberStore = Map<string, Set<OnStageFn>>;
type IdStageMap = Map<string, StageImageType>;
type StageEntryOrderStore = Map<string, StageState<RenderImage>>;
type RetrySignalStore = Map<
  string,
  {
    retry: RetrySignalFn;
    state: Promise<boolean>;
    status: 'waiting' | 'settled';
  }
>;

type Terminator = () => boolean;

type SignAwaiterFnOption = {
  signal?: AbortSignal;
  waitAfterRetry?: number | Promise<void>;
};
type SignalAwaiterFn = (
  id: string,
  option?: SignAwaiterFnOption
) => Promise<boolean>;
type ImageStagerResult<ProcessInitiator> = [
  ProcessInitiator,
  Terminator,
  SignalAwaiterFn
];

type ImageStager = {
  fromFileLoad: (option: LoadSigPart[0]) => ImageStagerResult<LoadSigPart[1]>;

  fromServerFetch: (
    option: FetchServerSigPart[0]
  ) => ImageStagerResult<FetchServerSigPart[1]>;
  fromExternalServerFetch: (
    option: FetchExternalServerSigPart[0]
  ) => ImageStagerResult<FetchExternalServerSigPart[1]>;
  unsubscribe: (id: string, cb: OnStageFn) => boolean;
  stageResults: () => Array<RenderImage>;
  onStageChange: (
    cb: (nextEntryState: Array<RenderImage>) => void
  ) => () => void;

  getStageState: (id: string) => RenderImage | null;
  getRetryState: (id: string) => RetrySignalFn | null;
  stillActive: (id: string) => boolean;
  removeStage: (id: string) => boolean;
};

function createImageStager(): ImageStager {
  const stagerSubscribers: StageSubscriberStore = new Map();
  const stageProgress: StageMap = new Map();
  const stageId: IdStageMap = new Map();
  const entryOrder: StageEntryOrderStore = new Map();
  const generalSubscriber: Set<Parameters<ImageStager['onStageChange']>[0]> =
    new Set();

  const retrySignalStore: RetrySignalStore = new Map();

  const onStageChange: OnStageFn = (prev, next) => {
    const nextCurrent = next.current();
    entryOrder.set(nextCurrent.id, next);
    const observerStore = stagerSubscribers.get(nextCurrent.id);
    if (observerStore) {
      observerStore.forEach((ob) => {
        ob(prev, next);
      });
    }

    if (prev) stageProgress.get(prev.type)?.delete(prev.id);

    stageId.set(nextCurrent.id, nextCurrent.type);
    let progressStore = stageProgress.get(nextCurrent.type);
    if (!progressStore) {
      progressStore = new Map();
      stageProgress.set(nextCurrent.type, progressStore);
    }

    progressStore.set(nextCurrent.id, next);
    generalSubscriber.forEach((cb) => {
      cb(Array.from(entryOrder.values(), (entry) => entry.current()));
    });
  };

  function subscribeStage(id: string, cb: OnStageFn) {
    if (stagerSubscribers.get(id)) {
      throw new Error(
        `Subscription is only allowed once for a stage image with a particular id.
         There exist all ready a stage with should id:${id}`
      );
    }

    let stageSubStore = stagerSubscribers.get(id);
    if (!stageSubStore) {
      stageSubStore = new Set();
      stagerSubscribers.set(id, stageSubStore);
    }

    stageSubStore.add(cb);
  }

  function remove(id: string) {
    const stageType = stageId.get(id);
    if (!stageType) return false;

    const stageTypeStore = stageProgress.get(stageType);
    if (stageTypeStore && stageTypeStore.get(id)) {
      stageTypeStore.delete(id);
      entryOrder.delete(id);

      generalSubscriber.forEach((cb) => {
        cb(Array.from(entryOrder.values(), (entry) => entry.current()));
      });
      return true;
    }
    return false;
  }

  function unsubscribe(id: string, cb: OnStageFn) {
    const stageSubStore = stagerSubscribers.get(id);
    if (!stageSubStore) return false;
    let foundAndDelete = stageSubStore.delete(cb);
    if (!stageSubStore.size) stagerSubscribers.delete(id);
    return foundAndDelete;
  }

  function createStageInitiator<
    Entry extends StageImageEntry,
    RemoveKey extends string
  >(createStage: StageCreateFn<Entry, RemoveKey>) {
    return function <
      StageFnPart extends GetStageFunctionPart<StageCreateFn<Entry, RemoveKey>>
    >(option: StageFnPart[0]): ImageStagerResult<StageFnPart[1]> {
      const externalOnStage = option.onStageChange;
      option = {
        ...option,
        onStageChange,
        onId: (id: string) => {
          if (externalOnStage) {
            stageId = id;
            subscribeStage(id, externalOnStage);
          }
        },
      };

      const stager = createStage(option);
      let stageId: null | string = null;
      const __stagerProcess = stager.process;
      const stagerProcess: typeof __stagerProcess = (
        processOption: Parameters<typeof __stagerProcess>[0]
      ) => {
        const stageProcess = __stagerProcess(processOption);
        stageId = stageProcess.current().id;
        entryOrder.set(stageId!, stageProcess);
        return stageProcess;
      };

      stager.process = stagerProcess;
      return [
        stager,
        () =>
          stageId && externalOnStage
            ? unsubscribe(stageId, externalOnStage)
            : false,

        awaitRetrySignal,
      ];
    };
  }

  function awaitRetrySignal(id: string, option?: SignAwaiterFnOption) {
    const staged = entryOrder.get(id);
    if (!(staged && staged.revert)) return Promise.resolve(false);
    const { signal, waitAfterRetry } = option ?? {};

    const { promise, resolve } = getPromisePart<boolean>();
    const retryFn: RetrySignalFn = (shouldRetry) => {
      const retryStage = retrySignalStore.get(id);
      if (retryStage && retryStage.status === 'waiting') {
        retryStage.status = 'settled';

        const staged = entryOrder.get(id);
        if (!(staged && staged.revert)) return resolve(false);
        staged.revert();
        generalSubscriber.forEach((cb) => {
          cb(Array.from(entryOrder.values(), (entry) => entry.current()));
        });

        Promise.resolve().then(() => {
          resolve(shouldRetry);
          retrySignalStore.delete(id);
        });
      }
    };

    signal?.addEventListener('abort', () => retryFn(false), {
      once: true,
    });

    retrySignalStore.set(id, {
      retry: retryFn,
      state: promise,
      status: 'waiting',
    });

    if (
      typeof waitAfterRetry === 'number' ||
      (typeof waitAfterRetry === 'object' &&
        typeof waitAfterRetry.then === 'function')
    ) {
      return promise
        .then(() => {
          let timerPromise = waitAfterRetry as Promise<void>;

          if (typeof waitAfterRetry === 'number') {
            const { promise, resolve } = getPromisePart<void>();

            setTimeout(resolve, waitAfterRetry);
            timerPromise = promise;
          }

          return timerPromise;
        })
        .then(() => promise);
    }
    return promise;
  }

  function getRetryState(id: string): RetrySignalFn | null {
    const retryState = retrySignalStore.get(id);
    if (!retryState) return null;
    if (retryState.status === 'settled') return null;
    return retryState.retry;
  }

  return {
    fromExternalServerFetch: createStageInitiator(createFetchResourceStage),
    fromFileLoad: createStageInitiator(createLoadStage),
    fromServerFetch: createStageInitiator(createFetchServerStage),
    unsubscribe: unsubscribe,
    stageResults: () =>
      Array.from(entryOrder.values(), (entry) => entry.current()),
    getStageState: (id) => entryOrder.get(id)?.current() ?? null,
    stillActive: (id) => entryOrder.has(id),
    removeStage: remove,
    getRetryState,
    onStageChange: (cb) => {
      generalSubscriber.add(cb);
      let hasUnsubscribed = false;
      return () => {
        if (!hasUnsubscribed && (hasUnsubscribed = true)) {
          generalSubscriber.delete(cb);
        }
      };
    },
  };
}

export { createImageStager };
