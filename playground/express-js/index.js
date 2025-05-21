require('dotenv').config();
const express = require('express');
const cors = require('cors');
const diolib = require('./lib/dropio/server');
const app = express();
const port = 5010;

const dio = diolib.createDropio();

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

app.post('/api/dropio', (req, res) => {
  const metadata = req.body;

  // Define your auth here
  const yourAuth = 'fakeId';
  metadata.customeId = yourAuth;

  const result = ourFileRouter.fileUploader(metadata);
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
