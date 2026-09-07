# Retro Beats — YouTube Playlist Music Player

## Playlist playback fix

The player automatically skips playlist items that YouTube reports as unavailable, private, removed, region-restricted, or non-embeddable. This prevents the custom player from getting stuck on **"This track cannot be played"**.

The player also avoids accidentally skipping two songs at the end of a track. YouTube is allowed to advance the playlist normally; a fallback moves to the next item only if the current item remains in the `ENDED` state.

## Important limitation

Some YouTube Music tracks cannot be embedded by third-party websites. JavaScript cannot bypass YouTube's embedding restrictions. Those tracks are skipped automatically.

For reliable playback, use a public YouTube playlist containing videos that allow embedding.

## Setup

Open `script.js` and replace:

`const PLAYLIST_ID = "YOUR_PLAYLIST_ID";`

with your public playlist ID.

Example URL:

`https://www.youtube.com/playlist?list=PLxxxxxxxx`

Playlist ID:

`PLxxxxxxxx`

## Features

- Custom glass-style player
- Direct playback through the YouTube IFrame Player API
- No visible YouTube video
- Automatic unavailable-track skipping
- Previous / Play-Pause / Next
- Progress and seeking
- Automatic song title, channel and thumbnail updates
- Responsive desktop/mobile design
- SEO metadata
