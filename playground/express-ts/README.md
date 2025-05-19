# Express.js Project

This is an Express.js dropio playground. Follow the steps below to install dependencies, configure your API token, and start the development server.

## Requirements

- Node.js (v16 or later recommended)
- [pnpm](https://pnpm.io/) or npm

## Installation

First, install the project dependencies using either `pnpm` or `npm`:

```bash
pnpm install
# or
npm install
````

## Configuration

1. Go to [https://www.dropio.my.id/dashboard/yourbucket/api-key](https://www.dropio.my.id/dashboard/yourbucket/api-key).
2. Copy your **API Key**.
3. Create a `.env` file in the root of the project and add the following line:

```env
API_TOKEN=your_api_token_here
```

Replace `your_api_token_here` with the actual token you copied.

## Running the Project

To start the development server, run:

```bash
pnpm dev
# or
npm run dev
```

The server should now be running locally (typically on [http://localhost:5010](http://localhost:5010)).

---

## Notes

* Make sure your `.env` file is not committed to version control.
* This project uses environment variables to protect your API credentials.

```

Let me know if you want to include other setup steps like database config, Docker, or API routes.
```
