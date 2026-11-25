import {
  add,
  scale,
  dot,
  cross,
  unit,
  clamp,
  height,
  gates,
  type Vec,
} from "./world";
export class Flight {
  pos: Vec = [0, 600, -1150];
  vel: Vec = [0, 0, 165];
  forward: Vec = [0, 0, 1];
  up: Vec = [0, 1, 0];
  right: Vec = [1, 0, 0];
  rate: Vec = [0, 0, 0];
  throttle = 0.72;
  time = 0;
  gate = 0;
  load = 1;
  ended = "";
  course = true;
  step(dt: number, k: Set<string>) {
    const axis = (a: string, b: string) => Number(k.has(a)) - Number(k.has(b));
    this.throttle = clamp(
      this.throttle + axis("Shift", "Control") * dt * 0.32,
      0,
      1,
    );
    const speed = Math.hypot(...this.vel),
      air = unit(this.vel);
    const input = [
      axis("KeyS", "KeyW") + axis("ArrowDown", "ArrowUp"),
      axis("KeyE", "KeyQ"),
      axis("KeyD", "KeyA") + axis("ArrowRight", "ArrowLeft"),
    ];
    const limits = [0.92, 0.39, 2.8];
    for (let i = 0; i < 3; i++)
      this.rate[i] +=
        (clamp(input[i], -1, 1) * limits[i] * clamp(speed / 130, 0.18, 1) -
          this.rate[i]) *
        dt *
        3;
    const omega = add(
      scale(this.right, -this.rate[0]),
      add(scale(this.up, this.rate[1]), scale(this.forward, -this.rate[2])),
    );
    this.forward = unit(
      add(this.forward, scale(cross(omega, this.forward), dt)),
    );
    this.up = unit(add(this.up, scale(cross(omega, this.up), dt)));
    this.right = unit(cross(this.up, this.forward));
    this.up = cross(this.forward, this.right);
    const aoa = -Math.asin(clamp(dot(air, this.up), -1, 1));
    const lift = clamp(
      (0.00036 * speed * speed * (1 + 15 * aoa)) /
        (1 + 9 * Math.max(0, Math.abs(aoa) - 0.28)),
      -65,
      88,
    );
    this.load = lift / 9.81;
    const accel = add(
      [0, -9.81, 0],
      add(
        scale(this.forward, 24 * this.throttle),
        add(
          scale(unit(cross(air, this.right)), lift),
          add(
            scale(air, -speed * speed * (0.00063 + 0.002 * aoa * aoa)),
            scale(this.right, -dot(this.vel, this.right) * 1.8),
          ),
        ),
      ),
    );
    this.vel = add(this.vel, scale(accel, dt));
    this.pos = add(this.pos, scale(this.vel, dt));
    this.time += dt;
    if (this.pos[1] < Math.max(0, height(this.pos[0], this.pos[2])) + 10)
      this.ended = "Столкновение";
    if (
      this.course &&
      Math.hypot(...add(this.pos, scale(gates[this.gate], -1))) < 150 &&
      ++this.gate === gates.length
    )
      this.ended = "Маршрут пройден";
  }
}
