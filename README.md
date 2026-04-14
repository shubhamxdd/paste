# Pastebin

A self-hosted pastebin with syntax highlighting, paraphrase-protected pastes, gist collections, and full-text search.

## Features

- Create pastes with syntax highlighting for 17 languages
- Optional paraphrase protection — only people with the paraphrase can view the content
- Custom URLs — choose your own slug instead of a random ID
- Delete any paste using a secret server-side delete code
- Gists — group multiple pastes into a single shareable collection (up to 20 pastes)
- Full-text search across all pastes
- Raw paste view
- File upload support — drag and drop a file to populate the editor
- Dark and light theme
- PostHog analytics (server-side and client-side)

## Tech Stack

**Client:** React, TypeScript, Vite, Tailwind CSS, react-syntax-highlighter

**Server:** Node.js, Express, TypeScript, MongoDB

**Infrastructure:** Docker, Nginx, Caddy (TLS termination)

## Self-Hosting

### Prerequisites

- Docker and Docker Compose
- A domain pointing to your server (for TLS via Caddy)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/shubhamxdd/pastebin
   cd pastebin
   ```

2. Create a `.env` file in the project root:

   ```env
   POSTHOG_API_KEY=your_posthog_api_key
   POSTHOG_HOST=https://us.i.posthog.com

   VITE_POSTHOG_API_KEY=your_posthog_api_key
   VITE_POSTHOG_HOST=https://us.i.posthog.com

   PASTE_DELETE_CODE=your_secret_delete_code
   ```

3. Update `Caddyfile` with your domain:

   ```
   your-domain.com {
       reverse_proxy client:80
   }
   ```

4. Build and start:

   ```bash
   docker compose up --build -d
   ```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PASTE_DELETE_CODE` | Yes | Secret code required to delete any paste |
| `POSTHOG_API_KEY` | No | PostHog project API key for server-side analytics |
| `POSTHOG_HOST` | No | PostHog instance URL |
| `VITE_POSTHOG_API_KEY` | No | PostHog project API key for client-side analytics (baked in at build time) |
| `VITE_POSTHOG_HOST` | No | PostHog instance URL for client |

## API

### Pastes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pastes` | List pastes. Supports `?q=`, `?page=`, `?limit=` |
| `POST` | `/api/pastes` | Create a paste |
| `GET` | `/api/pastes/:id` | Get a paste |
| `DELETE` | `/api/pastes/:id` | Delete a paste (requires `deleteCode` in body) |
| `POST` | `/api/pastes/:id/unlock` | Unlock a protected paste |
| `GET` | `/api/pastes/:id/raw` | Get raw paste content |

### Gists (Collections)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/collections` | Create a gist |
| `GET` | `/api/collections/:id` | Get a gist with all its pastes |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check with DB status and stats |

## Local Development

**Server:**

```bash
cd server
npm install
npm run dev
```

**Client:**

```bash
cd client
npm install
npm run dev
```

The client dev server proxies `/api` requests to `localhost:3000`.
