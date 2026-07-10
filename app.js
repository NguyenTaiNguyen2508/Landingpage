const DOWNLOAD_URL =
  "https://drive.google.com/drive/folders/1t51CWXzwToFCee7DxN9S__ElGJalc30z?usp=sharing";

const downloadTargets = document.querySelectorAll("[data-download-trigger]");
const typedWord = document.querySelector("#typedWord");
const flowSteps = Array.from(document.querySelectorAll("[data-flow-step]"));
const flowStage = document.querySelector("[data-flow-stage]");
const flowPath = document.querySelector("[data-flow-path]");
const flowDot = document.querySelector("[data-flow-dot]");
const connectCards = Array.from(document.querySelectorAll(".connect-strip span"));
const FLOW_INTERVAL_MS = 1100;
const FLOW_LOOP_MS = FLOW_INTERVAL_MS * Math.max(flowSteps.length, 1);

function openDownload(event) {
  event?.preventDefault();
  window.location.href = DOWNLOAD_URL;
}

downloadTargets.forEach((target) => target.addEventListener("click", openDownload));

window.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

const words = ["Realtime trading", "Backtest chiến lược", "AI Research", "Walk-Forward", "PBO"];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  if (!typedWord) return;
  const current = words[wordIndex];
  typedWord.textContent = current.slice(0, charIndex);

  if (!deleting && charIndex < current.length) {
    charIndex += 1;
    window.setTimeout(typeLoop, 58);
    return;
  }

  if (!deleting && charIndex === current.length) {
    deleting = true;
    window.setTimeout(typeLoop, 1200);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    window.setTimeout(typeLoop, 34);
    return;
  }

  deleting = false;
  wordIndex = (wordIndex + 1) % words.length;
  window.setTimeout(typeLoop, 220);
}

typeLoop();

let flowIndex = 0;
let flowStartTime = 0;
let flowAnimationFrame = 0;
let flowPathLength = 0;

function renderFlowState(activeIndex) {
  flowSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === activeIndex);
    step.classList.toggle("is-complete", index < activeIndex);
  });
}

function placeFlowDot(progress) {
  if (!flowDot || !flowPath || !flowStage || !flowPathLength) return;

  const curve = flowPath.closest("svg");
  const curveRect = curve.getBoundingClientRect();
  const stageRect = flowStage.getBoundingClientRect();
  const viewBox = curve.viewBox.baseVal;

  if (!curveRect.width || !curveRect.height) return;

  const point = flowPath.getPointAtLength(flowPathLength * progress);
  const x = curveRect.left - stageRect.left + ((point.x - viewBox.x) / viewBox.width) * curveRect.width;
  const y = curveRect.top - stageRect.top + ((point.y - viewBox.y) / viewBox.height) * curveRect.height;

  flowDot.style.setProperty("--dot-x", `${Math.round(x)}px`);
  flowDot.style.setProperty("--dot-y", `${Math.round(y)}px`);
}

function renderFlowFrame(timestamp) {
  if (!flowStartTime) flowStartTime = timestamp;

  const progress = ((timestamp - flowStartTime) % FLOW_LOOP_MS) / FLOW_LOOP_MS;
  const activeIndex = Math.min(flowSteps.length - 1, Math.floor(progress * flowSteps.length));

  if (activeIndex !== flowIndex) {
    flowIndex = activeIndex;
    renderFlowState(flowIndex);
  }

  placeFlowDot(progress);
  flowAnimationFrame = window.requestAnimationFrame(renderFlowFrame);
}

function startFlowMotion() {
  if (!flowPath || !flowSteps.length) return;

  window.cancelAnimationFrame(flowAnimationFrame);
  flowPathLength = flowPath.getTotalLength();
  flowStartTime = 0;
  flowIndex = 0;
  renderFlowState(flowIndex);
  placeFlowDot(0);
  flowAnimationFrame = window.requestAnimationFrame(renderFlowFrame);
}

startFlowMotion();
window.addEventListener("load", startFlowMotion);
window.addEventListener("resize", () => placeFlowDot(((performance.now() - flowStartTime) % FLOW_LOOP_MS) / FLOW_LOOP_MS));

let connectIndex = 0;

connectCards[0]?.classList.add("is-highlight");

setInterval(() => {
  if (!connectCards.length) return;
  connectCards[connectIndex]?.classList.remove("is-highlight");
  connectIndex = (connectIndex + 1) % connectCards.length;
  connectCards[connectIndex]?.classList.add("is-highlight");
}, 1250);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 },
);

document.querySelectorAll(".reveal").forEach((node, index) => {
  node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
  revealObserver.observe(node);
});

const canvas = document.querySelector("#heroCanvas");
const ctx = canvas?.getContext("2d");
let width = 0;
let height = 0;
let dpr = 1;
let frame = 0;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawHero() {
  if (!ctx) return;
  frame += 1;
  ctx.clearRect(0, 0, width, height);

  const baseY = height * 0.72;
  const points = 20;
  const gap = width / (points - 1);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(215, 161, 46, 0.26)";
  ctx.beginPath();
  for (let i = 0; i < points; i += 1) {
    const x = i * gap;
    const wave = Math.sin(i * 0.74 + frame * 0.017) * 42;
    const y = baseY + wave + (points - i) * 2.6;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (let i = 0; i < points; i += 1) {
    const x = i * gap;
    const wave = Math.sin(i * 0.74 + frame * 0.017) * 42;
    const y = baseY + wave + (points - i) * 2.6;
    const high = y - 18 - ((i + frame) % 5) * 3;
    const low = y + 22 + ((i + 2) % 4) * 4;
    const open = y + Math.sin(i + frame * 0.022) * 14;
    const close = y - Math.cos(i * 0.9 + frame * 0.018) * 14;
    const color = close < open ? "#34d399" : "#fb7185";

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(x - 4, Math.min(open, close), 8, Math.max(8, Math.abs(open - close)));
  }

  const pulseX = ((frame * 2.2) % (width + 180)) - 90;
  ctx.strokeStyle = "rgba(240, 185, 11, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pulseX, height * 0.2);
  ctx.lineTo(pulseX + 160, height * 0.82);
  ctx.stroke();

  window.requestAnimationFrame(drawHero);
}

resizeCanvas();
drawHero();
window.addEventListener("resize", resizeCanvas);
