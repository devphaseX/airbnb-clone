import { UseMutationOptions, useMutation } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import type { ImageUploadComplete } from '../../component/userPlace/preview';

const useImageDelete = (
  option?: UseMutationOptions<
    any,
    any,
    Array<ImageUploadComplete['serverImgInfo']>
  >
) => {
  const { mutationFn, ...overrideOption } = option ?? {};
  return useMutation({
    ...overrideOption,
    mutationFn: (images) =>
      fetchFn((baseUrl) =>
        fetch(`${baseUrl}/image`, {
          method: 'DELETE',
          body: JSON.stringify(images),
          credentials: 'include',
        })
      )(),
  });
};

export { useImageDelete };
