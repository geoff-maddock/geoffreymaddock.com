# Cut Ups Audio Player

Self-hosted, embeddable audio player built with Web Components and WaveSurfer.js. No ads, no accounts, no platform dependency.

## Quick Start

### 1. Include the script

Add a single script tag to any HTML page:

```html
<script src="audio-player.js"></script>
```

Or use a full URL when embedding on external sites:

```html
<script src="https://geoffreymaddock.com/audio/audio-player.js"></script>
```

### 2. Add a player

```html
<cutups-player
  src="my-mix.mp3"
  title="My Mix"
  artist="DJ Name"
  color="#ff5500"
  thumb="cover.jpg"
  peaks="my-mix.peaks.json">
</cutups-player>
```

That's it. The player renders inside Shadow DOM, so host page styles won't interfere.

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

**Full example:**

```html
<cutups-player
  src="https://cdn.example.com/bloodbath.mp3"
  title="Bloodbath"
  artist="Cut Ups"
  thumb="https://cdn.example.com/bloodbath-cover.jpg"
  peaks="https://cdn.example.com/bloodbath.peaks.json"
  color="#ff5500">
</cutups-player>
```

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
      {
        "src": "track1.mp3",
        "title": "Track One",
        "artist": "Cut Ups",
        "thumb": "track1-cover.jpg",
        "peaks": "track1.peaks.json"
      },
      {
        "src": "track2.mp3",
        "title": "Track Two",
        "peaks": "track2.peaks.json"
      }
    ]
  </script>
</cutups-playlist>
```

Each track object supports: `src` (required), `title`, `artist`, `thumb`, `peaks`.

## Peaks

Pre-computed waveform peaks let the player show an accurate waveform preview on page load without downloading the audio file. This is strongly recommended for large files (DJ mixes, podcasts, etc.).

### How it works

- On page load, each player fetches its small peaks JSON (~5-15KB) and draws a static waveform preview
- Duration is shown immediately from the peaks data
- No audio is downloaded until the user clicks play
- With peaks, the player uses a streaming backend -- audio starts playing before the full file downloads

Without peaks, the player shows a blank placeholder. Audio is still lazy-loaded on click, but the full file must be downloaded and decoded before the waveform appears.

### Generating peaks

A Node.js script is included. Requires `ffmpeg` and `ffprobe` on your PATH.

```bash
# Generate peaks for a single file
node generate-peaks.js my-mix.mp3

# Generate peaks for all MP3s in the audio directory
node generate-peaks.js --all

# Custom number of peak samples (default: 800)
node generate-peaks.js my-mix.mp3 1200
```

Output files are named `<basename>.peaks.json` and placed alongside the source MP3.

### Peaks JSON format

```json
{
  "peaks": [0.042, 0.187, 0.534, 0.891, ...],
  "duration": 5355.22
}
```

- `peaks` -- Array of 800 normalized amplitude values (0 to 1)
- `duration` -- Track length in seconds

## Thumbnails

The `thumb` attribute accepts any image URL. Images are displayed at 80x80px in the single player and 44x44px in the playlist track list, cropped to fill via `object-fit: cover`.

Recommended specs:
- Format: JPEG or WebP
- Size: 200x200px or larger (will be scaled down)
- Aspect ratio: Square works best, but any ratio is accepted

```html
<!-- Relative path -->
<cutups-player src="mix.mp3" thumb="cover.jpg" ...></cutups-player>

<!-- Full URL -->
<cutups-player src="mix.mp3" thumb="https://cdn.example.com/cover.jpg" ...></cutups-player>
```

When no thumbnail is provided, a music note icon placeholder is shown.

## Embedding on External Sites

### Minimal embed (single track)

```html
<script src="https://geoffreymaddock.com/audio/audio-player.js"></script>

<cutups-player
  src="https://cdn.example.com/mix.mp3"
  title="My Mix"
  artist="DJ Name"
  color="#ff5500">
</cutups-player>
```

### With peaks and thumbnail

```html
<script src="https://geoffreymaddock.com/audio/audio-player.js"></script>

<cutups-player
  src="https://cdn.example.com/mix.mp3"
  title="My Mix"
  artist="DJ Name"
  thumb="https://cdn.example.com/cover.jpg"
  peaks="https://cdn.example.com/mix.peaks.json"
  color="#ff5500">
</cutups-player>
```

### Playlist embed

```html
<script src="https://geoffreymaddock.com/audio/audio-player.js"></script>

<cutups-playlist color="#ff5500" artist="DJ Name">
  <script type="application/json">
    [
      {"src": "https://cdn.example.com/track1.mp3", "title": "Track 1", "peaks": "https://cdn.example.com/track1.peaks.json"},
      {"src": "https://cdn.example.com/track2.mp3", "title": "Track 2", "peaks": "https://cdn.example.com/track2.peaks.json"}
    ]
  </script>
</cutups-playlist>
```

### Play-one-at-a-time

If you have multiple players on a page, add this snippet to pause others when one starts playing:

```html
<script>
  document.addEventListener('trackplay', (e) => {
    document.querySelectorAll('cutups-player').forEach(p => {
      if (p !== e.target) p.pause();
    });
  });
</script>
```

## JavaScript API

Each `<cutups-player>` element exposes these methods:

| Method       | Description |
|--------------|-------------|
| `play()`     | Start playback (lazy-loads audio on first call) |
| `pause()`    | Pause playback |
| `stop()`     | Stop and reset to beginning |
| `isPlaying()`| Returns `true` if currently playing |

### Events

All events bubble and are `composed` (cross Shadow DOM boundaries).

| Event         | Detail | Description |
|---------------|--------|-------------|
| `trackplay`   | `{src}` | Fired when playback starts |
| `trackpause`  | --     | Fired when playback pauses |
| `trackfinish`  | --     | Fired when track ends |

## Local Development

The player cannot be loaded via `file://` due to CORS restrictions. Run a local server:

```bash
cd html/audio
python3 -m http.server 8080
# Open http://localhost:8080
```

## File Structure

```
html/audio/
  audio-player.js                              # Web component source
  index.html                                   # Demo page
  generate-peaks.js                            # Peak generation script
  *.mp3                                        # Audio files
  *.peaks.json                                 # Pre-computed waveform data
  *.jpg                                        # Thumbnail images
```

## Dependencies

- [WaveSurfer.js v7](https://wavesurfer.xyz) -- loaded from CDN on first use
- [IBM Plex fonts](https://fonts.google.com/?query=IBM+Plex) -- loaded from Google Fonts
- `ffmpeg` / `ffprobe` -- required only for peak generation

## Recommended Hosting

[Cloudflare R2](https://developers.cloudflare.com/r2/) for audio files -- zero egress fees, HTTP Range request support, edge-cached via Cloudflare CDN. See the [project brief](../context/self-hosted-audio-streaming-platform.md) for setup instructions.
