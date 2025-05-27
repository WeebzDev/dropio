---
sidebar_position: 2
title: DIOAPI
---

# DIOApi

**Dropio API Helper** — for **server-side** usage only. It functions like a standard REST API, allowing you to handle uploads securely from your backend.

### Constructor

```ts title="@/server/uploadthing.ts"
import { DIOApi } from '@/lib/dropio/server';

const dioapi = new DIOApi();
```

### Delete files

`deleteFiles` accepts either a single `fileKey` or an array of `fileKeys`, and removes the corresponding files from the server storage.

```ts
import { dioapi } from '@/server/uploadthing';

await dioapi.delete('IMAGE-KEY.jpg');
await dioapi.delete(['IMAGE-KEY.jpg']);
```
