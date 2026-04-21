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

## 5. Deployment Checklist & Next Steps

| Task | Status | Notes |
|---|---|---|
| `audio-player.js` web component | ✅ Done | `<cutups-player>` single track player |
| Playlist web component | ✅ Done | `<cutups-playlist>` with autoplay + nav |
| Demo page (`index.html`) | ✅ Done | Individual players + playlist + embed code |
| Cloudflare R2 bucket setup | 🔜 Next | Create bucket, set public access |
| Upload MP3 files to R2 | 🔜 Next | 4 mixes + any future uploads |
| Deploy `index.html` to CF Pages | 🔜 Next | Connect R2 bucket as static origin |
| Custom domain | 🔜 Next | Add domain in Cloudflare dashboard |
| Thumbnail images | 🕐 Later | Upload art, add `thumb=` attribute to players |
| Multi-bitrate transcoding | 🕐 Later | 320kbps desktop / 128kbps mobile |
| URL signing / hotlink protection | 🕐 Later | CF Workers to sign R2 URLs |
| Analytics | 🕐 Later | CF Web Analytics (free, no cookies) |

### Cloudflare R2 Setup (15 mins)

```bash
# 1. Log into dash.cloudflare.com → R2 → Create Bucket
# 2. Enable public access on the bucket (or use a custom domain)

# 3. Upload MP3s via Wrangler CLI
npx wrangler r2 object put my-bucket/track.mp3 --file track.mp3

# 4. Deploy index.html to Cloudflare Pages
#    Connect GitHub repo or drag-and-drop in the dashboard

# 5. Update src= attributes in index.html to point to R2 public URLs
```

### Local Testing (Before R2)

```bash
# Run a local server from the folder containing index.html and your MP3s
python3 -m http.server 8080

# Then open http://localhost:8080
# Relative src= paths will resolve correctly
```

### Known Issue — Error State

If a player can't find its audio file (wrong path, missing file), the play button currently spins indefinitely with no visible error. **Fix pending:** add an explicit error state to the `_ws.on('error')` handler so failed loads show a clear UI indicator instead of a frozen spinner.

### Optional Enhancements

- **Hotlink protection** — Cloudflare Worker to sign R2 URLs with HMAC, short expiry
- **Analytics** — Cloudflare Web Analytics (free, privacy-preserving, no cookies)
- **Transcoding** — run `ffmpeg` on upload to generate 128kbps mobile variant alongside 320kbps
- **Waveform pre-computation** — pre-generate WaveSurfer peak data JSON to speed up load time on long mixes

---

## 6. Known Issues

| Issue | Impact | Fix |
|---|---|---|
| No error state on failed audio load | Spinner runs forever, player appears broken | Add UI feedback to `_ws.on('error')` handler |
| Relative `src=` paths | Players fail unless files are co-located with HTML | Use full R2 URLs in production |

---

## 7. Reference

| Resource | URL |
|---|---|
| WaveSurfer.js | https://wavesurfer.xyz |
| Cloudflare R2 Pricing | https://developers.cloudflare.com/r2/pricing/ |
| Cloudflare Pages | https://developers.cloudflare.com/pages/ |
| R2 Cost Calculator | https://r2-calculator.cloudflare.com/ |
| Web Components MDN | https://developer.mozilla.org/en-US/docs/Web/API/Web_components |
| Wrangler CLI (R2 uploads) | https://developers.cloudflare.com/workers/wrangler/ |

---

*Generated by Claude · April 2026*