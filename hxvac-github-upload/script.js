const revealItems = document.querySelectorAll(".reveal");
const root = document.documentElement;
const cursorGlow = document.querySelector(".cursor-glow");
const cards = document.querySelectorAll(".project-card");
const previewVideos = document.querySelectorAll(".project-card video");
const soundToggle = document.querySelector(".sound-toggle");
let audioContext;
let soundEnabled = false;
let lastHoverSound = 0;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playTone({ frequency = 420, type = "sine", duration = 0.08, gain = 0.035, slideTo }) {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playUiSound(kind) {
  const sounds = {
    hover: { frequency: 520, slideTo: 700, type: "triangle", duration: 0.055, gain: 0.025 },
    click: { frequency: 260, slideTo: 520, type: "square", duration: 0.08, gain: 0.028 },
    card: { frequency: 180, slideTo: 360, type: "sawtooth", duration: 0.12, gain: 0.022 },
    toggle: { frequency: 440, slideTo: 880, type: "triangle", duration: 0.14, gain: 0.032 },
  };

  playTone(sounds[kind] || sounds.hover);
}

function throttledHoverSound(kind = "hover") {
  const now = Date.now();

  if (now - lastHoverSound > 110) {
    playUiSound(kind);
    lastHoverSound = now;
  }
}

if (soundToggle) {
  soundToggle.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle.textContent = soundEnabled ? "Sound On" : "Sound Off";

    const context = getAudioContext();

    if (context && context.state === "suspended") {
      await context.resume().catch(() => {});
    }

    playUiSound("toggle");
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

window.addEventListener("pointermove", (event) => {
  const x = `${event.clientX}px`;
  const y = `${event.clientY}px`;

  root.style.setProperty("--mx", x);
  root.style.setProperty("--my", y);

  if (cursorGlow) {
    cursorGlow.style.opacity = "0.22";
  }
});

window.addEventListener("pointerleave", () => {
  if (cursorGlow) {
    cursorGlow.style.opacity = "0";
  }
});

cards.forEach((card) => {
  const video = card.querySelector("video");

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateX = (y - 50) / -18;
    const rotateY = (x - 50) / 18;

    card.style.setProperty("--card-x", `${x}%`);
    card.style.setProperty("--card-y", `${y}%`);
    card.style.transform = `translateY(-9px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("transform");

    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });

  card.addEventListener("pointerenter", () => {
    throttledHoverSound("card");

    if (video) {
      video.play().catch(() => {});
    }
  });
});

previewVideos.forEach((video) => {
  video.addEventListener("loadeddata", () => {
    video.closest(".project-card")?.classList.add("video-ready");
  });
});

document.querySelectorAll("a, button, .service-row, .step, .reason-grid p").forEach((item) => {
  item.addEventListener("pointerenter", () => throttledHoverSound("hover"));
  item.addEventListener("click", () => playUiSound("click"));
});
