import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createDropio, type UploadMetadataRequest } from './lib/dropio/server';

const app = express();
const port = 5010;

const dio = createDropio();

const ourFileRouter = {
  fileUploader: dio({
    image: {
      maxFileCount: 1,
      maxFileSize: '10MB',
    },
  }),
};

app.use(cors());
app.use(express.json());

app.post('/api/dropio', (req: express.Request, res: express.Response) => {
  const metadata = req.body as UploadMetadataRequest;

  // Define your auth here
  const yourAuth = 'fakeId';
  metadata.customeId = yourAuth;

  const result = ourFileRouter.fileUploader(metadata, {
    expire: '1h', // 1 Hour
  });
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
