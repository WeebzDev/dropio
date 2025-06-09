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
  if (typeof window !== 'undefined') {
    throw new Error('createDropio can only be used in a server environment');
  }

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
        cache: 'no-store',
        headers: {
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
}

exports.createDropio = createDropio;
exports.DIOApi = DIOApi;

