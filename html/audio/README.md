# Cut Ups Audio Player

Self-hosted, embeddable audio player with admin interface, backed by Cloudflare Workers + D1 + R2. No ads, no accounts, no platform dependency.

## Architecture

```
Player Page (index.html)           Admin UI (admin/)
       │                                │
       │ fetches                        │ reads/writes
       ▼                                ▼
  manifest.json ◄──── Publish ──── Cloudflare Worker API
  (static, on R2)                       │
                                        ├── D1 (SQLite database)
                                        └── R2 (file storage)
```

- **Player page** reads a static `manifest.json` from R2 and renders players dynamically
- **Admin UI** manages mixes/playlists via the Worker API (D1 database), uploads files to R2
- **Publish** generates `manifest.json` from D1 and writes it to R2
- **Web Components** (`<cutups-player>`, `<cutups-playlist>`) can be embedded on any page

## Quick Start

### 1. Include the script

```html
<script src="https://geoffreymaddock.com/audio/audio-player.js"></script>
```

### 2. Add a player

```html
<cutups-player
  src="https://your-r2-url.r2.dev/audio/mix.mp3"
  title="My Mix"
  artist="DJ Name"
  color="#ff5500"
  thumb="https://your-r2-url.r2.dev/covers/cover.jpg"
  peaks="https://your-r2-url.r2.dev/peaks/mix.peaks.json">
</cutups-player>
```

The player renders inside Shadow DOM, so host page styles won't interfere.

## Components

### `<cutups-player>` -- Single Track

| Attribute  | Required | Description |
|------------|----------|-------------|
| `src`      | Yes      | URL to the audio file (MP3, WAV, OGG, etc.) |
| `title`    | No       | Track title (default: "Untitled Track") |
| `artist`   | No       | Artist name |
| `thumb`    | No       | URL to a thumbnail/cover image (80x80, any aspect ratio) |
| `peaks`    | No       | URL to a pre-computed peaks JSON file (see [Peaks](#peaks)) |
| `color`    | No       | Accent color as hex (default: `#ff5500`) |
| `duration` | No       | Pre-known duration string, e.g. `"3:42"` |

### `<cutups-playlist>` -- Multiple Tracks

Wraps a `<cutups-player>` with a clickable track list, prev/next navigation, and autoplay.

| Attribute | Required | Description |
|-----------|----------|-------------|
| `color`   | No       | Accent color applied to the embedded player and track list |
| `artist`  | No       | Default artist for tracks that don't specify one |

Tracks are defined as JSON inside a `<script type="application/json">` child element:

```html
<cutups-playlist color="#ff5500" artist="Cut Ups">
  <script type="application/json">
    [
      {"src": "track1.mp3", "title": "Track One", "thumb": "cover1.jpg", "peaks": "track1.peaks.json"},
      {"src": "track2.mp3", "title": "Track Two", "peaks": "track2.peaks.json"}
    ]
  </script>
</cutups-playlist>
```

### Play-one-at-a-time

Pause other players when one starts playing:

```html
<script>
  document.addEventListener('trackplay', (e) => {
    document.querySelectorAll('cutups-player').forEach(p => {
      if (p !== e.target) p.pause();
    });
  });
</script>
```

### JavaScript API

| Method       | Description |
|--------------|-------------|
| `play()`     | Start playback (lazy-loads audio on first call) |
| `pause()`    | Pause playback |
| `stop()`     | Stop and reset to beginning |
| `isPlaying()`| Returns `true` if currently playing |

| Event         | Detail | Description |
|---------------|--------|-------------|
| `trackplay`   | `{src}` | Fired when playback starts |
| `trackpause`  | --     | Fired when playback pauses |
| `trackfinish` | --     | Fired when track ends |

## Setup Guide

### Prerequisites

- Node.js 18+
- `ffmpeg` and `ffprobe` on your PATH (for peaks generation)
- A Cloudflare account

### Step 1: Cloudflare R2 Bucket

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → **Create Bucket**
2. Name it (e.g., `offgrid-dev`)
3. Go to bucket **Settings** → enable **Public access**
4. Copy the **Public bucket URL** (e.g., `https://pub-xxxxx.r2.dev`)
5. Set up CORS for the bucket:

```bash
cd html/audio/worker
npx wrangler r2 bucket cors set YOUR_BUCKET_NAME --file ./r2-cors.json
```

The `r2-cors.json` file allows GET, HEAD, and PUT from any origin.

### Step 2: R2 API Token (for uploads)

Required for uploading large files (>95MB) via presigned URLs:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → **Manage R2 API Tokens**
2. Click **Create API Token** (Account API Tokens)
3. Permissions: **Object Read & Write**, Scope: your bucket
4. Copy the **Access Key ID** and **Secret Access Key**

### Step 3: Worker Setup

```bash
cd html/audio/worker
npm install

# Authenticate with Cloudflare
npx wrangler login
# If login hangs on WSL, use an API token instead:
#   export CLOUDFLARE_API_TOKEN="your-token"
#   (Create at https://dash.cloudflare.com/profile/api-tokens
#    using the "Edit Cloudflare Workers" template)

# Create D1 database
npx wrangler d1 create cutups-db
# Copy the database_id from the output and update wrangler.toml:
#   [[d1_databases]]
#   binding = "DB"
#   database_name = "cutups-db"
#   database_id = "YOUR_DATABASE_ID"

# Apply database schema
npx wrangler d1 execute cutups-db --remote --file=migrations/001_init.sql

# Set secrets
npx wrangler secret put ADMIN_TOKEN          # Choose your admin password
npx wrangler secret put R2_ACCESS_KEY_ID     # From Step 2
npx wrangler secret put R2_SECRET_ACCESS_KEY # From Step 2
npx wrangler secret put CF_ACCOUNT_ID        # Your Cloudflare account ID

# Deploy the Worker
npx wrangler deploy
```

### Step 4: Seed Database (optional)

If you have an existing `data/manifest.json`, seed D1 from it:

```bash
node scripts/seed-d1.js
```

### Step 5: Migrate Files to R2 (optional)

Upload existing local audio files, covers, and peaks to R2:

```bash
# Preview what would be uploaded
node scripts/migrate-to-r2.js --dry-run

# Upload and update manifest with R2 URLs
export R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"
node scripts/migrate-to-r2.js
```

### Step 6: Configure Player Page

Update `MANIFEST_URL` in `index.html` to point to your R2 manifest:

```javascript
const MANIFEST_URL = 'https://pub-xxxxx.r2.dev/data/manifest.json';
```

## Admin UI

The admin interface lives at `admin/index.html`. Run a local server to use it:

```bash
cd html/audio
python3 -m http.server 8080
# Open http://localhost:8080/admin/
```

### Login

On the login screen, enter:
- **Worker URL**: Your deployed Worker URL (e.g., `https://cutups-api.offgrid-audio.workers.dev`)
- **R2 Public URL**: Your R2 public bucket URL (e.g., `https://pub-xxxxx.r2.dev`)
- **Admin token**: The password you set with `wrangler secret put ADMIN_TOKEN`

Or click **Use offline** to edit the local `manifest.json` without a backend.

### Features

- **Mixes**: Add, edit, delete mixes with metadata (title, artist, tags, color, etc.)
- **File uploads**: Upload audio, cover art, and peaks files directly to R2
- **Playlists**: Create playlists by selecting and ordering mixes
- **Search & sort**: Filter mixes by title, artist, or tags
- **Publish**: Generate `manifest.json` from D1 and write it to R2 (updates the player page)
- **Import/Export**: Import or download `manifest.json` for backup

### Workflow

1. Add a mix in the admin — fill in metadata, upload files
2. Generate peaks locally: `node generate-peaks.js mixes/your-mix.mp3`
3. Upload the peaks JSON via the admin
4. Click **Publish** to update the public player page

## Peaks

Pre-computed waveform peaks let the player show an accurate waveform on load without downloading the audio file. Strongly recommended for large files.

### Generating peaks

Requires `ffmpeg` and `ffprobe` on your PATH:

```bash
# Single file
node generate-peaks.js mixes/my-mix.mp3

# All MP3s in the audio directory
node generate-peaks.js --all

# Custom number of samples (default: 800)
node generate-peaks.js mixes/my-mix.mp3 1200
```

Output: `<basename>.peaks.json` alongside the source file.

### Peaks JSON format

```json
{
  "peaks": [0.042, 0.187, 0.534, 0.891, ...],
  "duration": 5355.22
}
```

## File Structure

```
html/audio/
  audio-player.js                  # Web component source (<cutups-player>, <cutups-playlist>)
  index.html                       # Player page (loads manifest.json from R2)
  generate-peaks.js                # Peak generation script (Node.js + ffmpeg)
  data/
    manifest.json                  # Local manifest (for dev/offline use)
    schema.md                      # JSON format documentation
  admin/
    index.html                     # Admin SPA shell
    admin.js                       # Admin logic (CRUD, uploads, auth)
    admin.css                      # Admin styles (dark theme)
  worker/
    wrangler.toml                  # Cloudflare Worker config (R2 + D1 bindings)
    package.json                   # Worker dependencies
    r2-cors.json                   # R2 CORS configuration
    src/
      index.js                     # Worker entry point (routing, CORS)
      auth.js                      # Bearer token authentication
      r2.js                        # R2 operations (presigned URLs, upload, list, delete)
      aws-sign.js                  # AWS Signature V4 for R2 presigned URLs
      db.js                        # D1 query helpers + manifest generation
      api/
        mixes.js                   # Mix CRUD endpoints
        playlists.js               # Playlist CRUD endpoints
        manifest.js                # Manifest generation + publish to R2
    migrations/
      001_init.sql                 # D1 database schema
  scripts/
    migrate-to-r2.js               # One-time: upload local files to R2
    seed-d1.js                     # One-time: seed D1 from manifest.json
  mixes/                           # Local audio files (gitignored)
```

## API Reference

All endpoints require `Authorization: Bearer <token>` header.

### R2 File Operations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/presign` | Generate presigned PUT URL for large file uploads |
| `POST` | `/upload` | Direct upload (files < 100MB, set `X-File-Key` header) |
| `GET` | `/files?prefix=audio/` | List R2 objects |
| `DELETE` | `/files/:key` | Delete R2 object |

### Mix CRUD

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/mixes` | List all mixes (`?tag=`, `?artist=`, `?sort=`, `?dir=`) |
| `GET` | `/api/mixes/:id` | Get single mix |
| `POST` | `/api/mixes` | Create mix |
| `PUT` | `/api/mixes/:id` | Update mix |
| `DELETE` | `/api/mixes/:id` | Delete mix (also removes from playlists) |

### Playlist CRUD

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/playlists` | List all playlists with resolved mixes |
| `GET` | `/api/playlists/:id` | Get single playlist |
| `POST` | `/api/playlists` | Create playlist |
| `PUT` | `/api/playlists/:id` | Update playlist |
| `DELETE` | `/api/playlists/:id` | Delete playlist |
| `POST` | `/api/playlists/:id/mixes` | Add mix to playlist (`{"mixId": "..."}`) |
| `DELETE` | `/api/playlists/:id/mixes/:mixId` | Remove mix from playlist |

### Manifest

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/manifest` | Generate manifest JSON from D1 |
| `POST` | `/api/manifest/publish` | Write manifest.json to R2 |

## WSL Notes

If developing on WSL:

- **D1 local mode fails** due to a `workerd` memory allocation issue. Always use `--remote`:
  ```bash
  npx wrangler d1 execute cutups-db --remote --file=migrations/001_init.sql
  ```
- **R2 local mode fails** for the same reason. Always use `--remote`:
  ```bash
  npx wrangler r2 object put BUCKET/key --remote --file=./file
  ```
- **`wrangler login` may hang** if the OAuth redirect can't reach WSL. Use an API token:
  ```bash
  export CLOUDFLARE_API_TOKEN="your-token"
  ```

## Dependencies

- [WaveSurfer.js v7](https://wavesurfer.xyz) -- loaded from CDN on first use
- [IBM Plex fonts](https://fonts.google.com/?query=IBM+Plex) -- loaded from Google Fonts
- [Wrangler v4](https://developers.cloudflare.com/workers/wrangler/) -- for Worker/D1/R2 operations
- `ffmpeg` / `ffprobe` -- required only for peak generation

## Cost

With Cloudflare R2, storage costs ~$0.015/GB/month with **zero egress fees**. A library of 100 mixes at 200MB each (20GB) costs about $0.30/month regardless of how many times they're streamed.
