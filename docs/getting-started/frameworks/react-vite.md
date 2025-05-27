---
sidebar_position: 3
title: React Vite
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting started with React Vite

### Set A Template Code

<Tabs groupId="reactviteGroup">
  <TabItem value='typescript' label='Typescript' default>
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
  </TabItem>

  <TabItem value='javascript' label='Javascript'>
  <details>
    <summary>Click to expand code</summary>

```js title="lib/dropio/client.js"
export function createUploader() {
  return function configureUploader(options) {
    return async function handleFileUpload(request) {
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

async function getPresignedUrl(file, serverUrl) {
  const requestPayload = {
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

  const responseData = await response.json();

  if (!response.ok || responseData.isError) {
    return {
      isError: true,
      result: responseData.isError ? responseData.message : 'Unknown error',
    };
  }

  return { isError: false, result: responseData.presignedUrl };
}

function uploadFileToIngestServer({ file, presignedUrl, onProgress }) {
  const xhr = new XMLHttpRequest();

  const result = new Promise((resolve) => {
    xhr.open('POST', presignedUrl, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const percentUploaded = Math.round((event.loaded / event.total) * 100);
        onProgress(percentUploaded);
      }
    };

    xhr.onload = () => {
      try {
        const parsedResponse = JSON.parse(xhr.responseText);

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
  </TabItem>
</Tabs>

### Add env variables

```env title=".env"
DROPIO_INGEST_SERVER='https://ingest.dropio.my.id'
```

### Create The Dropio Components

<Tabs groupId="reactviteGroup">
  <TabItem value='typescript' label='Typescript' default>

```ts title="utils/dropio.ts"
import { createUploader } from '@/lib/dropio/client';

const dio = createUploader();

export const { DioUploader } = {
  DioUploader: dio({
    customServerUrl: 'http://localhost:5010/api/dropio',
  }),
};
```

  </TabItem>

  <TabItem value='javascript' label='Javascript'>

```js title="utils/dropio.js"
import { createUploader } from '@/lib/dropio/client';

const dio = createUploader();

export const { DioUploader } = {
  DioUploader: dio({
    customServerUrl: 'http://localhost:5010/api/dropio',
  }),
};
```

  </TabItem>
</Tabs>

### Example

<Tabs groupId="reactviteGroup">
  <TabItem value='typescript' label='Typescript' default>

```tsx title="app.tsx"
import { useState } from 'react';
import { DioUploader } from '@/utils/dropio';
import type { UploadResult } from '@/libs/dropio/client';
import '@/App.css';

function App() {
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

export default App;
```

  </TabItem>

  <TabItem value='javascript' label='Javascript'>

```jsx title="app.jsx"
import { useState } from 'react';
import { DioUploader } from '@/utils/dropio';
import '@/App.css';

function App() {
  const [loading, setLoading] = useState(0);
  const [pending, setPending] = useState(false);
  const [resultData, setResultData] = useState(null);

  async function formAction(e) {
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
        <p>Result : {resultData ? resultData.originalName : 'no data'}</p>
      </form>
    </>
  );
}

export default App;
```

  </TabItem>
</Tabs>
