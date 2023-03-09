import { RenderImage } from './preview';
import {
  FetchExternalServerSigPart,
  FetchServerSigPart,
  LoadSigPart,
  OnStageFn,
  StageCreateFn,
  StageImageEntry,
  StageImageType,
  _InternalDefStageKey,
  createFetchResourceStage,
  createFetchServerStage,
  createLoadStage,
} from './stageImage';

type StageMap = Map<StageImageType, Map<string, RenderImage>>;
type StageSubscriberStore = Map<string, Set<OnStageFn>>;
type IdStageMap = Map<string, StageImageType>;
type StageEntryOrderStore = Map<string, RenderImage>;

type Terminator = () => boolean;

type ImageStagerResult<ProcessInitiator> = [ProcessInitiator, Terminator];

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

  const onStageChange: OnStageFn = (prev, next) => {
    entryOrder.set(next.id, next);
    const observerStore = stagerSubscribers.get(next.id);
    if (observerStore) {
      observerStore.forEach((ob) => {
        ob(prev, next);
      });
    }

    if (prev) stageProgress.get(prev.type)?.delete(prev.id);

    stageId.set(next.id, next.type);
    let progressStore = stageProgress.get(next.type);
    if (!progressStore) {
      progressStore = new Map();
      stageProgress.set(next.type, progressStore);
    }

    progressStore.set(next.id, next);
    generalSubscriber.forEach((cb) => {
      cb(Array.from(entryOrder.values()));
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
        entryOrder.set(stageId!, stageProcess.current());
        return stageProcess;
      };

      stager.process = stagerProcess;
      return [
        stager,
        () =>
          stageId && externalOnStage
            ? unsubscribe(stageId, externalOnStage)
            : false,
      ];
    };
  }

  return {
    fromExternalServerFetch: createStageInitiator(createFetchResourceStage),
    fromFileLoad: createStageInitiator(createLoadStage),
    fromServerFetch: createStageInitiator(createFetchServerStage),
    unsubscribe: unsubscribe,
    stageResults: () => Array.from(entryOrder.values()),
    getStageState: (id) => entryOrder.get(id) ?? null,
    stillActive: (id) => !!entryOrder.get(id),
    removeStage: remove,
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
