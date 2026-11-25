import "./style.css";
import { Flight } from "./flight";
import { Scene } from "./render";
import { hud } from "./hud";
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let flight = new Flight(),
  active = false,
  prev = 0,
  acc = 0,
  dirty = true;
const keys = new Set<string>(),
  sceneCanvas = el<HTMLCanvasElement>("scene"),
  overlay = el<HTMLCanvasElement>("hud");
let scene: Scene;
try {
  scene = new Scene(sceneCanvas);
} catch (e) {
  el("status").textContent = String(e);
  (el("fly") as HTMLButtonElement).disabled = true;
  throw e;
}
const mode = el<HTMLSelectElement>("mode"),
  dialog = el<HTMLDialogElement>("dialog");
const metrics = [
  ["◈", "СКОРОСТЬ", "км/ч", 1200],
  ["⌁", "ВЫСОТА", "м", 3000],
  ["⤴", "ПЕРЕГРУЗКА", "G", 9],
  ["▥", "ТЯГА", "%", 100],
] as const;
el("metrics").innerHTML = metrics
  .map(
    ([icon, title, unit]) =>
      `<div class="metric"><label><i>${icon}</i>${title}</label><output></output><small>${unit}</small><div class="meter">${Array.from({ length: 12 }, (_, i) => `<b style="height:${4 + i}px"></b>`).join("")}</div></div>`,
  )
  .join("");
let audio: AudioContext | undefined,
  osc: OscillatorNode | undefined,
  gain: GainNode | undefined,
  sound = false;
function audioState() {
  if (gain && audio)
    gain.gain.setTargetAtTime(
      active && sound ? 0.035 : 0,
      audio.currentTime,
      0.12,
    );
}
el("sound").onclick = async () => {
  if (!audio) {
    audio = new AudioContext();
    osc = audio.createOscillator();
    gain = audio.createGain();
    gain.gain.value = 0;
    osc.type = "triangle";
    osc.frequency.value = 61;
    osc.connect(gain).connect(audio.destination);
    osc.start();
  }
  await audio.resume();
  sound = !sound;
  audioState();
  el("sound").textContent = sound ? "♫ ●" : "♫";
  el("sound").title = el("sound").ariaLabel = sound
    ? "Выключить звук"
    : "Включить звук";
};
function sync() {
  const ended = flight.ended;
  el("state").textContent =
    ended || (active ? "В полёте" : flight.time ? "Пауза" : "Готов к вылету");
  el("status").textContent = ended;
  el("fly").textContent = ended
    ? "↻  Новый вылет"
    : active
      ? "Ⅱ  Пауза"
      : flight.time
        ? "▶  Продолжить"
        : "▶  Начать полёт";
  el("route").textContent = flight.course
    ? "Кольцо " +
      String(Math.min(8, flight.gate + 1)).padStart(2, "0") +
      " / 08"
    : "Свободный полёт";
  audioState();
}
function reset() {
  flight = new Flight();
  flight.course = mode.selectedIndex === 0;
  active = false;
  dirty = true;
  keys.clear();
  acc = 0;
  sync();
}
function toggle() {
  if (dialog.open) return;
  if (flight.ended) reset();
  active = !active;
  keys.clear();
  sync();
}
mode.onchange = reset;
el("fly").onclick = toggle;
el("help").onclick = () => {
  if (active) toggle();
  dialog.showModal();
};
el("close").onclick = () => dialog.close();
const keyName = (e: KeyboardEvent) =>
  e.key === "Shift" || e.key === "Control" ? e.key : e.code;
window.onkeydown = (e) => {
  if (dialog.open || e.target === mode) return;
  if (e.code === "Space" && e.target instanceof HTMLButtonElement) return;
  if (
    [
      "Space",
      "Shift",
      "Control",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyS",
      "KeyA",
      "KeyD",
      "KeyQ",
      "KeyE",
    ].includes(keyName(e))
  ) {
    e.preventDefault();
    if (e.code === "Space" && !e.repeat) toggle();
    else keys.add(keyName(e));
  }
};
window.onkeyup = (e) => keys.delete(keyName(e));
window.onblur = () => {
  keys.clear();
  if (active) toggle();
};
for (const [k, s] of [
  ["KeyA", "↶"],
  ["KeyW", "↓"],
  ["KeyS", "↑"],
  ["KeyD", "↷"],
  ["Shift", "＋"],
  ["Control", "−"],
]) {
  const b = document.createElement("button");
  b.textContent = s;
  b.onpointerdown = (e) => {
    b.setPointerCapture(e.pointerId);
    keys.add(k);
  };
  b.onlostpointercapture = () => keys.delete(k);
  el("touch").append(b);
}
new ResizeObserver(() => (dirty = true)).observe(sceneCanvas);
function frame(t: number) {
  const dt = Math.min(0.1, (t - prev) / 1000);
  prev = t;
  if (active) {
    acc += dt;
    while (acc >= 1 / 120 && !flight.ended) {
      flight.step(1 / 120, keys);
      acc -= 1 / 120;
    }
    if (flight.ended) {
      active = false;
      sync();
    }
    dirty = true;
  }
  if (dirty) {
    scene.draw(flight);
    hud(overlay, flight);
    const vals = [
      Math.round(Math.hypot(...flight.vel) * 3.6),
      Math.round(flight.pos[1]),
      flight.load.toFixed(1),
      Math.round(flight.throttle * 100),
    ];
    document.querySelectorAll(".metric").forEach((m, i) => {
      m.querySelector("output")!.textContent = String(vals[i]);
      m.querySelectorAll("b").forEach(
        (b, j) =>
          (b.style.background =
            j < (Number(vals[i]) / metrics[i][3]) * 12 ? "#d5b376" : "#40473d"),
      );
    });
    el("clock").textContent = [
      Math.floor(flight.time / 60),
      Math.floor(flight.time % 60),
    ]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    sync();
    if (osc) osc.frequency.value = 30 + flight.throttle * 47;
    dirty = false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
