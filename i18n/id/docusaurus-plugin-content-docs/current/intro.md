---
sidebar_position: 1
title: Introduction
---

# Selamat Datang Di Dropio

**Dropio** (dibaca dro—pio, bukan drop—io) adalah platform unggah file modern yang dirancang khusus untuk para pengembang di Indonesia.
Terinspirasi dari UploadThing, Dropio menyederhanakan proses unggah dan manajemen file, memungkinkan Anda mengintegrasikan fitur unggah yang fleksibel ke dalam aplikasi web Anda dengan mudah.

Salah satu keunggulan utama Dropio adalah kesederhanaannya — tidak memerlukan dependensi eksternal atau instalasi tambahan. **Cukup salin dan tempel** kode yang disediakan ke dalam proyek Anda, dan semuanya siap digunakan.

## Memulai

Untuk memulai, buat aplikasi baru di [dropio.my.id](https://www.dropio.my.id) dan ambil API key dari tab API Keys. Setelah itu, pilih framework yang Anda gunakan untuk mempelajari cara mengintegrasikan Dropio ke dalam aplikasi Anda dalam hitungan menit.

## Framework & Library

### Frontend

- **[Next.js (App Router)](/docs/getting-started/frameworks/nextjs-app-router)** — React + TypeScript / JavaScript
- **[React & Vite](/docs/getting-started/frameworks/react-vite)** — React + TypeScript / JavaScript

### Backend

- **[Express](/docs/getting-started/frameworks/express)** — JavaScript / TypeScript

:::info

> Kami terus memperluas dukungan untuk berbagai framework dan library lainnya — pantau terus untuk pembaruan!  
> Template framework kami bersifat open source, dan kontribusi Anda sangat kami sambut **[Github](https://github.com/WeebzDev/dropio)**.  
> Jika Anda ingin berkontribusi, pertimbangkan untuk membuat template untuk framework favorit Anda.

:::

## Mengunggah File

Alur unggah dirancang agar aman, memiliki performa tinggi, dan mudah dipahami:

![Flow 1](/img/flow-diagram-2.png)

### Client → Server Anda

Client mengirim permintaan untuk mengunggah file (misalnya, gambar 5MB).

Server Anda akan menangani:

- Validasi izin unggah dari pengguna  
- Validasi ukuran dan jenis file  
- Pembuatan **presigned URL**

:::info Setiap presigned URL hanya berlaku untuk **satu kali unggah**.

> Setelah digunakan, URL tersebut tidak dapat digunakan kembali atau disegarkan — Anda harus menghasilkan URL baru untuk setiap percobaan unggah.

:::

### Server Anda → Client

Server Anda mengirimkan presigned URL sebagai respons.

### Client → Dropio

Client mengunggah file langsung ke Dropio menggunakan presigned URL tersebut.

### Dropio → Cloud

Dropio meneruskan file dengan aman ke penyedia object storage.

---

## **[Roadmap](https://trello.com/b/DYM2DNrm/dropio-road-map)**

