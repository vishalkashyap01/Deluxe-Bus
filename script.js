/*
  Add the PUBLIC YouTube / YouTube Music playlist ID here.
  Example: https://www.youtube.com/playlist?list=PLxxxxxxxx
*/
const PLAYLIST_ID = "PLeatb7hupNV_AWUl_7ttbsKeCQh8tF5N4";

let player = null;
let playerReady = false;
let progressTimer = null;
let isSeeking = false;
let skipAttempts = 0;
let skipTimer = null;

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const trackTitle = document.getElementById("trackTitle");
const trackArtist = document.getElementById("trackArtist");
const albumArt = document.getElementById("albumArt");
const playlistName = document.getElementById("playlistName");
const year = document.getElementById("year");

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function hasPlaylist() {
  return PLAYLIST_ID && PLAYLIST_ID !== "YOUR_PLAYLIST_ID";
}

function setButtonState(playing) {
  playBtn.textContent = playing ? "❚❚" : "▶";
  playBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
}

function updateTrackInfo() {
  if (!playerReady || !player || typeof player.getVideoData !== "function") return;

  const data = player.getVideoData();
  if (!data || !data.title) return;

  trackTitle.textContent = data.title;
  trackArtist.textContent = data.author || "YouTube • Playlist";

  if (data.video_id) {
    albumArt.style.backgroundImage =
      `linear-gradient(145deg, rgba(0,0,0,.18), rgba(0,0,0,.6)), ` +
      `url("https://i.ytimg.com/vi/${encodeURIComponent(data.video_id)}/hqdefault.jpg")`;
    albumArt.style.backgroundSize = "cover";
    albumArt.style.backgroundPosition = "center";
    albumArt.querySelector("span").style.display = "none";
  }
}

function updateProgress() {
  if (!playerReady || !player || isSeeking) return;

  const current = player.getCurrentTime() || 0;
  const total = player.getDuration() || 0;

  currentTime.textContent = formatTime(current);
  duration.textContent = formatTime(total);
  progress.value = total > 0 ? (current / total) * 100 : 0;
}

function onPlayerReady() {
  playerReady = true;
  updateTrackInfo();
  updateProgress();

  progressTimer = window.setInterval(updateProgress, 500);
}

function getPlaylistLength() {
  if (!player || typeof player.getPlaylist !== "function") return 0;
  const list = player.getPlaylist();
  return Array.isArray(list) ? list.length : 0;
}

function skipUnavailableTrack() {
  if (!playerReady || !player) return;

  const playlistLength = getPlaylistLength();
  // If YouTube has a playlist, automatically move past unavailable/private/
  // non-embeddable videos instead of leaving the custom player stuck.
  if (playlistLength > 0 && skipAttempts >= playlistLength) {
    trackTitle.textContent = "No playable track found";
    trackArtist.textContent = "The remaining playlist videos are unavailable or cannot be embedded.";
    setButtonState(false);
    return;
  }

  skipAttempts += 1;
  trackTitle.textContent = "Skipping unavailable track…";
  trackArtist.textContent = "Finding the next playable song";
  setButtonState(false);

  clearTimeout(skipTimer);
  skipTimer = window.setTimeout(() => {
    player.nextVideo();
  }, 350);
}

function onPlayerStateChange(event) {
  const YT = window.YT;
  if (!YT) return;

  if (event.data === YT.PlayerState.PLAYING) {
    skipAttempts = 0;
    clearTimeout(skipTimer);
    setButtonState(true);
    updateTrackInfo();
  } else if (event.data === YT.PlayerState.PAUSED) {
    setButtonState(false);
  } else if (event.data === YT.PlayerState.ENDED) {
    setButtonState(false);

    // YouTube normally advances a playlist automatically. This fallback only
    // advances when the current item remains ended, preventing double-skips.
    const endedIndex = typeof player.getPlaylistIndex === "function"
      ? player.getPlaylistIndex()
      : -1;

    clearTimeout(skipTimer);
    skipTimer = window.setTimeout(() => {
      if (!playerReady || !player) return;

      const currentIndex = typeof player.getPlaylistIndex === "function"
        ? player.getPlaylistIndex()
        : -1;
      const stateNow = player.getPlayerState();

      if (currentIndex === endedIndex && stateNow === YT.PlayerState.ENDED) {
        player.nextVideo();
      }
    }, 900);
  } else if (event.data === YT.PlayerState.CUED) {
    updateTrackInfo();
    updateProgress();
  }
}

function onPlayerError(event) {
  // Common playlist errors: 100 = removed/private, 101/150 = embedding disabled.
  // They are skipped automatically so one bad item does not stop the playlist.
  const errorCode = event && event.data;
  if ([2, 5, 100, 101, 150, 153].includes(errorCode)) {
    skipUnavailableTrack();
    return;
  }

  trackTitle.textContent = "Playback error";
  trackArtist.textContent = "YouTube could not play this track.";
  setButtonState(false);
}

function createPlayer() {
  if (!hasPlaylist()) {
    trackTitle.textContent = "Add your YouTube playlist ID";
    trackArtist.textContent = "Set PLAYLIST_ID in script.js first.";
    return;
  }

  if (player) return;

  player = new YT.Player("youtubePlayer", {
    width: "1",
    height: "1",
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      listType: "playlist",
      list: PLAYLIST_ID
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });

  playlistName.textContent = "YouTube playlist connected";
}

function loadYouTubeAPI() {
  if (!hasPlaylist()) {
    createPlayer();
    return;
  }

  if (window.YT && window.YT.Player) {
    createPlayer();
    return;
  }

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = createPlayer;

playBtn.addEventListener("click", () => {
  if (!hasPlaylist()) {
    alert("Open script.js and replace YOUR_PLAYLIST_ID with your public YouTube playlist ID.");
    return;
  }

  if (!player) {
    loadYouTubeAPI();
    return;
  }

  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

prevBtn.addEventListener("click", () => {
  if (!playerReady) return;
  skipAttempts = 0;
  clearTimeout(skipTimer);
  player.previousVideo();
});

nextBtn.addEventListener("click", () => {
  if (!playerReady) return;
  skipAttempts = 0;
  clearTimeout(skipTimer);
  player.nextVideo();
});

progress.addEventListener("pointerdown", () => {
  isSeeking = true;
});

progress.addEventListener("input", () => {
  if (!playerReady) return;
  const total = player.getDuration() || 0;
  currentTime.textContent = formatTime((Number(progress.value) / 100) * total);
});

progress.addEventListener("change", () => {
  if (!playerReady) return;
  const total = player.getDuration() || 0;
  player.seekTo((Number(progress.value) / 100) * total, true);
  isSeeking = false;
  updateProgress();
});

progress.addEventListener("pointerup", () => {
  isSeeking = false;
});

year.textContent = new Date().getFullYear();

// Initialize the hidden player as soon as the page loads.
loadYouTubeAPI();

// ---------- Live clock + real connected-user presence ----------
const liveTime = document.getElementById("liveTime");
const liveUsers = document.getElementById("liveUsers");

function updateClock() {
  if (!liveTime) return;
  liveTime.textContent = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  }).format(new Date());
}
updateClock();
setInterval(updateClock, 1000);

// When served through server.js, this is the actual number of connected visitors.
// If the site is opened as a static file, fall back to a local single-user count.
function connectPresence() {
  if (!liveUsers || !window.WebSocket || !/^https?:$/.test(location.protocol)) return;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  try {
    const socket = new WebSocket(`${protocol}//${location.host}/presence`);
    socket.addEventListener("message", event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "presence") liveUsers.textContent = Math.max(1, Number(data.users) || 1);
      } catch (_) {}
    });
    socket.addEventListener("close", () => setTimeout(connectPresence, 3000));
  } catch (_) {}
}
connectPresence();
