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
          // eslint-disable-next-line @typescript-eslint/no-empty-function
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
