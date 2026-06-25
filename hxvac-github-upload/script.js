const revealItems = document.querySelectorAll(".reveal");
const root = document.documentElement;
const cursorGlow = document.querySelector(".cursor-glow");
const cards = document.querySelectorAll(".project-card");
const previewVideos = document.querySelectorAll(".project-card video");

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
