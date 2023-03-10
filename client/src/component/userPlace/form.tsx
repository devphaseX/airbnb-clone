import { useQueryClient } from 'react-query';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useLoaderData, useNavigate, useOutletContext } from 'react-router-dom';
import './style.css';
import { useState } from 'react';
import {
  establishParentChildAbort,
  getItemId,
  inferImagename,
  inferUrlFileExt,
  sleep,
} from '../../util';
import { BASE_URL, fetchFn } from '../../store/api/baseUrl';
import { uploadImage } from '../../store/api/uploadApi';
import { useRef } from 'react';
import { useEffect } from 'react';
import {
  DisplayImagePreview,
  ImageUploadComplete,
  clientQualifyToSendStageImage,
  getStageImageServerInfo,
  getStagedImageProcessStatus,
  getstagedImageReadyStatus,
} from './preview';
import type { RenderImage } from './preview';
import { useCreatePlace } from '../../store/mutation/place';
import { PlaceDoc } from '../../../../server/src/model';
import { AxiosResponse } from 'axios';
import { CreateImagePayload } from '../../../../server/src/controller/image/upload';
import { AccountOutletContext } from '../../pages';
import { useImageDelete } from '../../store/mutation/deleteImage';
import { useImageStage } from '../../hooks/useImageStage';
import { unwrapStatusObserverPayload } from './stageImage';

interface AccomodationFormData
  extends Omit<PlaceDoc, 'owner' | 'photos' | 'photoTag'> {
  photo: string;
  photoTag?:
    | (Pick<CreateImagePayload, 'imgUrlPath'> & { id: string; _id?: string })
    | string;
}

interface ClientAccomodationFormData
  extends Omit<AccomodationFormData, 'photo'> {
  id?: string;
  photos: Array<CreateImagePayload>;
}

interface ServerAccomodationData extends ClientAccomodationFormData {
  id: string;
  _id?: string;
  photoTag: NonNullable<AccomodationFormData['photoTag']> extends infer PhotoTag
    ? Exclude<PhotoTag, string>
    : never;
}

const NO_EDIT_MODE = Object.freeze({});
const AccomodationForm = () => {
  const data = (useLoaderData() as ServerAccomodationData) ?? NO_EDIT_MODE;
  const [placePhotoTag, setPlacePhotoTag] = useState<string | null>(
    (data.photoTag && getItemId(data.photoTag).toString()) ?? null
  );
  const { photos, id, _id, ...editFormData } = data;
  const { register, handleSubmit, getValues, resetField } =
    useForm<AccomodationFormData>({ values: { ...editFormData, photo: '' } });
  const directUntagImages = useRef(
    new Map<string, ImageUploadComplete>()
  ).current;
  const hasSubmitForm = useRef(false);
  const imageRef = useRef<{ [blobImgId: string]: string }>({});
  const navigateAbortCtrl = useRef(new AbortController()).current;
  const imageAbortStore = useRef(new Map<string, AbortController>()).current;
  const createPlace = useCreatePlace();
  const { basePath, beforeNowPath } = useOutletContext<AccountOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteImageMutation = useImageDelete();
  const componentIsUmount = useRef(false);
  const [
    stageImages,
    {
      fromServerFetch,
      getStageState,
      fromExternalServerFetch,
      fromFileLoad,
      stillActive,
      removeStage,
    },
  ] = useImageStage();

  const getUnclaimedImage = (
    photos: Array<ImageUploadComplete['serverImgInfo']>,
    notSubmitted = false
  ) =>
    getStageImageServerInfo(Array.from(directUntagImages.values())).filter(
      ({ id }) =>
        notSubmitted || !photos.find(({ id: imageId }) => imageId === id)
    );

  const createRegisterAborter = useCallback(
    function createRegisterAborter(id: string) {
      const controller = new AbortController();
      establishParentChildAbort(navigateAbortCtrl, controller);
      const childAbort = controller.abort.bind(controller);

      imageAbortStore.set(id, controller);

      controller.abort = () => {
        const currentStage = getStageState(id);
        if (currentStage) {
          removeStage(id);
          if (getStagedImageProcessStatus(currentStage)) childAbort();
        }
      };

      return controller;
    },
    [navigateAbortCtrl, stageImages]
  );

  async function uploadFetchedImage() {
    const imageLink = getValues().photo;
    if (!imageLink) return;

    const imageFilenameFromUrl = inferImagename(imageLink);
    const [{ process: stageInitiator }, unsubscribe] = fromExternalServerFetch({
      filename: imageFilenameFromUrl,
      onStageChange: unwrapStatusObserverPayload((__, payload) => {
        if (payload.type === 'uploaded' && payload.status === 'complete') {
          directUntagImages.set(payload.id, payload);
          imageAbortStore.delete(payload.id);
          unsubscribe();
        }
      }),
    });

    const fetchStage = stageInitiator({ href: imageLink });
    const stageImageId = getItemId(fetchStage.current());
    await sleep(500);
    const imageAbortCtrl = createRegisterAborter(stageImageId);
    const validFetchResponse = await fetch(imageLink, {
      signal: imageAbortCtrl.signal,
    });

    if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) return;

    if (validFetchResponse.ok && !imageAbortCtrl.signal.aborted) {
      const namedImageFile = new File(
        [await validFetchResponse.blob()],
        imageFilenameFromUrl,
        {
          type: `image/${inferUrlFileExt(imageFilenameFromUrl)}`,
        }
      );

      const completeFetchStage = fetchStage.transit.complete({
        data: namedImageFile,
      });

      await sleep(1500);

      if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId))
        return;

      const formData = new FormData();
      formData.set('image', namedImageFile);
      const uploadStage = completeFetchStage
        .migrate()
        .process({ data: completeFetchStage.current().data });

      const uploadRes = await fetchFn((baseUrl) =>
        fetch(`${baseUrl}/upload`, {
          method: 'POST',
          body: formData,
          signal: imageAbortCtrl.signal,
        })
      )();

      await sleep(1000);
      if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId))
        return;

      if (uploadRes.ok && !imageAbortCtrl.signal.aborted) {
        const data = await uploadRes.json();
        if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) {
          return;
        }
        uploadStage.transit.complete({
          serverImgInfo: data,
        });

        resetField('photo');
      } else {
        uploadStage.transit.failed();
      }
    } else {
      fetchStage.transit.failed();
    }
  }

  async function uploadFileByImage({
    target,
  }: React.ChangeEvent<HTMLInputElement>) {
    const [file] = target.files ?? [];
    if (!file) return;

    const [{ process: stageInitiator }, unsubscribe] = fromFileLoad({
      filename: file.name,
      onStageChange: unwrapStatusObserverPayload((__, payload) => {
        if (payload.type === 'uploaded' && payload.status === 'complete') {
          directUntagImages.set(payload.id, payload);
          imageAbortStore.delete(payload.id);
          unsubscribe();
        }
      }),
    });
    const loadCompleteStage = stageInitiator().transit.complete({ data: file });
    const stageImageId = loadCompleteStage.current().id;

    const formData = new FormData();
    formData.set('image', file);
    await sleep(1500);
    if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) {
      return;
    }

    const uploadStage = loadCompleteStage
      .migrate()
      .process({ data: loadCompleteStage.current().data });

    const imageAbort = createRegisterAborter(stageImageId);
    const uploadResponse = (await uploadImage(
      formData,
      imageAbort.signal
    )) as Response & AxiosResponse;

    await sleep(1500);
    if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) {
      return;
    }

    if (
      !imageAbort.signal.aborted &&
      (uploadResponse.ok || uploadResponse.data)
    ) {
      const data = uploadResponse.data ?? (await uploadResponse.json());
      if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) {
        return;
      }
      uploadStage.transit.complete({ serverImgInfo: data });
    } else {
      uploadStage.transit.failed();
    }
  }

  const resolveImageLink = (stage: RenderImage, id: string) => {
    if (
      (stage.type === 'fetching' &&
        stage.status == 'complete' &&
        !('imageServer' in stage)) ||
      (stage.type === 'loaded' && stage.status === 'complete') ||
      stage.type === 'uploaded'
    ) {
      const url = URL.createObjectURL(stage.data);
      if (imageRef.current[id]) {
        URL.revokeObjectURL(imageRef.current[id]);
      }
      imageRef.current[id] = url;
      return url;
    } else if (stage.type === 'fetching' && 'imageServer' in stage) {
      return stage.imageServer.imgUrlPath;
    }

    return undefined;
  };

  useEffect(() => {
    if (data !== NO_EDIT_MODE) {
      photos.forEach(async (serverImage) => {
        const [{ process: stageInitiator }] = fromServerFetch({});
        const serverInitStage = stageInitiator({ imageServer: serverImage });
        const stageImageId = serverInitStage.current().id;

        await sleep(1500);

        if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) {
          return;
        }

        const imageAbort = createRegisterAborter(stageImageId);
        const validFetchResponse = await fetch(serverImage.imgUrlPath, {
          signal: imageAbort.signal,
        });

        if (navigateAbortCtrl.signal.aborted || !stillActive(stageImageId)) {
          return;
        }

        if (validFetchResponse.ok) {
          serverInitStage.transit.complete();
        } else {
          serverInitStage.transit.failed();
        }
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      componentIsUmount.current = true;
    };
  }, []);

  useEffect(() => {
    const abruptNavigateHandler = () => {
      if (
        !hasSubmitForm.current &&
        directUntagImages.size &&
        clientQualifyToSendStageImage(stageImages)
      ) {
        const finalizeStagedImages = getStageImageServerInfo(stageImages);
        const [_, ...uploadImageInfo] = getUnclaimedImage(
          finalizeStagedImages,
          true
        );
        const blob = new Blob([JSON.stringify(uploadImageInfo)], {
          type: 'application/json',
        });
        window.navigator.sendBeacon(`${BASE_URL}/image/untag`, blob);
      }
    };

    window.addEventListener('unload', abruptNavigateHandler, {
      once: true,
    });

    return () => {
      if (componentIsUmount.current) {
        Object.values(imageRef.current).forEach((imgBlobUrl) => {
          URL.revokeObjectURL(imgBlobUrl);
        });

        imageRef.current = {};
        abruptNavigateHandler();
        navigateAbortCtrl.abort(); //remove all / stop any ongoing fetching or uploading
      }
    };
  }, [stageImages, componentIsUmount.current]);

  return (
    <div className="accomodation">
      <form
        className="accomodation-form"
        onSubmit={handleSubmit(async () => {
          const hasUserChoseImage = !!stageImages.length;
          if (!hasUserChoseImage) {
            alert('please ensure to select an Image for the place');
            return;
          }

          if (!clientQualifyToSendStageImage(stageImages)) {
            //warn user about trying to submit the form
            //before completing image upload
          } else {
            const { photo: _, ...data } = getValues();
            const photos = getStageImageServerInfo(stageImages);
            const unclaimRemoveImage = getUnclaimedImage(photos);
            const formData = {
              id: _id ?? id,
              ...data,
              photos,
              photoTag: placePhotoTag ?? photos[0].id,
            } as ClientAccomodationFormData;

            if (unclaimRemoveImage.length) {
              await deleteImageMutation.mutateAsync(unclaimRemoveImage, {
                onSuccess: () => directUntagImages.clear(),
              });
            }
            const response = await createPlace.mutateAsync(formData);

            if (response.ok) {
              const placeQueryData = await queryClient.getQueryData<
                ServerAccomodationData[]
              >(['post']);

              if (placeQueryData) {
                await queryClient.cancelQueries(['places']);
                await queryClient.setQueriesData(
                  ['post'],
                  [await response.json(), ...placeQueryData]
                );
              } else {
                await queryClient.invalidateQueries(['places']);
              }
              hasSubmitForm.current = true;
              return navigate(`/${basePath}/${beforeNowPath}`);
            } else {
              //report an issue submitting the form
            }
          }
        })}
      >
        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Title</label>
          <p>
            Title for your place. should be short and catchy as in advertised
          </p>
          <input
            type="text"
            placeholder="title, for example: My love"
            {...register('title', { required: true })}
          />
        </div>
        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Address</label>
          <p>Address to your place</p>
          <input
            type="text"
            placeholder="address"
            {...register('address', { required: true })}
          />
        </div>

        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Photos</label>
          <p>more = better</p>

          <div className="image-link-upload">
            <input
              type="text"
              placeholder="Add using a link...jpg"
              {...register('photo')}
            />
            <button type="button" onClick={uploadFetchedImage}>
              Add button
            </button>
          </div>
          <div className="image-file-upload">
            <input
              id="upload-file"
              type="file"
              placeholder="upload an image"
              hidden
              onChange={uploadFileByImage}
            />
            <div className="image-box">
              {stageImages.map((staged) => (
                <DisplayImagePreview
                  staged={staged}
                  resolveImageLink={resolveImageLink}
                  setAsPlacePhotoTag={(id) => {
                    const stagedImage = getStageState(id);
                    if (stagedImage && getstagedImageReadyStatus(stagedImage)) {
                      const stagedImagePhotoId = getItemId(
                        stagedImage.type === 'fetching'
                          ? stagedImage.imageServer
                          : stagedImage.serverImgInfo
                      );

                      setPlacePhotoTag(stagedImagePhotoId);
                    }
                  }}
                  removePhoto={(id) => {
                    const stageImage = getStageState(id);
                    if (stageImage) {
                      imageAbortStore.get(id)?.abort();

                      if (stageImage.id === placePhotoTag) {
                        setPlacePhotoTag(null);
                      }
                    }
                  }}
                  key={staged.id}
                />
              ))}
              <button type="button">
                <label htmlFor="upload-file">Upload</label>
              </button>
            </div>
          </div>
        </div>

        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Description</label>
          <p>description of the place</p>
          <textarea rows={7} {...register('description', { required: true })} />
        </div>

        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Perks</label>
          <p>select all perks of your places</p>
          <div className="features">
            <div>
              <label htmlFor="wifi">
                <span>
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                    />
                  </svg>
                </span>
                <span>Wifi</span>
              </label>
              <input
                type="checkbox"
                id="wifi"
                {...register('perks')}
                value="wifi"
              />
            </div>
            <div>
              <label htmlFor="park">
                <span>
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
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                </span>
                <span>Free Parking spot</span>
              </label>
              <input
                type="checkbox"
                id="pack"
                {...register('perks')}
                value="free park spot"
              />
            </div>
            <div>
              <label htmlFor="tv">
                <span>
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
                      d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </span>
                <span>TV</span>
              </label>
              <input
                type="checkbox"
                id="tv"
                {...register('perks')}
                value="tv"
              />
            </div>
            <div>
              <label htmlFor="radio">
                <span>
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
                      d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75zm-1.683 6.443l-.005.005-.006-.005.006-.005.005.005zm-.005 2.127l-.005-.006.005-.005.005.005-.005.005zm-2.116-.006l-.005.006-.006-.006.005-.005.006.005zm-.005-2.116l-.006-.005.006-.005.005.005-.005.005zM9.255 10.5v.008h-.008V10.5h.008zm3.249 1.88l-.007.004-.003-.007.006-.003.004.006zm-1.38 5.126l-.003-.006.006-.004.004.007-.006.003zm.007-6.501l-.003.006-.007-.003.004-.007.006.004zm1.37 5.129l-.007-.004.004-.006.006.003-.004.007zm.504-1.877h-.008v-.007h.008v.007zM9.255 18v.008h-.008V18h.008zm-3.246-1.87l-.007.004L6 16.127l.006-.003.004.006zm1.366-5.119l-.004-.006.006-.004.004.007-.006.003zM7.38 17.5l-.003.006-.007-.003.004-.007.006.004zm-1.376-5.116L6 12.38l.003-.007.007.004-.004.007zm-.5 1.873h-.008v-.007h.008v.007zM17.25 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 4.5a.75.75 0 110-1.5.75.75 0 010 1.5z"
                    />
                  </svg>
                </span>
                <span>Radio</span>
              </label>
              <input
                type="checkbox"
                id="radio"
                {...register('perks')}
                value="radio"
              />
            </div>
            <div>
              <label htmlFor="pet">
                <span>
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
                      d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                    />
                  </svg>
                </span>
                <span>Pets</span>
              </label>
              <input
                type="checkbox"
                id="pet"
                {...register('perks')}
                value="pet"
              />
            </div>
            <div>
              <label htmlFor="entrance">
                <span>
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
                      d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
                    />
                  </svg>
                </span>
                <span>Private Entrance</span>
              </label>
              <input
                type="checkbox"
                id="entrance"
                {...register('perks')}
                value="entrance"
              />
            </div>
          </div>
        </div>
        <div className="accomodation-input__wrapper extra-info__wrapper">
          <label className="accomodation__input-label">Extra Info</label>
          <p>house rule, etc</p>
          <textarea rows={7} {...register('extraInfo', { required: true })} />
        </div>

        <div className="accomodation-input__wrapper check-in-out-wrapper">
          <fieldset>
            <legend>Check in & out </legend>
            <p>
              add check in and out, remember to have some time window for
              cleaning the room between quests.
            </p>
            <div className="check-in-out-input-box">
              <div>
                <label>Check in time</label>
                <input type="number" {...register('checkout')} />
              </div>
              <div>
                <label>Check out time</label>
                <input type="number" {...register('checkin')} />
              </div>
              <div>
                <label>Max No of guests</label>
                <input type="number" {...register('maxGuests')} />
              </div>
              <div>
                <label>Price</label>
                <input type="number" {...register('price')} />
              </div>
            </div>
          </fieldset>
        </div>
        <div>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
};

export { AccomodationForm };
export type {
  AccomodationFormData,
  ClientAccomodationFormData,
  ServerAccomodationData,
};
