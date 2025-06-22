---
sidebar_position: 2
title: DIOAPI
---

# DIOApi

**Dropio API Helper** — hanya untuk penggunaan **server-side**. Berfungsi seperti REST API standar, memungkinkan Anda menangani proses unggah dengan aman dari sisi backend.

### Constructor

```ts title="@/server/dropio.ts"
import { DIOApi } from '@/lib/dropio/server';

const dioapi = new DIOApi();

```

### Menghapus file

`deleteFiles` menerima satu `fileKey` atau array berisi beberapa `fileKeys`, dan akan menghapus file-file terkait dari penyimpanan server.

```ts
import { dioapi } from '@/server/dropio';

await dioapi.delete(['IMAGE-KEY.jpg']);
await dioapi.delete(['IMAGE-KEY-1.jpg', 'IMAGE-KEY-2.jpg']);

```
