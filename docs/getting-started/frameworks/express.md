---
sidebar_position: 2
title: Express
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting started with Express

### Set A Template Code

<Tabs groupId="expressGroup">
  <TabItem value='typescript' label='Typescript' default>
  <details>
    <summary>Click to expand code</summary>

```ts title="lib/dropio/server.ts"
import { randomBytes, createHash, createHmac } from 'crypto';

export type AllowedMimeTypes =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  | 'image/bmp'
  | 'image/tiff'
  | 'image/x-icon'
  | 'image/vnd.microsoft.icon'
  | 'image/heif'
  | 'image/heic'
  | 'image/avif'
  | 'image'
  | 'video/mp4'
  | 'video/webm'
  | 'video/ogg'
  | 'video/quicktime'
  | 'video'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/ogg'
  | 'audio/webm'
  | 'audio'
  | 'application/pdf'
  | 'text/plain'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'application/msword'
  | 'application/vnd.ms-excel'
  | 'application/vnd.ms-powerpoint';

export type OneToTen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB';
export type FileSize = `${OneToTen}${SizeUnit}`;

export type ExpireInterval = 1 | 5 | 10 | 15 | 20 | 25 | 30 | 60;
export type TimeType = 'm' | 'h';
export type ExpireTime = `${ExpireInterval}${TimeType}`;

export type FileValidationOptions = Partial<
  Record<
    AllowedMimeTypes | (string & {}),
    {
      maxFileSize?: FileSize | number;
      maxFileCount?: number;
    }
  >
>;

export type UploadMetadataRequest = {
  fileName: string;
  fileSize: number;
  fileType: string;
  customeId: string;
};

export type generatePresignURLOptions = {
  expire?: ExpireTime;
  ContentDiposition?: string;
  route?: string;
};

export type generatePresignURLResponse = {
  presignUrl: string;
  key: string;
};

export type ServerApiResponse<T> = {
  status: 'success' | 'error';
  code: number;
  data: T | null;
  message: string | null;
  errors?: { field: string | number; message: string }[] | null;
};

export type responseDIOApi<T = undefined> = {
  success?: string | null;
  error?: string | null;
  data?: T | null;
  message?: string | null;
};

export type UploadMetadataResponse =
  | { isError: false; presignedUrl: string; key: string }
  | { isError: true; message: string };

export type BucketDetailsType = {
  appId: string;
  name: string;
  quota: number;
  quotaUsage: number;
};

function parseSize(size: string | number): number {
  if (typeof size === 'number') return size;

  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
  };

  const match = /^(\d+(?:\.\d+)?)([KMG]?B)$/i.exec(size);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const num = match[1];
  const unit = match[2].toUpperCase();

  const multiplier = units[unit];
  if (!multiplier) {
    throw new Error(`Invalid size unit: ${unit}`);
  }

  return Math.floor(parseFloat(num) * multiplier);
}

function parseTime(time: ExpireTime): number {
  const match = /^(\d{1,3})([mh])$/i.exec(time);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const num = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();

  const units: Record<TimeType, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
  };

  const multiplier = units[unit as TimeType];
  if (!multiplier) {
    throw new Error(`Invalid time unit: ${unit}`);
  }

  return num * multiplier;
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

function validateUploadMetadataRequest(query: Partial<UploadMetadataRequest>): {
  error: boolean;
  message?: string;
} {
  const required: (keyof UploadMetadataRequest)[] = ['fileName', 'fileSize', 'fileType', 'customeId'];
  const missing = required.filter((k) => !query[k]);
  if (missing.length) {
    return { error: true, message: `Missing fields: ${missing.join(', ')}` };
  }
  return { error: false };
}

function generatePresignURL(
  data: UploadMetadataRequest,
  options: generatePresignURLOptions
): generatePresignURLResponse {
  const { ContentDiposition, expire, route } = options;
  const { fileName, fileSize, fileType, customeId } = data;

  const baseUrl = createHash('sha256').update(randomBytes(18).toString('hex')).digest('hex').toUpperCase().slice(0, 24);

  let expireTime = 1 * 60 * 60 * 1000;

  if (expire) {
    expireTime = parseTime(expire);
  }

  const expireValue = Date.now() + expireTime;

  const params = new URLSearchParams({
    expire: expireValue.toString(),
    customeId: customeId,
    xDioIdentifier: process.env.DROPIO_APP_ID!,
    xDioFileName: fileName,
    xDioFileSize: fileSize.toString(),
    xDioFileType: fileType,
    xDioRoute: route ?? 'fileUploader',
    xDioContentDipositioning: ContentDiposition ?? 'inline',
  });

  const urlToSign = `${baseUrl}?${params.toString()}`;
  const hmac = createHmac('sha256', process.env.DROPIO_TOKEN!);
  hmac.update(urlToSign);
  const signature = `hmac-sha256=${hmac.digest('hex')}`;

  params.append('signature', signature);

  return {
    key: signature,
    presignUrl: `${process.env.DROPIO_INGEST_SERVER}/u/${baseUrl}?${params.toString()}`,
  };
}

export function createDropio() {
  return function defineUploader(config: FileValidationOptions) {
    return function handleUpload(
      data: UploadMetadataRequest,
      options: generatePresignURLOptions
    ): UploadMetadataResponse {
      const dataFileType = data.fileType.split('/')[0] ?? '';
      const fileConfig = config[data.fileType] ?? config[dataFileType];

      if (!fileConfig) {
        return { isError: true, message: 'Unsupported file type.' };
      }

      const { error, message } = validateUploadMetadataRequest(data);
      if (error) return { isError: true, message: message! };

      const maxSize = parseSize(fileConfig.maxFileSize ?? '10MB');
      if (data.fileSize > maxSize) {
        return {
          isError: true,
          message: `File size exceeds ${formatBytes(maxSize)}.`,
        };
      }

      const presigned = generatePresignURL(data, options);
      return {
        isError: false,
        key: presigned.key,
        presignedUrl: presigned.presignUrl,
      };
    };
  };
}

export class DIOApi {
  async delete(fileKeys: string[]): Promise<responseDIOApi<null>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${process.env.DROPIO_INGEST_SERVER}/d/${process.env.DROPIO_APP_ID!}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DROPIO_TOKEN!}`,
        },
        body: JSON.stringify({ fileKeys: fileKeys }),
        signal: controller.signal,
      });

      let response: ServerApiResponse<null> | null = null;

      try {
        response = (await res.json()) as ServerApiResponse<null>;
      } catch (jsonError) {
        console.error('Failed to parse JSON from delete dioapi:', jsonError);
        return { error: 'Failed to parse JSON from delete dioapi' };
      }

      if (response?.code !== 200) {
        console.log('INGEST_SERVER_ERORR:', response.errors);
        return { error: response?.message };
      }

      return { success: response?.message };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { error: 'Error During deleting File' };
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async bucketDetails(): Promise<responseDIOApi<BucketDetailsType>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${process.env.DROPIO_INGEST_SERVER}/bucket/${process.env.DROPIO_APP_ID!}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DROPIO_TOKEN!}`,
        },
        signal: controller.signal,
      });

      let response: ServerApiResponse<BucketDetailsType> | null = null;

      try {
        response = (await res.json()) as ServerApiResponse<BucketDetailsType>;
      } catch (jsonError) {
        console.error('Failed to parse JSON from get bucket details dioapi:', jsonError);
        return { error: 'Failed to parse JSON from get bucket details' };
      }

      if (response?.code !== 200) {
        console.log('INGEST_SERVER_ERORR:', response.errors);
        return { error: response?.message };
      }

      return { data: response?.data };
    } catch (error) {
      console.error('Error get bucket details:', error);
      return { error: 'Error During get bucket details' };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}


```

  </details>
  </TabItem>

  <TabItem value='javascript' label='Javascript'>
  <details>
    <summary>Click to expand code</summary>

```js title="lib/dropio/server.js"
const { randomBytes, createHash, createHmac } = require('crypto');

function parseSize(size) {
  if (typeof size === 'number') return size;

  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
  };

  const match = /^(\d+(?:\.\d+)?)([KMG]?B)$/i.exec(size);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const num = match[1];
  const unit = match[2].toUpperCase();

  const multiplier = units[unit];
  if (!multiplier) {
    throw new Error(`Invalid size unit: ${unit}`);
  }

  return Math.floor(parseFloat(num) * multiplier);
}

function parseTime(time) {
  const match = /^(\d{1,3})([mh])$/i.exec(time);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const units = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
  };

  const multiplier = units[unit];
  if (!multiplier) {
    throw new Error(`Invalid time unit: ${unit}`);
  }

  return num * multiplier;
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

function validateUploadMetadataRequest(query) {
  const required = ['fileName', 'fileSize', 'fileType', 'customeId'];
  const missing = required.filter((k) => !query[k]);
  if (missing.length) {
    return { error: true, message: `Missing fields: ${missing.join(', ')}` };
  }
  return { error: false };
}

function generatePresignURL(data, options) {
  const { ContentDiposition, expire, route } = options;
  const { fileName, fileSize, fileType, customeId } = data;

  const baseUrl = createHash('sha256').update(randomBytes(18).toString('hex')).digest('hex').toUpperCase().slice(0, 24);

  let expireTime = 1 * 60 * 60 * 1000;

  if (expire) {
    expireTime = parseTime(expire);
  }

  const expireValue = Date.now() + expireTime;

  const params = new URLSearchParams({
    expire: expireValue.toString(),
    customeId: customeId,
    xDioIdentifier: process.env.DROPIO_APP_ID,
    xDioFileName: fileName,
    xDioFileSize: fileSize.toString(),
    xDioFileType: fileType,
    xDioRoute: route ?? 'fileUploader',
    xDioContentDipositioning: ContentDiposition ?? 'inline',
  });

  const urlToSign = `${baseUrl}?${params.toString()}`;
  const hmac = createHmac('sha256', process.env.DROPIO_TOKEN);
  hmac.update(urlToSign);
  const signature = `hmac-sha256=${hmac.digest('hex')}`;

  params.append('signature', signature);

  return {
    key: signature,
    presignUrl: `${process.env.DROPIO_INGEST_SERVER}/u/${baseUrl}?${params.toString()}`,
  };
}

function createDropio() {
  return function defineUploader(config) {
    return function handleUpload(data, options) {
      const dataFileType = data.fileType.split('/')[0] ?? '';
      const fileConfig = config[data.fileType] ?? config[dataFileType];

      if (!fileConfig) {
        return { isError: true, message: 'Unsupported file type.' };
      }

      const { error, message } = validateUploadMetadataRequest(data);
      if (error) return { isError: true, message: message };

      const maxSize = parseSize(fileConfig.maxFileSize ?? '10MB');
      if (data.fileSize > maxSize) {
        return {
          isError: true,
          message: `File size exceeds ${formatBytes(maxSize)}.`,
        };
      }

      const presigned = generatePresignURL(data, options);
      return {
        isError: false,
        key: presigned.key,
        presignedUrl: presigned.presignUrl,
      };
    };
  };
}

class DIOApi {
  async delete(fileKeys) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${process.env.DROPIO_INGEST_SERVER}/d/${process.env.DROPIO_APP_ID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DROPIO_TOKEN}`,
        },
        body: JSON.stringify({ fileKeys: fileKeys }),
        signal: controller.signal,
      });

      let response = null;

      try {
        response = await res.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON from delete dioapi:', jsonError);
        return { error: 'Failed to parse JSON from delete dioapi' };
      }

      if (response?.code !== 200) {
        console.log('INGEST_SERVER_ERORR:', response.errors);
        return { error: response?.message };
      }

      return { success: response?.message };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { error: 'Error During deleting File' };
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async bucketDetails() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${process.env.DROPIO_INGEST_SERVER}/bucket/${process.env.DROPIO_APP_ID}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DROPIO_TOKEN}`,
        },
        signal: controller.signal,
      });

      let response = null;

      try {
        response = await res.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON from get bucket details dioapi:', jsonError);
        return { error: 'Failed to parse JSON from get bucket details' };
      }

      if (response?.code !== 200) {
        console.log('INGEST_SERVER_ERORR:', response.errors);
        return { error: response?.message };
      }

      return { data: response?.data };
    } catch (error) {
      console.error('Error get bucket details:', error);
      return { error: 'Error During get bucket details' };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

exports.createDropio = createDropio;
exports.DIOApi = DIOApi;


```

  </details>
  </TabItem>
</Tabs>

:::warning[**Note on Supported File Types**]
> The list of supported MIME types is not yet exhaustive. [Check here](https://docs.google.com/document/d/1cEeGUh09POXwmoFOK8894p1f1Z6_cLtkgIx7bsJFOhk) to see which file types are currently supported.  
>  
> If you require support for a specific file type, you may submit a request via Discord.  
>  
> Attempting to upload an unsupported file type will result in an error response similar to the following:


```ts
  error: true,
  message: "Invalid file type.",
  code: 400,
```
:::

:::warning[**Note on Supported Upload File Count**]
> Additionally, only one file can be uploaded at a time.
Support for multiple file uploads is planned in future updates.
:::

### Add env variables

> If you haven’t generated your Dropio secret key yet, simply [sign up](https://www.dropio.my.id/sign-in) and create one directly from the dashboard.

```env title=".env"
DROPIO_TOKEN=
DROPIO_APP_ID=
DROPIO_INGEST_SERVER=
```

### Express Setup

<Tabs groupId="expressGroup">
  <TabItem value='typescript' label='Typescript' default>

```ts title="src/index.ts"
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

```

  </TabItem>
  <TabItem value='javascript' label='Javascript'>
> We recommend using **TypeScript** for a better developer experience and improved type safety.  
However, **JavaScript** is fully supported — feel free to use whichever works best for you.  
Good luck have fun building with JavaScript!

    
```js title="src/index.js"
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

  const result = ourFileRouter.fileUploader(metadata, {
    expire: '1h', // 1 Hour
  });
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


```

  </TabItem>
</Tabs>
