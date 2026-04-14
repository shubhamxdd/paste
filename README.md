# Pastebin

A self-hosted pastebin with syntax highlighting, paraphrase-protected pastes, gist collections, and full-text search.

## Features

- Create pastes with syntax highlighting for 17 languages
- Optional paraphrase protection — only people with the paraphrase can view the content
- Custom URLs — choose your own slug instead of a random ID
- Delete any paste using a secret server-side delete code
- View count — each paste tracks how many times it has been viewed
- Line highlighting — click any line to highlight it and update the URL hash (e.g. `/p/abc123#L42`)
- Gists — group multiple pastes into a single shareable collection (up to 20 pastes)
- Edit and delete gists (requires delete code)
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
| `PASTE_DELETE_CODE` | Yes | Secret code required to delete or edit any paste or gist |
| `POSTHOG_API_KEY` | No | PostHog project API key for server-side analytics |
| `POSTHOG_HOST` | No | PostHog instance URL |
| `VITE_POSTHOG_API_KEY` | No | PostHog project API key for client-side analytics (baked in at build time) |
| `VITE_POSTHOG_HOST` | No | PostHog instance URL for client |

## API

### Pastes

---

#### `GET /api/pastes`

List pastes with optional full-text search and pagination.

Query params: `q`, `page`, `limit` (max 50, default 20)

Response `200`:
```json
{
  "pastes": [
    {
      "id": "abc123",
      "title": "My snippet",
      "language": "typescript",
      "created_at": "2024-07-01T10:00:00.000Z",
      "protected": false
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### `POST /api/pastes`

Create a paste.

Body:
```json
{
  "title": "My snippet",
  "content": "console.log('hello')",
  "language": "javascript",
  "paraphrase": "optional-secret",
  "customId": "optional-slug"
}
```

Response `201`:
```json
{
  "id": "abc123"
}
```

---

#### `GET /api/pastes/:id`

Get a paste. If protected, `content` is omitted and `protected` is `true`. Each call increments the view count.

Response `200` (unprotected):
```json
{
  "id": "abc123",
  "title": "My snippet",
  "content": "console.log('hello')",
  "language": "javascript",
  "created_at": "2024-07-01T10:00:00.000Z",
  "views": 42,
  "protected": false
}
```

Response `200` (protected):
```json
{
  "id": "abc123",
  "title": "My snippet",
  "language": "javascript",
  "created_at": "2024-07-01T10:00:00.000Z",
  "views": 42,
  "protected": true
}
```

---

#### `POST /api/pastes/:id/unlock`

Verify paraphrase and return the full content of a protected paste.

Body:
```json
{
  "paraphrase": "your-secret"
}
```

Response `200`:
```json
{
  "id": "abc123",
  "title": "My snippet",
  "content": "console.log('hello')",
  "language": "javascript",
  "created_at": "2024-07-01T10:00:00.000Z",
  "views": 42,
  "protected": true
}
```

Response `401`:
```json
{
  "error": "Incorrect paraphrase"
}
```

---

#### `DELETE /api/pastes/:id`

Delete a paste. Requires the server-side delete code.

Body:
```json
{
  "deleteCode": "your-delete-code"
}
```

Response `200`:
```json
{
  "success": true
}
```

Response `401`:
```json
{
  "error": "Incorrect delete code"
}
```

---

#### `GET /api/pastes/:id/raw`

Returns the raw paste content as `text/plain`. For protected pastes, pass `?paraphrase=your-secret`.

---

### Gists (Collections)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/collections` | Create a gist |
| `GET` | `/api/collections/:id` | Get a gist with all its pastes |
| `PATCH` | `/api/collections/:id` | Update title and/or pastes (requires `deleteCode`) |
| `DELETE` | `/api/collections/:id` | Delete a gist (requires `deleteCode`) |

---

#### `POST /api/collections`

Create a gist from existing pastes. Maximum 20 pastes per gist.

Body:
```json
{
  "title": "My collection",
  "paste_ids": ["abc123", "def456"]
}
```

Response `201`:
```json
{
  "id": "xyz789"
}
```

---

#### `GET /api/collections/:id`

Get a gist with all its pastes populated. Protected pastes within the collection omit `content`.

Response `200`:
```json
{
  "id": "xyz789",
  "title": "My collection",
  "created_at": "2024-07-01T10:00:00.000Z",
  "pastes": [
    {
      "id": "abc123",
      "title": "My snippet",
      "content": "console.log('hello')",
      "language": "javascript",
      "created_at": "2024-07-01T10:00:00.000Z",
      "protected": false
    }
  ]
}
```

---

#### `PATCH /api/collections/:id`

Update the title and/or paste list of a gist. Requires the delete code.

Body:
```json
{
  "deleteCode": "your-delete-code",
  "title": "Updated title",
  "paste_ids": ["abc123", "def456", "ghi789"]
}
```

Response `200`:
```json
{
  "success": true
}
```

Response `401`:
```json
{
  "error": "Incorrect delete code"
}
```

---

#### `DELETE /api/collections/:id`

Delete a gist. Requires the delete code. The individual pastes are not deleted.

Body:
```json
{
  "deleteCode": "your-delete-code"
}
```

Response `200`:
```json
{
  "success": true
}
```

---

### Health

---

#### `GET /health`

Response `200`:
```json
{
  "status": "ok",
  "uptime": 3600,
  "mongodb": "connected",
  "memory": {
    "used_mb": 64,
    "heap_used_mb": 32,
    "heap_total_mb": 48
  },
  "node_version": "v20.14.0",
  "stats": {
    "pastes": 120,
    "collections": 15
  },
  "timestamp": "2024-07-01T10:00:00.000Z"
}
```

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
