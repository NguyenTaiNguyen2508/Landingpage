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
      syncModalScroll();
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
    syncModalScroll();
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
setupImageDialog();
setupVideos();
setupReveals();


function syncModalScroll() {
  document.body.classList.toggle("modal-open", Boolean(document.querySelector("dialog[open]")));
}

function setupFeatureDetails() {
  const dialog = document.getElementById("detail-dialog");
  const host = dialog?.querySelector(".dialog-content");
  const library = document.querySelector(".detail-library");
  const close = dialog?.querySelector("[data-close-detail]");
  if (!host || !library || !close || typeof dialog.showModal !== "function") return;

  let content;
  let opener;
  let returnHash = "";
  document.documentElement.classList.add("dialog-ready");

  for (const link of document.querySelectorAll("[data-detail-link]")) {
    link.setAttribute("aria-haspopup", "dialog");
  }

  function open(target, source, updateHistory) {
    if (dialog.open) return;
    returnHash = location.hash.startsWith("#details-") ? "" : location.hash;
    content = target;
    opener = source;
    host.append(target);
    dialog.setAttribute("aria-labelledby", target.getAttribute("aria-labelledby"));
    dialog.showModal();
    dialog.scrollTop = 0;
    syncModalScroll();
    target.querySelector("h2").focus({ preventScroll: true });
    if (updateHistory) history.pushState(null, "", "#" + target.id);
  }

  function restore() {
    if (content) library.append(content);
    content = null;
    syncModalScroll();
    if (location.hash.startsWith("#details-")) {
      history.replaceState(history.state, "", location.pathname + location.search + returnHash);
    }
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  function closeFeature() {
    dialog.close();
    restore();
  }

  function openFromHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.matches(".details-source")) {
      open(target, null, false);
    } else if (dialog.open) {
      closeFeature();
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-detail-link]");
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      const target = document.getElementById(link.hash.slice(1));
      if (!target?.matches(".details-source")) return;
      event.preventDefault();
      open(target, link, true);
    }
    if (dialog.open && event.target.closest(".dialog-content a[href^='#']")) closeFeature();
  });
  close.addEventListener("click", closeFeature);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeFeature();
  });
  dialog.addEventListener("close", () => {
    if (!dialog.open && content) restore();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) closeFeature();
  });
  window.addEventListener("popstate", openFromHash);
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
}

function setupDownloads() {
  const guide = document.getElementById("details-download");
  const link = guide?.querySelector("[data-download-file]");
  const version = guide?.querySelector("[data-download-version]");
  const status = guide?.querySelector("[data-download-status]");
  const label = guide?.querySelector("[data-download-label]");
  const options = guide?.querySelectorAll('input[name="download-edition"]');
  const troubleshooting = guide?.querySelector("[data-download-troubleshooting]");
  if (!link || !version || !status || !label || !options?.length) return;

  guide.classList.add("downloads-ready");
  const fallback = link.dataset.portableUrl;
  const releases = {
    store: { url: link.dataset.storeUrl, description: "Fonez trên Microsoft Store", status: "Mở trang Microsoft Store trong tab mới", label: "Mở Microsoft Store" },
    portable: { url: fallback, description: "Windows 64-bit · v1.1.0 · 93,8 MB", status: "Tải trực tiếp qua HTTPS", checkedAt: 0 },
    msi: { url: "https://fonez.duckdns.org/v1/app-installers/download", description: "Bộ cài Windows 64-bit", status: "Tải MSI đang được phát hành trên Gateway", checkedAt: 0 },
  };
  const pending = new Set();
  let selected = "store";

  function render() {
    const release = releases[selected];
    for (const option of options) option.checked = option.value === selected;
    for (const option of options) document.getElementById(option.getAttribute("aria-controls")).hidden = option.value !== selected;
    if (troubleshooting) troubleshooting.hidden = selected === "store";
    version.textContent = release.description;
    status.textContent = pending.has(selected) ? "Đang kiểm tra phiên bản…" : release.status;
    label.textContent = release.unavailable ? "Chưa có bản MSI" : release.label || (selected === "portable" ? "Tải Portable" : "Tải bản MSI");
    link.removeAttribute("aria-disabled");
    if (selected === "store") {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
    if (release.unavailable) {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("download");
    } else {
      link.href = release.url;
      if (selected === "portable") link.setAttribute("download", "Fonez.exe");
      else link.removeAttribute("download");
    }
  }

  async function checkRelease(edition) {
    if (edition === "store") return;
    const release = releases[edition];
    if (location.protocol === "file:" || pending.has(edition) || Date.now() - release.checkedAt < 60000) return;
    pending.add(edition);
    render();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`./api/download?metadata=1&format=${edition}`, { cache: "no-store", signal: controller.signal });
      if (edition === "msi" && response.status === 204) {
        Object.assign(release, { unavailable: true, description: "Bộ cài Windows 64-bit", status: "MSI chưa được phát hành. Bạn có thể cài từ Microsoft Store hoặc dùng bản Portable.", checkedAt: Date.now() });
        return;
      }
      if (!response.ok) throw new Error("Release unavailable");
      const data = await response.json();
      const path = edition === "portable" ? "app-updates" : "app-installers";
      const extension = edition === "portable" ? "exe" : "msi";
      const expected = new RegExp(`^https://fonez\\.duckdns\\.org/v1/${path}/artifacts/[a-f0-9]{64}\\.${extension}$`);
      if (!expected.test(data.url) || typeof data.version !== "string" ||
          !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(data.version) || !Number.isSafeInteger(data.size) || data.size <= 0) throw new Error("Invalid release");
      const size = (data.size / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
      Object.assign(release, { url: data.url, unavailable: false,
        description: edition === "portable" ? `Windows 64-bit · v${data.version} · ${size} MB` : `MSI ${data.version} · Windows 64-bit · ${size} MB`,
        status: "Phiên bản mới nhất · Tải trực tiếp qua HTTPS", checkedAt: Date.now() });
    } catch {
      if (edition === "portable") {
        Object.assign(release, { url: fallback, description: "Windows 64-bit · v1.1.0 · 93,8 MB", status: "Chưa kiểm tra được bản mới hơn. Bạn vẫn có thể tải v1.1.0." });
      } else {
        // Never invent a release or fall back to downloading an EXE for an MSI choice.
        release.status = "Chưa kiểm tra được phiên bản MSI. Nút tải sẽ hỏi Gateway khi bạn bấm.";
      }
    } finally {
      clearTimeout(timeout);
      pending.delete(edition);
      render();
    }
  }

  for (const option of options) option.addEventListener("change", () => {
    if (!option.checked) return;
    selected = option.value;
    render();
    checkRelease(selected);
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-detail-link]")?.hash === "#details-download") checkRelease(selected);
  });
  window.addEventListener("hashchange", () => {
    if (location.hash === "#details-download") checkRelease(selected);
  });
  render();
  if (location.hash === "#details-download") checkRelease(selected);
}

function setupHeroParticles() {
  const canvas = document.getElementById("hero-particles");
  const context = canvas?.getContext("2d");
  if (!context || !("ResizeObserver" in window)) return;

  const hero = canvas.closest(".hero");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: .5, y: .5, active: false };
  const center = { x: .5, y: .5 };
  const colors = ["#2c64ed", "#3767df", "#4b62c9", "#f84242", "#ffcf03"];
  let particles = [];
  let width = 0;
  let height = 0;
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let visible = true;

  function createParticles() {
    const spacing = width < 600 ? 17 : 20;
    const columns = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);
    const random = (value) => {
      const number = Math.sin(value * 127.1 + 311.7) * 43758.5453;
      return number - Math.floor(number);
    };
    particles = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const seed = row * columns + column + 1;
        const color = random(seed + 79);
        particles.push({
          x: (column + .12 + random(seed) * .76) / columns,
          y: (row + .12 + random(seed + 13) * .76) / rows,
          phase: random(seed + 29) * Math.PI * 2,
          size: .55 + random(seed + 41) * .55,
          color: colors[color < .68 ? 0 : color < .83 ? 1 : color < .92 ? 2 : color < .97 ? 3 : 4]
        });
      }
    }
  }

  function draw(delta) {
    const time = reduced.matches ? 0 : elapsed;
    const targetX = pointer.active ? .5 + (pointer.x - .5) * .64 :
      .5 + Math.sin(time * .37) * .17 + Math.cos(time * .73) * .055;
    const targetY = pointer.active ? .5 + (pointer.y - .5) * .48 :
      .5 + Math.cos(time * .43) * .1;
    const follow = 1 - Math.exp(-delta * 3.5);
    center.x += (targetX - center.x) * follow;
    center.y += (targetY - center.y) * follow;
    const scale = Math.min(width, height);
    const radius = scale * (.47 + Math.sin(time) * .045 + Math.cos(time * 2.7) * .03);
    const band = scale * .27;
    const drift = scale * .012;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const waveX = Math.sin(time * .8 + particle.y * 11 + particle.phase);
      const waveY = Math.cos(time * .68 + particle.x * 10 + particle.phase);
      let x = particle.x * width + waveX * drift;
      let y = particle.y * height + waveY * drift;
      const dx = x - center.x * width;
      const dy = y - center.y * height;
      const distance = Math.hypot(dx, dy);
      const noise = Math.sin(particle.x * 13 + particle.y * 8 + time * .6) * scale * .035;
      const strength = Math.max(0, 1 - Math.abs(distance - radius + noise) / band);
      const intensity = strength * strength * (3 - 2 * strength);
      const angle = Math.atan2(dy, dx) + waveX * .45;
      const displacement = intensity * scale * .018;
      x += Math.cos(angle) * displacement;
      y += Math.sin(angle) * displacement;
      const length = particle.size * (.55 + intensity * 3.6);
      const thickness = Math.max(.45, length * .38);
      context.globalAlpha = .15 + intensity * .78;
      context.fillStyle = intensity > .08 ? particle.color : "#52627d";
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.fillRect(-length * .5, -thickness * .5, length, thickness);
      context.restore();
    }
  }

  function tick(time) {
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
    lastTime = time;
    elapsed += delta;
    draw(delta);
    frame = requestAnimationFrame(tick);
  }

  function update() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    draw(1);
    if (width && height && visible && !document.hidden && !reduced.matches) {
      frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(() => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
    update();
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(canvas);

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width;
    pointer.y = (event.clientY - bounds.top) / bounds.height;
    pointer.active = true;
  });
  hero.addEventListener("pointerleave", () => { pointer.active = false; });
  document.addEventListener("visibilitychange", update);
  reduced.addEventListener("change", update);
}

setupFeatureDetails();
setupDownloads();
setupHeroParticles();
