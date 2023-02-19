import { useForm } from 'react-hook-form';
import { ActionFunctionArgs, useSubmit } from 'react-router-dom';
import './style.css';
import { useState } from 'react';
import { sleep } from '../../util';
import { fetchFn } from '../../store/api/baseUrl';

interface RenderImageBase {
  id: string;
  type: string;
  filename?: string;
  status?: 'process' | 'failed' | 'complete';
}

interface FetchImageBase extends RenderImageBase {
  type: 'fetching';
  href: string;
  status: 'process' | 'failed' | 'complete';
}

interface FetchImageProgress extends FetchImageBase {
  status: 'process';
}

interface FetchImageFail extends FetchImageBase {
  status: 'failed';
}

interface FetchImageComplete extends FetchImageBase {
  status: 'complete';
  data: File | Blob;
}

type FetchImage = FetchImageProgress | FetchImageFail | FetchImageComplete;

interface LoadedImage extends RenderImageBase {
  type: 'loaded';
  data: File | Blob;
  filename: string;
}

interface UploadImageBase extends RenderImageBase {
  type: 'uploaded';
  filename: string;
}

interface ImageUploadProgress extends UploadImageBase {
  data: Blob | File;
  status: 'process';
}

interface ImageUploadFail extends UploadImageBase {
  data: Blob | File;
  status: 'failed';
}

interface ImageUploadComplete extends UploadImageBase {
  url: string;
  status: 'complete';
}

type UploadedImage =
  | ImageUploadProgress
  | ImageUploadFail
  | ImageUploadComplete;

type RenderImage = FetchImage | LoadedImage | UploadedImage;

const genNaiveRandomId = () => Math.random().toString(32).slice(2);

const createLoadedImage = (file: File, id?: string): LoadedImage => ({
  id: id ?? genNaiveRandomId(),
  type: 'loaded',
  filename: file.name,
  data: file,
});

const createFetchImage = (href: string): FetchImage => ({
  id: genNaiveRandomId(),
  type: 'fetching',
  status: 'process',
  href,
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

const resolveImageLink = (
  image: UploadedImage | LoadedImage | FetchImageComplete
) =>
  image.type === 'fetching' ||
  image.type === 'loaded' ||
  (image.type === 'uploaded' &&
    (image.status === 'process' || image.status === 'failed'))
    ? URL.createObjectURL(image.data)
    : image.url;

const canRenderImagePreview = (
  image: RenderImage
): image is LoadedImage | FetchImageComplete | UploadedImage =>
  image.type === 'loaded' ||
  (image.type === 'fetching' && image.status === 'complete') ||
  image.type === 'uploaded';

const progressFetchImageComplete = (
  stage: FetchImageProgress,
  data: FetchImageComplete['data']
): FetchImageComplete => ({ ...stage, status: 'complete', data });

const progressFetchImageFailed = (
  stage: FetchImageProgress
): FetchImageFail => ({ ...stage, status: 'failed' });

const progressImageUploadComplete = (
  stage: ImageUploadProgress,
  url: string
): ImageUploadComplete => ({
  id: stage.id,
  type: stage.type,
  status: 'complete',
  filename: stage.filename,
  url,
});

const progressImageUploadFailed = (
  stage: ImageUploadProgress
): ImageUploadFail => ({ ...stage, status: 'failed' });

const imageEligibleForSubmit = (images: Array<RenderImage>) =>
  images.every(({ type }) => type === 'uploaded');

interface AccomodationFormData {
  title: string;
  address: string;
  imageLink: string;
  perks: string;
}

const AccomodationForm = () => {
  const { register, handleSubmit, getValues } = useForm<AccomodationFormData>(
    {}
  );
  const submitForm = useSubmit();
  const [images, setImages] = useState<Array<RenderImage>>([]);

  return (
    <div className="accomodation">
      <form
        className="accomodation-form"
        onSubmit={handleSubmit(() => {
          const imageStatus = imageEligibleForSubmit(images);
          if (imageStatus) {
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
            {...register('title')}
          />
        </div>
        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Address</label>
          <p>Address to your place</p>
          <input type="text" placeholder="address" {...register('address')} />
        </div>

        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Photos</label>
          <p>more = better</p>

          <div className="image-link-upload">
            <input
              type="text"
              placeholder="Add using a link...jpg"
              {...register('imageLink')}
            />
            <button
              onClick={async () => {
                const imageLink = getValues().imageLink;
                if (!imageLink) return;
                const fetchImage = createFetchImage(imageLink);
                setImages((prev) => [...prev, fetchImage]);
                await sleep(500);
                const validFetchResponse = await fetch(imageLink);
                const imageBlob = await validFetchResponse.blob();
                if (validFetchResponse.ok) {
                  setImages((prev) =>
                    prev.map((render) =>
                      render.id === fetchImage.id
                        ? progressFetchImageComplete(
                            render as FetchImageProgress,
                            imageBlob
                          )
                        : render
                    )
                  );

                  await sleep(1500);
                  const formData = new FormData();
                  formData.set('image', imageBlob);
                  const imageFilenameFromUrl = imageLink.split('/').pop()!;
                  setImages((prev) =>
                    prev.map((render) =>
                      render.id === fetchImage.id
                        ? createUploadImage(
                            (render as FetchImageComplete).id,
                            new File(
                              [(render as FetchImageComplete).data],
                              imageFilenameFromUrl,
                              {
                                type: validFetchResponse.headers.get(
                                  'content-type'
                                )!,
                              }
                            ),
                            imageFilenameFromUrl
                          )
                        : render
                    )
                  );

                  const uploadRes = await fetchFn((baseUrl) =>
                    fetch(`${baseUrl}/upload`, {
                      method: 'POST',
                      body: formData,
                    })
                  )();

                  await sleep(500);
                  if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    setImages((prev) =>
                      prev.map((render) =>
                        render.id === fetchImage.id &&
                        render.type === 'uploaded'
                          ? progressImageUploadComplete(
                              render as ImageUploadProgress,
                              data.path
                            )
                          : render
                      )
                    );
                  } else {
                    setImages((prev) =>
                      prev.map((render) =>
                        render.id === fetchImage.id &&
                        render.type === 'uploaded'
                          ? progressImageUploadFailed(
                              render as ImageUploadProgress
                            )
                          : render
                      )
                    );
                  }
                } else {
                  setImages((prev) =>
                    prev.map((render) =>
                      render.id === fetchImage.id
                        ? progressFetchImageFailed(render as FetchImageProgress)
                        : render
                    )
                  );
                }
              }}
            >
              Add button
            </button>
          </div>
          <div className="image-file-upload">
            <input
              id="upload-file"
              type="file"
              placeholder="upload an image"
              hidden
              onChange={async ({ target }) => {
                const [file] = target.files ?? [];
                if (!file) return;

                const loadedImage = createLoadedImage(file);
                setImages((prev) => [...prev, loadedImage]);
                const formData = new FormData();
                formData.set('image', file);

                await sleep(1500);
                setImages((prev) =>
                  prev.map((render) =>
                    render === loadedImage
                      ? createUploadImage(loadedImage.id, file, file.name)
                      : render
                  )
                );

                const uploadResponse = await fetchFn((baseUrl) =>
                  fetch(`${baseUrl}/upload`, {
                    method: 'POST',
                    body: formData,
                  })
                )();

                await sleep(500);
                if (uploadResponse.ok) {
                  const data = await uploadResponse.json();
                  setImages((prev) =>
                    prev.map((render) =>
                      render.id === loadedImage.id
                        ? progressImageUploadComplete(
                            render as ImageUploadProgress,
                            data.path
                          )
                        : render
                    )
                  );
                } else {
                  setImages((prev) =>
                    prev.map((render) =>
                      render.id === loadedImage.id
                        ? progressImageUploadFailed(
                            render as ImageUploadProgress
                          )
                        : render
                    )
                  );
                }
              }}
            />
            <div className="image-box">
              {images.map((render) => (
                <div key={render.id} className="preview-image">
                  {canRenderImagePreview(render) ? (
                    <img src={resolveImageLink(render)} alt={render.filename} />
                  ) : null}
                </div>
              ))}
              <button>
                <label htmlFor="upload-file">Upload</label>
              </button>
            </div>
          </div>
        </div>

        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Description</label>
          <p>description of the place</p>
          <textarea rows={7} />
        </div>

        <div className="accomodation-input__wrapper">
          <label className="accomodation__input-label">Pecks</label>
          <p>select all pecks of your places</p>
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
          <textarea rows={7} />
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
                <input type="text" placeholder="14:00" />
              </div>
              <div>
                <label>Check out time</label>
                <input type="text" />
              </div>
              <div>
                <label>Max No of guests</label>
                <input type="number" />
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

async function createAccomodationAction({}: ActionFunctionArgs) {}

export { AccomodationForm, createAccomodationAction };
