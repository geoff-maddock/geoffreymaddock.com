# Cut Ups — Self-Hosted Audio Player
## Project Brief

**No ads. No platform. No egress fees.**

| | |
|---|---|
| **Project** | Cut Ups — Embeddable Audio Player + Hosting |
| **Status** | MVP Complete — Ready for Deployment |
| **Stack** | Web Components · WaveSurfer.js · Cloudflare R2 |
| **Est. Cost** | ~$15/month for 1TB stored, unlimited streaming |

---

## 1. Overview & Goals

The goal is a self-hosted, ad-free audio player that can be embedded on any webpage with a single script tag — no SoundCloud, no Spotify, no platform dependency. Audio files are stored on Cloudflare R2 (zero egress fees) and streamed directly to the player.

Two deliverables were scoped and built:

- **Single track player** — `<cutups-player>` web component with waveform visualization, seek, volume, download
- **Playlist player** — `<cutups-playlist>` wrapping the single player with a track list, autoplay, and prev/next navigation

---

## 2. Architecture

### 2.1 Web Components

Both players are implemented as native Web Components using the Custom Elements + Shadow DOM APIs — no framework, no build step required on the consuming page.

| Component | Key Features | Config Attributes |
|---|---|---|
| `<cutups-player>` | WaveSurfer waveform, play/pause, seek, volume, download, loading shimmer, animated spinner | `src`, `title`, `artist`, `thumb`, `color` |
| `<cutups-playlist>` | Wraps `<cutups-player>`, clickable track list, animated EQ bars, prev/next buttons, autoplay toggle | `color`, `artist` + JSON tracks |

**Why Web Components?**

- Shadow DOM isolates styles — host page CSS can't break the player
- Single `<script>` tag embed — works on any page, any stack
- No React/Vue/etc. required on the consuming page
- Attribute-driven API — easy to template from any CMS
- Expose CSS custom properties (`--accent`, `--bg`) for theming

### 2.2 Audio Rendering

WaveSurfer.js v7 is loaded from CDN on first use (lazy). It renders the waveform by decoding the audio file via the Web Audio API. HTTP Range requests (206 Partial Content) enable seeking without downloading the entire file first. Cloudflare R2 supports Range requests natively.

### 2.3 Infrastructure

Cloudflare R2 is the recommended storage layer. Key properties:

- S3-compatible API — standard tooling works (AWS CLI, rclone, etc.)
- Zero egress fees — bandwidth is free regardless of volume
- Edge-cached via Cloudflare CDN — no separate CDN configuration
- HTTP Range requests supported — audio seeking works out of the box
- No minimum spend — pay only for storage

---

## 3. Cost Model

Stress-test scenario: 1,000 files × 1GB each, each streamed 1,000 times per month (1 petabyte egress).

| Line Item | Calculation | Cost/mo | Notes |
|---|---|---|---|
| Storage (1TB) | 1000 GB × $0.015 | **$15.00** | Flat rate |
| Egress / Bandwidth | 1 PB transferred | **$0.00** | Zero egress — R2 advantage |
| Class B ops (reads) | ~10M req/mo free tier | **$0.00** | First 10M free |
| Cloudflare plan | Free tier | **$0.00** | No min spend |
| **TOTAL** (1,000 × 1GB files, 1,000 streams each) | | **~$15/mo** | vs ~$85k/mo on AWS |

---

## 4. Deliverables

### `audio-player.js`

The web component file. Defines both custom elements. Drop it on any server and reference with a `<script>` tag.

**Usage — Single Track**

```html
<script src="https://your-domain.com/audio-player.js"></script>

<cutups-player
  src="https://cdn.your-domain.com/mix.mp3"
  title="Bloodbath"
  artist="Cut Ups"
  thumb="https://cdn.your-domain.com/art.jpg"
  color="#ff5500">
</cutups-player>
```

**Usage — Playlist**

```html
<cutups-playlist color="#ff5500" artist="Cut Ups">
  <script type="application/json">
    [{"src": "track1.mp3", "title": "Track 1"},
     {"src": "track2.mp3", "title": "Track 2"}]
  </script>
</cutups-playlist>
```

### `index.html`

Demo page showing both components in action. Dark, minimal aesthetic (IBM Plex fonts, SoundCloud orange). Includes:

- Four individual `<cutups-player>` instances with staggered fade-in
- One `<cutups-playlist>` with all four tracks
- Embed code block showing usage
- Global play-one-at-a-time listener preventing simultaneous playback

---

## 5. Deployment Checklist

| Task | Status | Notes |
|---|---|---|
| `audio-player.js` web component | ✅ Done | `<cutups-player>` single track player |
| Playlist web component | ✅ Done | `<cutups-playlist>` with autoplay + nav |
| Demo page (`index.html`) | ✅ Done | Manifest-driven, loads from R2 |
| JSON data layer (`manifest.json`) | ✅ Done | Schema + dynamic rendering |
| Admin interface | ✅ Done | CRUD, file uploads, publish to R2 |
| Cloudflare R2 bucket setup | ✅ Done | `offgrid-dev` bucket with public access + CORS |
| Upload files to R2 | ✅ Done | Via admin UI or `wrangler r2 object put --remote` |
| Cloudflare Worker API | ✅ Done | `cutups-api.offgrid-audio.workers.dev` |
| D1 database | ✅ Done | Schema applied, seeded from manifest |
| Bearer token auth | ✅ Done | Worker secret + admin login flow |
| Peaks generation | ✅ Done | `generate-peaks.js` (local, requires ffmpeg) |
| Error state on failed audio | ✅ Done | Shows error UI instead of frozen spinner |
| Custom domain | 🕐 Later | Add domain in Cloudflare dashboard |
| Multi-bitrate transcoding | 🕐 Later | 320kbps desktop / 128kbps mobile |
| URL signing / hotlink protection | 🕐 Later | CF Workers to sign R2 URLs |
| Analytics | 🕐 Later | CF Web Analytics (free, no cookies) |

### Deployed Infrastructure

| Component | URL |
|---|---|
| Worker API | `https://cutups-api.offgrid-audio.workers.dev` |
| R2 Public Bucket | `https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev` |
| R2 Bucket Name | `offgrid-dev` |
| D1 Database | `cutups-db` |

### Adding a New Mix (workflow)

1. Open admin at `http://localhost:8080/admin/` (run `python3 -m http.server 8080` from `html/audio/`)
2. Log in with Worker URL, R2 URL, and admin token
3. Click **+ Add Mix**, fill in metadata
4. Upload audio file, cover art via the Upload buttons
5. Generate peaks locally: `node generate-peaks.js mixes/your-mix.mp3`
6. Upload the peaks JSON via the admin
7. Save the mix
8. Click **Publish** to update the public player page

### Optional Enhancements

- **Hotlink protection** — Cloudflare Worker to sign R2 URLs with HMAC, short expiry
- **Analytics** — Cloudflare Web Analytics (free, privacy-preserving, no cookies)
- **Transcoding** — run `ffmpeg` on upload to generate 128kbps mobile variant alongside 320kbps
- **Custom domain** — point a subdomain at the R2 bucket for cleaner URLs

---

## 6. Reference

| Resource | URL |
|---|---|
| WaveSurfer.js | https://wavesurfer.xyz |
| Cloudflare R2 Pricing | https://developers.cloudflare.com/r2/pricing/ |
| Cloudflare Pages | https://developers.cloudflare.com/pages/ |
| R2 Cost Calculator | https://r2-calculator.cloudflare.com/ |
| Web Components MDN | https://developer.mozilla.org/en-US/docs/Web/API/Web_components |
| Wrangler CLI | https://developers.cloudflare.com/workers/wrangler/ |
| Cloudflare D1 | https://developers.cloudflare.com/d1/ |

---

*Generated by Claude · April 2026*