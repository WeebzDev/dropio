import { createUploader } from "../libs/dropio/client";

const dio = createUploader();

export const { DioUploader } = {
  DioUploader: dio({
    customServerUrl: 'http://localhost:5010/api/dropio',
  }),
};
