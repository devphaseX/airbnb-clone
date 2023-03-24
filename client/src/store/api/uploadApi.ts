import axios, { type AxiosRequestConfig } from 'axios';
import { fetchFn } from './baseUrl';

const uploadImage = (
  data: FormData,
  signal: AbortSignal,
  onUploadProgress?: AxiosRequestConfig['onUploadProgress']
) => {
  return fetchFn((baseUrl) =>
    axios.post(`${baseUrl}/image/`, data, {
      method: 'POST',
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form' },
      onUploadProgress,
      signal,
    })
  )();
};

export { uploadImage };
