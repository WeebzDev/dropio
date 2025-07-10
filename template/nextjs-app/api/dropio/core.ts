import { createDropio } from '@/lib/dropio/server';

const dio = createDropio();

export const ourFileRouter = {
  fileUploader: dio({
    image: {
      maxFileCount: 1,
      maxFileSize: '10MB',
    },
  }),
};
