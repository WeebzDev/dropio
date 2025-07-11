import { createUploader } from '@/lib/dropio/client';

const dio = createUploader();

export const { DioUploader } = {
  DioUploader: dio({
    customServerUrl: '/api/dropio',
  }),
};
