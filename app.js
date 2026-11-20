"use strict";

function setupNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  if (!header || !toggle || !nav) return;

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.hidden = false;
  header.classList.add("nav-enabled");
  toggle.addEventListener("click", () => setOpen(!header.classList.contains("nav-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("nav-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (header.classList.contains("nav-open") && toggle.getClientRects().length === 0) {
      setOpen(false);
    }
  });
}

function setupProductViews() {
  const list = document.querySelector("[data-view-list]");
  if (!list) return;

  const tabs = Array.from(list.querySelectorAll("[data-view-link]"));
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some((panel) => !panel?.matches("[data-view-panel]"))) return;

  const stage = panels[0].closest(".view-stage");
  const layered = stage && "inert" in stage && panels.every((panel) => panel.parentNode === stage) &&
    getComputedStyle(stage).getPropertyValue("--stack-product-views").trim() === "1";
  if (layered) stage.classList.add("view-stacked");
  let selectedIndex = -1;

  function select(index, animate = false) {
    if (index === selectedIndex) return;
    selectedIndex = index;
    if (layered) {
      const bounds = stage.getBoundingClientRect();
      stage.classList.toggle("view-changing", animate && !document.hidden && bounds.bottom > 0 && bounds.top < window.innerHeight);
    }
    tabs.forEach((tab, position) => {
      const selected = position === index;
      const panel = panels[position];
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !layered && !selected;
      panel.inert = !selected;
      panel.setAttribute("aria-hidden", String(!selected));
      panel.classList.toggle("view-active", selected);
    });
  }

  function activate(index) {
    select(index, true);
    window.history.replaceState(window.history.state, "", tabs[index].hash);
  }

  list.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    if (!tab.id) tab.id = "tab-" + panel.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;

    tab.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activate(index);
    });
    tab.addEventListener("keydown", (event) => {
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      let next;
      switch (event.key) {
        case "ArrowRight": next = (index + 1) % tabs.length; break;
        case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
        case "Home": next = 0; break;
        case "End": next = tabs.length - 1; break;
        case " ": next = index; break;
        default: return;
      }
      event.preventDefault();
      activate(next);
      tabs[next].focus({ preventScroll: true });
    });
  });

  const indexFromHash = () => tabs.findIndex((tab) => tab.hash === window.location.hash);
  select(Math.max(0, indexFromHash()));
  window.addEventListener("hashchange", () => {
    const index = indexFromHash();
    if (index >= 0) {
      select(index, true);
      panels[index].scrollIntoView({ block: "nearest" });
    }
  });
}

function openLinkedDetails() {
  const target = document.getElementById(window.location.hash.slice(1));
  const details = target?.closest("details");
  if (details && !details.open) {
    details.open = true;
    target.scrollIntoView();
  }
}

function setupImageDialog() {
  const dialog = document.getElementById("image-dialog");
  const title = document.getElementById("image-title");
  const image = dialog?.querySelector("img");
  const close = dialog?.querySelector("[data-close-image]");
  if (typeof dialog?.showModal !== "function" || !title || !image || !close) return;

  const mediaDirectory = new URL("./media/", document.baseURI).href;
  let opener;
  for (const link of document.querySelectorAll("a[href]")) {
    if (!link.href.startsWith(mediaDirectory) || !new URL(link.href).pathname.toLowerCase().endsWith(".webp")) continue;
    const figure = link.closest("figure");
    const source = link.querySelector("img") || figure?.querySelector("img");
    const label = figure?.querySelector("figcaption b, .plate-top strong") || link.querySelector("span");
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      title.textContent = label?.textContent.trim() || source?.alt || "Ảnh giao diện Fonez";
      image.alt = source?.alt || title.textContent;
      image.src = link.href;
      dialog.showModal();
    });
  }

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
}

function setupVideos() {
  const stage = document.getElementById("video-stage");
  const intro = document.getElementById("intro-player");
  const heading = document.getElementById("current-video");
  const watch = document.getElementById("watch-video");
  const picks = Array.from(document.querySelectorAll("[data-video-pick][data-video-id]"));
  if (!stage || !intro || !heading || !watch || !picks.length) return;

  let currentId = stage.dataset.defaultVideo;
  const hosted = window.location.protocol === "https:" || window.location.protocol === "http:";

  function select(pick, title) {
    currentId = pick.dataset.videoId;
    heading.textContent = title;
    watch.href = pick.href;
    for (const item of picks) {
      const selected = item === pick;
      item.classList.toggle("is-selected", selected);
      if (selected) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    }
  }

  for (const pick of picks) {
    const videoId = pick.dataset.videoId;
    const title = pick.querySelector("[data-video-title]")?.textContent.trim();
    if (!title || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) continue;
    const isIntro = videoId === stage.dataset.defaultVideo;
    if (isIntro) select(pick, title);

    pick.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!isIntro && (!hosted || !navigator.onLine)) return;

      event.preventDefault();
      if (isIntro) {
        if (intro.parentNode !== stage) stage.replaceChildren(intro);
        intro.play().catch(() => {});
      } else if (videoId !== currentId) {
        intro.pause();
        const iframe = document.createElement("iframe");
        iframe.title = title;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        iframe.src = "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0";
        stage.replaceChildren(iframe);
      }
      select(pick, title);
    });
  }
}

function setupReveals() {
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }
  });

  for (const node of document.querySelectorAll("[data-reveal]")) {
    if (node.getBoundingClientRect().top < window.innerHeight) continue;
    node.classList.add("reveal-pending");
    observer.observe(node);
  }
}

setupNavigation();
setupProductViews();
openLinkedDetails();
window.addEventListener("hashchange", openLinkedDetails);
setupImageDialog();
setupVideos();
setupReveals();
