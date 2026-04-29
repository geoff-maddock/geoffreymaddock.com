---
name: add-soundcloud-mix
description: "Add a SoundCloud mix to geoffreymaddock.com/audio. Downloads the mix and cover art from SoundCloud, generates a waveform peaks file, uploads everything to Cloudflare R2, creates the mix record in the admin, and publishes the player page. Trigger when the user says things like 'add this mix', 'add this soundcloud link', 'upload this mix to the site', 'import from soundcloud', or pastes a soundcloud.com URL."
---

# Add SoundCloud Mix Skill

Imports a SoundCloud mix into the self-hosted audio player at geoffreymaddock.com/audio. The system uses Cloudflare Workers + D1 (database) + R2 (file storage).

## Credentials & Config

All credentials are in `C:\Users\geoff.maddock\code\geoffreymaddock.com\html\audio\.env.local`:
- **Worker URL**: `https://cutups-api.offgrid-audio.workers.dev`
- **R2 Public URL**: `https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev`
- **Admin Token**: in .env.local

Read this file first with the Read tool before doing anything else.

## Network Access Warning

The bash/shell workspace is **completely blocked from internet access** (proxy blocks all outbound). All API calls and file uploads must go through the **user's Chrome browser** via `mcp__Claude_in_Chrome__javascript_tool`. The browser can reach:
- `https://cutups-api.offgrid-audio.workers.dev` (worker API)
- `https://i1.sndcdn.com` (SoundCloud image CDN)
- `https://api-v2.soundcloud.com` (SoundCloud API)

The bash workspace CAN read/write local files via the mounted path `/sessions/*/mnt/audio/`.

## Step 1: Get Mix Info from SoundCloud

Navigate to the SoundCloud URL. Click play to trigger network requests, then capture the client_id and track ID:

```javascript
// After clicking play, find client_id from any api-v2.soundcloud.com request
// Track ID appears in streaming URLs as soundcloud:tracks:{ID}

(async () => {
  const resp = await fetch(`https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`);
  const track = await resp.json();
  return {
    title: track.title,
    artworkUrl: track.artwork_url?.replace('-large.jpg', '-t1080x1080.jpg'),
    durationMs: track.duration,   // NOTE: milliseconds! Divide by 1000 for seconds
    downloadable: track.downloadable,
    releaseDate: track.release_date
  };
})()
```

Also capture from the page snapshot: description, tags, tracklist.

## Step 2: Download the MP3

User must be **logged into SoundCloud** in Chrome. Click More → Download file:

```javascript
(async () => {
  const btns = Array.from(document.querySelectorAll('button'));
  const moreBtn = btns.find(b => {
    if (b.textContent.trim() !== 'More') return false;
    const rect = b.getBoundingClientRect();
    return rect.width > 0 && rect.top > 0;
  });
  if (moreBtn) moreBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  const allBtns = Array.from(document.querySelectorAll('button, a'));
  const dlBtn = allBtns.find(b => b.textContent.trim() === 'Download file');
  if (dlBtn) { dlBtn.click(); return 'clicked Download file'; }
  return 'Download file button not found — user may not be logged in';
})()
```

File downloads to user's Downloads folder. Ask user to move it to:
`C:\Users\geoff.maddock\code\geoffreymaddock.com\html\audio\mixes\cutups-{slug}.mp3`

## Step 3: Download Cover Art

From the SoundCloud tab in Chrome:

```javascript
(async () => {
  const url = 'https://i1.sndcdn.com/artworks-{ARTWORK_ID}-t1080x1080.jpg';
  const resp = await fetch(url);
  const blob = await resp.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '{slug}-cover.jpg';
  a.click();
  return `Downloaded: ${blob.size} bytes`;
})()
```

Ask user to move the downloaded file to the mixes folder as `{slug}-cover.jpg`.

## Step 4: Generate Peaks File

Run from bash workspace (ffmpeg required):

```bash
cd /sessions/*/mnt/audio
node generate-peaks.js mixes/cutups-{slug}.mp3
# Output: mixes/cutups-{slug}.peaks.json (~4-5KB, ~30 seconds processing time)
```

## Step 5: Log Into the Admin

Navigate Chrome tab to `https://geoffreymaddock.com/audio/admin/`, then:

```javascript
localStorage.setItem('cutups_api_url', 'https://cutups-api.offgrid-audio.workers.dev');
localStorage.setItem('cutups_r2_url', 'https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev');
localStorage.setItem('cutups_token', 'ADMIN_TOKEN');
location.reload();
```

Wait 2-3 seconds and verify by checking for the `+ Add Mix` button.

## Step 6: Upload Cover Art and Peaks to R2

Both files are small enough for the direct `/upload` endpoint. Get the peaks JSON from bash first:

```bash
cat /sessions/*/mnt/audio/mixes/cutups-{slug}.peaks.json
```

Then from the admin tab in Chrome:

```javascript
(async () => {
  const API = 'https://cutups-api.offgrid-audio.workers.dev';
  const TOKEN = 'ADMIN_TOKEN';
  const R2 = 'https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev';

  // Upload cover art — fetch directly from SoundCloud CDN
  const coverResp = await fetch('https://i1.sndcdn.com/artworks-{ARTWORK_ID}-t1080x1080.jpg');
  const coverBlob = await coverResp.blob();
  const coverUpload = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'image/jpeg', 'X-File-Key': 'covers/{slug}-cover.jpg' },
    body: coverBlob
  });
  const coverData = await coverUpload.json();

  // Upload peaks — paste full peaks JSON object inline
  const peaksJson = { /* PASTE FULL peaks JSON here */ };
  const peaksBlob = new Blob([JSON.stringify(peaksJson)], { type: 'application/json' });
  const peaksUpload = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'X-File-Key': 'peaks/cutups-{slug}.peaks.json' },
    body: peaksBlob
  });
  const peaksData = await peaksUpload.json();

  return { cover: coverData.key, peaks: peaksData.key };
})()
```

## Step 7: Create the Mix Record

```javascript
(async () => {
  document.getElementById('btn-add-mix').click();
  await new Promise(r => setTimeout(r, 600));

  const set = (id, val) => { const el = document.getElementById(id); if(el){el.value=val; el.dispatchEvent(new Event('input',{bubbles:true}));} };

  set('mix-id', '{slug}');                        // e.g. 'italian-danse-1990'
  set('mix-title', '{Title}');
  set('mix-artist', 'Cutups');
  set('mix-color', '#c8640a');
  set('mix-tags', 'tag1, tag2, tag3');
  set('mix-release-date', 'YYYY-MM-DD');
  set('mix-duration', '{duration_in_seconds}');   // SoundCloud ms ÷ 1000
  set('mix-description', '{description}');

  // Pre-set R2 URLs
  set('mix-src',   'https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev/audio/cutups-{slug}.mp3');
  set('mix-thumb', 'https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev/covers/{slug}-cover.jpg');
  set('mix-peaks', 'https://pub-ae4702a22ae04a4289e4fb95d6341a22.r2.dev/peaks/cutups-{slug}.peaks.json');

  document.getElementById('mix-form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
  await new Promise(r => setTimeout(r, 1500));
  return manifest.mixes.find(m => m.id === '{slug}') ? 'saved!' : 'not found in manifest';
})()
```

## Step 8: Upload the MP3 to R2

Chrome security blocks programmatic file input population. Use one of these:

**Option A — Admin UI (interactive):**
1. In the admin, click Edit on the new mix
2. Click Upload next to "Audio Source"
3. Select the MP3 from the mixes folder

**Option B — Wrangler CLI (user runs in their terminal):**
```bash
cd html/audio/worker
npx wrangler r2 object put offgrid-dev/audio/cutups-{slug}.mp3 \
  --file="../mixes/cutups-{slug}.mp3" \
  --remote
```

## Step 9: Publish

```javascript
(async () => {
  const resp = await apiFetch('/api/manifest/publish', { method: 'POST' });
  const data = await resp.json();
  return data;  // { published: true, mixCount: N, playlistCount: N }
})()
```

## Step 10: Verify

Navigate to `https://geoffreymaddock.com/audio` and check:

```javascript
Array.from(document.querySelectorAll('cutups-player')).map(p => p.getAttribute('title'))
// Should include the new mix title
```

## R2 Key Structure

| File | R2 Key | Example |
|------|--------|---------|
| MP3 | `audio/cutups-{slug}.mp3` | `audio/cutups-italian-dance-1990-mix.mp3` |
| Cover | `covers/{slug}-cover.jpg` | `covers/italian-danse-1990-cover.jpg` |
| Peaks | `peaks/cutups-{slug}.peaks.json` | `peaks/cutups-italian-dance-1990-mix.peaks.json` |

## Common Issues

- **"Download file" missing**: User must be logged into SoundCloud
- **Cover art blocked from bash**: Use Chrome browser fetch instead (i1.sndcdn.com is allowed)
- **Duration wrong**: SoundCloud API returns milliseconds — divide by 1000
- **Peaks in wrong directory**: Pass the full path to `generate-peaks.js` including `mixes/`
- **file_upload "Not Allowed"**: Chrome security restriction — use admin UI manually for MP3 upload
- **Worker unreachable from bash**: Expected — all API calls must go through Chrome's JS context
