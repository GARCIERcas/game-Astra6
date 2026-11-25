export type Vec = [number, number, number];
export const add = (a: Vec, b: Vec): Vec => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export const scale = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const unit = (v: Vec) => scale(v, 1 / (Math.hypot(...v) || 1));
export const clamp = (x: number, a: number, b: number) =>
  Math.min(b, Math.max(a, x));
export const hash = (x: number, z: number) => {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
export function noise(x: number, z: number) {
  const i = Math.floor(x),
    j = Math.floor(z);
  let a = x - i,
    b = z - j;
  a = a * a * (3 - 2 * a);
  b = b * b * (3 - 2 * b);
  return (
    (hash(i, j) * (1 - a) + hash(i + 1, j) * a) * (1 - b) +
    (hash(i, j + 1) * (1 - a) + hash(i + 1, j + 1) * a) * b
  );
}
export const river = (z: number) =>
  900 * Math.sin(z / 2500) + 500 * Math.sin(z / 1200);
export function height(x: number, z: number) {
  const bank = clamp((Math.abs(x - river(z)) - 480) / 2600, 0, 1);
  const ridge = 1 - Math.abs(noise(x / 2500, z / 2500) * 2 - 1);
  return (
    -95 +
    bank *
      (300 +
        1900 * ridge * ridge +
        650 * noise(x / 950, z / 950) +
        230 * noise(x / 350, z / 350)) +
    90 * noise(x / 500, z / 500)
  );
}
export const gates: Vec[] = Array.from({ length: 8 }, (_, i) => {
  const z = 1900 + i * 1650;
  return [river(z), 380 + 100 * Math.cos(i * 0.9), z];
});
