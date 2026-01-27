# Furban Backend (Cloudflare Workers)

This is the new backend for Furban, built with Hono, Cloudflare Workers, D1, and R2.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Setup Cloudflare Resources:**
    -   Create a D1 database: `wrangler d1 create furban-db`
    -   Create an R2 bucket: `wrangler r2 bucket create furban-media`
    -   Update `wrangler.toml` with your `database_id` and `bucket_name`.

3.  **Apply Schema:**
    ```bash
    wrangler d1 execute furban-db --file=./schema.sql
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```

5.  **Deploy:**
    ```bash
    npm run deploy
    ```

## API Endpoints

-   `POST /api/auth/login`
-   `GET /api/photos` (Public Gallery)
-   `GET /api/blogs` (Public Blog)
-   `POST /api/photos` (Upload Photo - Protected)
-   `POST /api/blogs` (Create Blog - Protected)
-   `GET /api/admin/dashboard` (Admin)

## Migration from Old Backend

1.  Rename this folder to `backend`.
2.  Ensure your frontend `api.js` points to these new endpoints (already updated).
