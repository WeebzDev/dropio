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

type OneToTen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type SizeUnit = 'B' | 'KB' | 'MB' | 'GB';
type FileSize = `${OneToTen}${SizeUnit}`;

type FileValidationOptions = Partial<
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

type generatePresignURLOptions = {
  data: UploadMetadataRequest;
  expire?: number;
  ContentDiposition?: string;
  route?: string;
};

type generatePresignURLResponse = {
  presignUrl: string;
  key: string;
};

type ServerApiResponse<T> = {
  status: 'success' | 'error';
  code: number;
  data: T | null;
  message: string | null;
  errors?: { field: string | number; message: string }[] | null;
};

type responseDIOApi<T = undefined> = {
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

function generatePresignURL(options: generatePresignURLOptions): generatePresignURLResponse {
  const { data, ContentDiposition, expire, route } = options;
  const { fileName, fileSize, fileType, customeId } = data;

  const baseUrl = createHash('sha256').update(randomBytes(18).toString('hex')).digest('hex').toUpperCase().slice(0, 24);

  const expires = Date.now() + (expire ?? 1 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    expire: expires.toString(),
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

// ---- Upload Factory ----
export function createDropio() {
  if (typeof window !== 'undefined') {
    throw new Error('createDropio can only be used in a server environment');
  }

  return function defineUploader(config: FileValidationOptions) {
    return function handleUpload(data: UploadMetadataRequest): UploadMetadataResponse {
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

      const presigned = generatePresignURL({ data });
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

#### Client Side Code

<details>
  <summary>Click to expand code</summary>

```ts title="lib/dropio/client.ts"
// ==== Types ====

type UploaderOptions = {
  customServerUrl?: string;
};

type UploadMetadataRequest = {
  fileName: string;
  fileSize: number;
  fileType: string;
};

type UploadRequest = {
  file: File;
  onProgress?: (percent: number) => void;
  onStatusChange?: (isPending: boolean) => void;
};

type ApiResponse<T> = {
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

type UploadResult =
  | { isError: true; message: string }
  | {
      isError: false;
      originalName: string;
      uniqueName: string;
      fileSize: number;
      fileUrl: string;
    };

type UploadMetadataResponse =
  | { isError: false; presignedUrl: string; key: string }
  | { isError: true; message: string };

// ==== Main Entry ====

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

// ==== Helpers ====

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
import { NextResponse } from 'next/server';

import { createDropio, type UploadMetadataRequest, type UploadMetadataResponse } from '@/lib/dropio/server';

const dio = createDropio();

export const ourFileRouter = {
  fileUploader: dio({
    image: {
      maxFileCount: 1,
      maxFileSize: '10MB',
    },
  }),
};

export async function POST(req: Request): Promise<NextResponse<UploadMetadataResponse>> {
  const metadata = (await req.json()) as UploadMetadataRequest;

  // Define your auth here
  const yourAuth = 'fakeId';
  metadata.customeId = yourAuth;

  const result = ourFileRouter.fileUploader(metadata);

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
