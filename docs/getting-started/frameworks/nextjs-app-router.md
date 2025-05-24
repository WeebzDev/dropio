---
sidebar_position: 1
title: Next.js App Router
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting started with Next.js App Router

### Set A Template Code

#### Server Side Code

<details>
  <summary>Click to expand code</summary>

```ts title="lib/dropio/server.ts"
import { randomBytes, createHash, createHmac } from 'crypto';

export type AllowedMimeTypes =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/gif'
  | 'image/svg+xml'
  | 'video/mp4'
  | 'video/webm'
  | 'video/ogg'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'text/plain'
  | 'image'
  | 'video'
  | 'audio';

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
  if (typeof window !== 'undefined') {
    throw new Error('createDropio can only be used in a server environment');
  }

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
  async delete(fileKey: string): Promise<responseDIOApi<null>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${process.env.DROPIO_INGEST_SERVER}/d/${fileKey}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${process.env.DROPIO_TOKEN!}`,
          'xdio-app-id': process.env.DROPIO_APP_ID!,
        },
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
}
```

</details>

:::warning[**Note on Supported File Types**]

> The list of MIME types is not fully supported yet. At the moment, **only image files** are allowed. If you attempt to upload a non-image file, you will receive an error response like the following:

```ts
  error: true,
  message: "Invalid file type. Only image files are allowed.",
  code: 400,
```

:::

:::warning[**Note on Supported Upload File Count**]

> Additionally, only one file can be uploaded at a time. Support for multiple file uploads is planned in future updates.
:::

#### Client Side Code

<details>
  <summary>Click to expand code</summary>

```ts title="lib/dropio/client.ts"
export type UploaderOptions = {
  customServerUrl?: string;
};

export type UploadMetadataRequest = {
  fileName: string;
  fileSize: number;
  fileType: string;
};

export type UploadRequest = {
  file: File;
  onProgress?: (percent: number) => void;
  onStatusChange?: (isPending: boolean) => void;
};

export type ApiResponse<T> = {
  status: 'success' | 'error';
  code: number;
  data: T | null;
  message: string | null;
  errors?: { field: string | number; message: string }[] | null;
};

export type UploadedFileInfo = {
  originalName: string;
  uniqueName: string;
  fileSize: number;
  fileUrl: string;
};

export type UploadResult =
  | { isError: true; message: string }
  | {
      isError: false;
      originalName: string;
      uniqueName: string;
      fileSize: number;
      fileUrl: string;
    };

export type UploadMetadataResponse =
  | { isError: false; presignedUrl: string; key: string }
  | { isError: true; message: string };

export function createUploader() {
  return function configureUploader(options: UploaderOptions) {
    return async function handleFileUpload(request: UploadRequest): Promise<{
      result: UploadResult;
      abort: () => void;
    }> {
      if (typeof window === 'undefined') {
        throw new Error('createUploader can only be used in a browser environment');
      }

      const { file, onProgress, onStatusChange } = request;

      if (typeof onStatusChange === 'function') {
        onStatusChange(true);
      }

      const presignedUrlResult = await getPresignedUrl(file, options.customServerUrl);
      if (presignedUrlResult.isError) {
        return {
          result: { isError: true, message: presignedUrlResult.result },
          abort: () => {},
        };
      }

      const { abort, result: uploadPromise } = uploadFileToIngestServer({
        file,
        presignedUrl: presignedUrlResult.result,
        onProgress,
      });

      const uploadResult = await uploadPromise;

      if (typeof onStatusChange === 'function') {
        onStatusChange(false);
      }

      return { result: uploadResult, abort };
    };
  };
}

async function getPresignedUrl(file: File, serverUrl?: string): Promise<{ isError: boolean; result: string }> {
  const requestPayload: UploadMetadataRequest = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };

  const endpoint = serverUrl ?? '/api/dropio';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  const responseData = (await response.json()) as UploadMetadataResponse;

  if (!response.ok || responseData.isError) {
    return {
      isError: true,
      result: responseData.isError ? responseData.message : 'Unknown error',
    };
  }

  return { isError: false, result: responseData.presignedUrl };
}

function uploadFileToIngestServer({
  file,
  presignedUrl,
  onProgress,
}: {
  file: File;
  presignedUrl: string;
  onProgress?: (percent: number) => void;
}): {
  result: Promise<UploadResult>;
  abort: () => void;
} {
  const xhr = new XMLHttpRequest();

  const result = new Promise<UploadResult>((resolve) => {
    xhr.open('POST', presignedUrl, true);

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const percentUploaded = Math.round((event.loaded / event.total) * 100);
        onProgress(percentUploaded);
      }
    };

    xhr.onload = () => {
      try {
        const parsedResponse = JSON.parse(xhr.responseText) as ApiResponse<UploadedFileInfo>;

        if (xhr.status === 201 && parsedResponse.status === 'success' && parsedResponse.data) {
          resolve({ isError: false, ...parsedResponse.data });
        } else {
          resolve({
            isError: true,
            message: parsedResponse.message ?? 'Upload failed',
          });
        }
      } catch {
        resolve({ isError: true, message: 'Failed to parse server response' });
      }
    };

    xhr.onerror = () => {
      resolve({ isError: true, message: 'Upload failed due to network error' });
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });

  return {
    result,
    abort: () => xhr.abort(),
  };
}
```

</details>

### Add env variables

> If you haven’t generated your Dropio secret key yet, simply [sign up](https://www.dropio.my.id/sign-in) and create one directly from the dashboard.

```env title=".env"
DROPIO_TOKEN=
DROPIO_APP_ID=
DROPIO_INGEST_SERVER=
```

### Set Up A FileRouter

```ts title="app/api/dropio/route.ts"
import { NextResponse } from "next/server";

import {
  createDropio,
  type UploadMetadataRequest,
  type UploadMetadataResponse,
} from "@/lib/dropio/server";

const dio = createDropio();

export const ourFileRouter = {
  fileUploader: dio({
    image: {
      maxFileCount: 1,
      maxFileSize: "10MB",
    },
  }),
};

export async function POST(
  req: Request,
): Promise<NextResponse<UploadMetadataResponse>> {
  const metadata = (await req.json()) as UploadMetadataRequest;

  // Define your auth here
  const yourAuth = "fakeId";
  metadata.customeId = yourAuth;

  const result = ourFileRouter.fileUploader(metadata, {
    expire: "1h", // 1 Hour
  });

  return NextResponse.json(result, {
    status: result.isError ? 400 : 200,
  });
}

```

### Create The Dropio Components

```ts title="utils/dropio.ts"
import { createUploader } from '@/lib/dropio/client';

const dio = createUploader();

export const { DioUploader } = {
  DioUploader: dio({
    customServerUrl: '/api/dropio',
  }),
};
```

### Example

<Tabs>
  <TabItem value='tailwind' label='Tailwind' default>

```tsx title="form.tsx"
'use client';

import { useState } from 'react';

import { DioUploader } from '@/utils/dropio';
import type { UploadResult } from '@/lib/dropio/client';

export function Form() {
  const [loading, setLoading] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(false);
  const [resultData, setResultData] = useState<UploadResult | null>(null);

  async function formAction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const file = formData.get('image');

    if (!(file instanceof File)) {
      console.error('No file selected or invalid file input');
      return;
    }

    const { result } = await DioUploader({
      file,
      onProgress(percent) {
        setLoading(percent);
        console.log(`Uploading: ${percent}%`);
      },
      onStatusChange(isPending) {
        setPending(isPending);
      },
    });

    if (!result.isError) {
      setResultData(result);
    } else {
      setPending(false);
      setLoading(0);
    }
  }

  return (
    <>
      <form onSubmit={formAction} className='mx-auto max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-md'>
        <label className='block'>
          <span className='text-sm font-medium text-gray-700'>Upload Image</span>
          <input
            type='file'
            name='image'
            accept='image/*'
            className='mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
          />
        </label>

        <button
          type='submit'
          disabled={pending}
          className='w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700 disabled:opacity-50'
        >
          Upload
        </button>

        <div className='space-y-1 text-sm text-gray-700'>
          <p>
            <span className='font-medium'>Loading:</span> {loading}
          </p>
          <p>
            <span className='font-medium'>isPending:</span> {pending ? 'true' : 'false'}
          </p>
          <p>
            <span className='font-medium'>Result:</span>{' '}
            {resultData && !resultData.isError ? resultData.originalName : 'no data'}
          </p>
        </div>
      </form>
    </>
  );
}
```

  </TabItem>

  <TabItem value='no-css' label='No Css'>

```tsx title="form.tsx"
'use client';

import { useState } from 'react';

import { DioUploader } from '@/utils/dropio';

export function Form() {
  const [loading, setLoading] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(false);
  const [resultData, setResultData] = useState<UploadResult | null>(null);

  async function formAction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const file = formData.get('image');

    if (!(file instanceof File)) {
      console.error('No file selected or invalid file input');
      return;
    }

    const { result } = await DioUploader({
      file,
      onProgress(percent) {
        setLoading(percent);
        console.log(`Uploading: ${percent}%`);
      },
      onStatusChange(isPending) {
        setPending(isPending);
      },
    });

    if (!result.isError) {
      setResultData(result);
    } else {
      setPending(false);
      setLoading(0);
    }
  }

  return (
    <>
      <form onSubmit={formAction}>
        <input type='file' name='image' accept='image/*' />
        <button type='submit' disabled={pending}>
          Upload
        </button>
        <p>Loading : {loading}</p>
        <p>isPending : {pending ? 'true' : 'false'}</p>
        <p>Result : {resultData && !resultData.isError ? resultData.originalName : 'no data'}</p>
      </form>
    </>
  );
}
```

  </TabItem>
</Tabs>
