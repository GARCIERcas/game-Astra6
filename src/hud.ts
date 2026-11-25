import type { Flight } from "./flight";
import { gateScreen } from "./render";
import { clamp, gates, dot, add, scale, type Vec } from "./world";
export function hud(canvas: HTMLCanvasElement, f: Flight) {
  const w = Math.round(canvas.clientWidth * 0.85),
    h = Math.round(canvas.clientHeight * 0.85);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const c = canvas.getContext("2d")!;
  c.clearRect(0, 0, w, h);
  const x = w / 2,
    y = h / 2,
    ink = "#d0ffc1";
  c.lineWidth = 1.4;
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.textAlign = "center";
  c.font = "bold 10px monospace";
  c.shadowColor = "#263c30";
  c.shadowBlur = 2;
  const line = (...p: number[]) => {
    c.beginPath();
    c.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
    c.stroke();
  };
  const txt = (s: string, a: number, b: number) => c.fillText(s, a, b);
  const heading =
    ((Math.atan2(f.forward[0], f.forward[2]) * 180) / Math.PI + 360) % 360;
  for (let i = -3; i <= 3; i++) {
    const hd = Math.round(heading / 5) * 5 + i * 5,
      xx = x + (hd - heading) * 5;
    line(xx, 18, xx, 23);
    if (i % 2 === 0) txt(String((hd + 360) % 360).padStart(3, "0"), xx, 14);
  }
  line(x - 4, 29, x, 24, x + 4, 29);
  const g = gateScreen(f, w, h);
  if (f.course && f.gate < 8) {
    const target = gates[f.gate];
    let visible = true;
    const points: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i * Math.PI) / 12;
      const p: Vec = [
        target[0] + 150 * Math.cos(a),
        target[1] + 150 * Math.sin(a),
        target[2],
      ];
      const d = add(p, scale(f.pos, -1)),
        z = dot(d, f.forward);
      if (z < 1) {
        visible = false;
        break;
      }
      points.push(
        x + (h * dot(d, f.right)) / (1.04 * z),
        y - (h * dot(d, f.up)) / (1.04 * z),
      );
    }
    c.strokeStyle = "#ffda94";
    c.fillStyle = "#ffe3ab";
    if (visible) line(...points);
    const xx = clamp(
        g.z > 0 ? g.x : dot(add(target, scale(f.pos, -1)), f.right) > 0 ? w : 0,
        50,
        w - 50,
      ),
      yy = clamp(g.z > 0 ? g.y - Math.abs(g.radius) - 11 : y, 52, h - 53);
    txt(
      "◇ " +
        String(f.gate + 1).padStart(2, "0") +
        "   " +
        (g.dist / 1000).toFixed(1) +
        " KM",
      xx,
      yy,
    );
  }
  c.strokeStyle = ink;
  c.fillStyle = ink;
  line(x - 19, y, x - 8, y, x - 4, y + 4, x + 4, y + 4, x + 8, y, x + 19, y);
  line(x, y - 6, x, y - 2);
  c.save();
  c.translate(x, y);
  c.rotate(Math.atan2(f.right[1], f.up[1]) * -1);
  const pitch = (Math.asin(clamp(f.forward[1], -1, 1)) * 180) / Math.PI;
  for (let i = -90; i <= 90; i += 10) {
    const yy = (pitch - i) * h * 0.016;
    if (Math.abs(yy) > h * 0.24) continue;
    const l = i === 0 ? 51 : 34;
    line(-l, yy + 4, -l, yy, -14, yy);
    line(14, yy, l, yy, l, yy + 4);
    if (i !== 0) txt(String(i), l + 13, yy + 3);
  }
  c.restore();
  for (const [side, num, label] of [
    [-1, Math.round(Math.hypot(...f.vel) * 3.6), "КМ/Ч"],
    [1, Math.round(f.pos[1]), "М"],
  ] as const) {
    const xx = x + side * Math.min(178, w * 0.32);
    c.strokeRect(xx - 25, y - 10, 50, 20);
    txt(String(num), xx, y + 4);
    txt(label, xx, y - 48);
    for (let i = -3; i <= 3; i++) {
      if (!i) continue;
      line(
        xx - side * 25,
        y + i * 12,
        xx - side * (i % 2 ? 19 : 13),
        y + i * 12,
      );
    }
  }
  // Angular canopy sills, stepped highlights and recessed fasteners.
  c.shadowBlur = 0;
  for (let side = 0; side < 2; side++) {
    c.save();
    if (side) {
      c.translate(w, 0);
      c.scale(-1, 1);
    }
    const panel = (pts: number[][], fill: string) => {
      c.fillStyle = fill;
      c.beginPath();
      pts.forEach(([a, b], i) =>
        i ? c.lineTo(w * a, h * b) : c.moveTo(w * a, h * b),
      );
      c.closePath();
      c.fill();
    };
    panel(
      [
        [0, 0.59],
        [0.034, 0.76],
        [0.15, 0.91],
        [0.32, 0.974],
        [0.35, 1],
        [0, 1],
      ],
      "#20272b",
    );
    panel(
      [
        [0, 0.62],
        [0.032, 0.78],
        [0.147, 0.925],
        [0.32, 0.987],
        [0.29, 0.99],
        [0.14, 0.946],
        [0.025, 0.81],
        [0, 0.7],
      ],
      "#7b7673",
    );
    panel(
      [
        [0, 0.79],
        [0.12, 0.946],
        [0.25, 1],
        [0, 1],
      ],
      "#343b40",
    );
    panel(
      [
        [0.025, 0.86],
        [0.11, 0.962],
        [0.075, 0.96],
        [0.014, 0.89],
      ],
      "#161e21",
    );
    for (let j = 0; j < 6; j++) {
      c.fillStyle = j % 2 ? "#c5a36e" : "#727b76";
      c.fillRect(
        Math.floor(w * (0.024 + j * 0.01)),
        Math.floor(h * (0.884 + j * 0.012)),
        4,
        2,
      );
    }
    c.restore();
  }
}
