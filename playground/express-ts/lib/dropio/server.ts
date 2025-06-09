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
  async delete(fileKeys: string[]): Promise<responseDIOApi<null>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${process.env.DROPIO_INGEST_SERVER!}/d/${process.env.DROPIO_APP_ID!}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {
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
}


