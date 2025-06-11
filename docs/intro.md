---
sidebar_position: 1
title: Introduction
---

# Welcome to Dropio

**Dropio** (dro—pio not drop—io) is a modern file upload platform built specifically for developers in Indonesia.  
Inspired by UploadThing, Dropio streamlines the process of uploading and managing files, allowing you to effortlessly integrate flexible upload capabilities into your web applications.

One of Dropio’s key advantages is its simplicity — it requires no external dependencies or additional installations. **Just copy and paste** the provided code into your project, and you're good to go.

## Getting Started

To get started, create a new application on the [dropio.my.id](https://www.dropio.my.id) and grab an API key from the API Keys tab. Then select your framework to learn how to integrate Dropio in your application in minutes.

## Frameworks & Library

### Frontend

- **[Next.js (App Router)](/docs/getting-started/frameworks/nextjs-app-router)** — React + TypeScript / JavaScript
- **[React & Vite](/docs/getting-started/frameworks/react-vite)** — React + TypeScript / JavaScript

### Backend

- **[Express](/docs/getting-started/frameworks/express)** — JavaScript / TypeScript

:::info

> We’re continuously expanding support for additional frameworks and libraries — stay tuned for updates!  
> Our framework templates are open source, and contributions are always welcome **[Github](https://github.com/WeebzDev/dropio)**.  
> If you’d like to help, consider building a template for your favorite framework.

:::

## Uploading Files

The upload flow is designed to be secure, performant, and easy to understand:

![Flow 1](/img/flow-diagram-2.png)

### Client → Your Server

Client requests to upload a file (e.g., a 5MB image).

Your server handles:

- Validating the user's upload permission
- Validating file size & type
- Generating a **presigned URL**

:::info Each presigned URL is valid for a **single upload only**.

> Once used, it cannot be reused or refreshed — a new URL must be generated for every upload attempt.

:::

### Your Server → Client

Your server responds with the presigned URL.

### Client → Dropio

Client uploads the file directly to Dropio using the presigned URL.

### Dropio → S3 (or compatible)

Dropio securely forwards the file to the object storage provider.

---

## **[Roadmap](https://trello.com/b/DYM2DNrm/dropio-road-map)**

