import "./style.css";
import { Flight } from "./flight";
import { Scene } from "./render";
import { drawCover, drawWordmark } from "./cover";
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
const cover = el<HTMLCanvasElement>("cover");
const mark = el<HTMLCanvasElement>("wordmark");
drawWordmark(mark);
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
  el("sound").textContent = sound ? "Звук вкл." : "Звук выкл.";
  el("sound").setAttribute("aria-pressed", String(sound));
  el("sound").title = el("sound").ariaLabel = sound
    ? "Выключить звук"
    : "Включить звук";
};
function sync() {
  const ended = flight.ended;
  document.body.classList.toggle("flying", active);
  el("status").textContent = ended;
  const label = ended ? "Новый вылет" : flight.time ? "Продолжить" : "Вылет";
  el("fly").firstChild!.textContent = label + " ";
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
  dirty = true;
  sync();
  (active ? el("pause") : el("fly")).focus({ preventScroll: true });
}
mode.onchange = reset;
el("fly").onclick = toggle;
el("pause").onclick = toggle;
el("help").onclick = () => {
  if (active) toggle();
  dialog.showModal();
};
el("close").onclick = () => dialog.close();
const keyName = (e: KeyboardEvent) =>
  e.key === "Shift" || e.key === "Control" ? e.key : e.code;
window.onkeydown = (e) => {
  if (dialog.open || e.target === mode) return;
  if (
    e.code === "Space" &&
    e.target instanceof HTMLButtonElement &&
    !["fly", "pause"].includes(e.target.id)
  )
    return;
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
new ResizeObserver(() => {
  dirty = true;
}).observe(sceneCanvas);
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
    if (active) hud(overlay, flight);
    else drawCover(cover);
    el("thrust").textContent = Math.round(flight.throttle * 100) + "%";
    el("load").textContent = flight.load.toFixed(1) + " G";
    el("clock").textContent = [
      Math.floor(flight.time / 60),
      Math.floor(flight.time % 60),
    ]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    if (active)
      el("route").textContent = flight.course
        ? "Кольцо " + (flight.gate + 1) + " / 8"
        : "Свободный полёт";
    if (osc) osc.frequency.value = 30 + flight.throttle * 47;
    dirty = false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
