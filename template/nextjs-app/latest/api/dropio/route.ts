import { NextResponse } from 'next/server';

import { type UploadMetadataRequest, type UploadMetadataResponse } from '@/lib/dropio/server';
import { ourFileRouter } from './core';

export async function POST(req: Request): Promise<NextResponse<UploadMetadataResponse>> {
  const metadata = (await req.json()) as UploadMetadataRequest;

  // Define your auth here (optional)
  const yourAuth = 'fakeId';
  metadata.customeId = yourAuth;

  const result = ourFileRouter.fileUploader(metadata, {
    expire: '1h', // 1 Hour
  });

  return NextResponse.json(result, {
    status: result.isError ? 400 : 200,
  });
}
