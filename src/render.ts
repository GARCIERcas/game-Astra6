import {
  height,
  noise,
  hash,
  cross,
  unit,
  scale,
  add,
  dot,
  gates,
  type Vec,
} from "./world";
import type { Flight } from "./flight";
function program(gl: WebGL2RenderingContext, v: string, f: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, v],
    [gl.FRAGMENT_SHADER, f],
  ] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, "#version 300 es\nprecision highp float;\n" + src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(s)!);
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(p)!);
  return p;
}
const camera = "uniform vec3 R,U,F,P;uniform float aspect;";
export class Scene {
  gl: WebGL2RenderingContext;
  sky: WebGLProgram;
  land: WebGLProgram;
  buf: WebGLBuffer;
  count = 0;
  tile = "";
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false })!;
    if (!gl)
      throw Error(
        "Для полёта нужен WebGL2. Включите аппаратное ускорение браузера.",
      );
    this.gl = gl;
    this.buf = gl.createBuffer()!;
    this.sky = program(
      gl,
      "out vec2 uv;void main(){uv=vec2((gl_VertexID<<1)&2,gl_VertexID&2)*2.-1.;gl_Position=vec4(uv,0.,1.);}",
      camera +
        `
 in vec2 uv;out vec4 col;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.545);}
 float n(vec2 p){vec2 i=floor(p),a=fract(p);a=a*a*(3.-2.*a);return mix(mix(h(i),h(i+vec2(1,0)),a.x),mix(h(i+vec2(0,1)),h(i+1.),a.x),a.y);}
 void main(){vec3 d=normalize(F+R*uv.x*aspect*.52+U*uv.y*.52);
 float y=d.y;vec3 c=mix(vec3(.99,.65,.49),vec3(.39,.39,.62),smoothstep(-.04,.53,y));
 vec3 sun=normalize(vec3(-.39,.126,1));float dist=length(d-sun);
 c+=vec3(.32,.16,.04)*exp(-dist*5.);
 if(dist<.048 && (y>.113 || fract(y*540.)>.28))c=vec3(1.,.91,.64);
 vec2 p=d.xz/max(.045,y+.06)*vec2(1.4,4.);
 float cloud=n(p)*.55+n(p*2.)*.28+n(p*5.)*.17;
 if(y>.015 && cloud>.56)c=mix(c,cloud>.64?vec3(.99,.72,.65):vec3(.82,.58,.64),.66);
 col=vec4(c,1.);}`,
    );
    this.land = program(
      gl,
      camera +
        `layout(location=0)in vec3 point;layout(location=1)in vec3 color;out vec3 tint;void main(){vec3 d=point-P;float z=dot(d,F);gl_Position=vec4(dot(d,R)/(.52*aspect),dot(d,U)/.52,z*1.0001-3.,z);tint=mix(color,vec3(.86,.62,.66),1.-exp(-length(d)*.000105));}`,
      "in vec3 tint;out vec4 col;void main(){col=vec4(tint,1.);}",
    );
  }
  mesh(cx: number, cz: number) {
    const data: number[] = [];
    function tri(a: Vec, b: Vec, c: Vec, color: Vec) {
      for (const v of [a, b, c]) data.push(...v, ...color);
    }
    const step = 210;
    function point(i: number, j: number): Vec {
      const x = (i + 0.36 * hash(i, j)) * step,
        z = (j + 0.36 * hash(j, i)) * step;
      return [x, height(x, z), z];
    }
    function ground(a: Vec, b: Vec, c: Vec) {
      const y = (a[1] + b[1] + c[1]) / 3;
      const normal = unit(cross(add(c, scale(a, -1)), add(b, scale(a, -1))));
      const lit = dot(normal, [-0.8, 0.35, 0.14]);
      const base: Vec =
        y > 1440 + 300 * noise(a[0] / 900, a[2] / 900)
          ? lit > 0.22
            ? [0.91, 0.77, 0.79]
            : [0.52, 0.48, 0.64]
          : y > 580
            ? lit > 0.25
              ? [0.63, 0.48, 0.57]
              : [0.32, 0.32, 0.48]
            : lit > 0.22
              ? [0.38, 0.4, 0.46]
              : [0.19, 0.27, 0.35];
      tri(a, b, c, scale(base, 0.9 + 0.21 * lit + 0.07 * hash(a[0], b[2])));
    }
    for (let i = cx - 55; i < cx + 55; i++)
      for (let j = cz - 50; j < cz + 65; j++) {
        const a = point(i, j),
          b = point(i + 1, j),
          c = point(i + 1, j + 1),
          d = point(i, j + 1);
        ground(a, b, c);
        ground(a, c, d);
        if (Math.min(a[1], b[1], c[1], d[1]) < 0) {
          const x = i * step,
            z = j * step;
          const color: Vec = [0.36, 0.49, 0.59];
          tri(
            [x - 80, 0, z - 80],
            [x + 300, 0, z - 80],
            [x + 300, 0, z + 300],
            color,
          );
          tri(
            [x - 80, 0, z - 80],
            [x + 300, 0, z + 300],
            [x - 80, 0, z + 300],
            color,
          );
          for (let n = 0; n < 3; n++) {
            let xx = x + hash(i + n, j) * step,
              zz = z + hash(j + n, i) * step;
            tri(
              [xx, 1, zz],
              [xx + 60, 1, zz],
              [xx + 38, 1, zz + 9],
              [0.67, 0.65, 0.69],
            );
          }
        }
        if (a[1] > 25 && a[1] < 880 && hash(i, j) > 0.18) {
          for (let t = 0; t < 3; t++) {
            let x = a[0] + hash(i + t, j) * 95,
              z = a[2] + hash(i, j + t) * 95,
              y = height(x, z) - 10,
              h = 45 + hash(t + i, j) * 45;
            tri(
              [x - 15, y, z],
              [x, y + h, z],
              [x + 15, y, z],
              [0.13, 0.23, 0.28],
            );
            tri(
              [x, y, z - 15],
              [x, y + h, z],
              [x, y, z + 15],
              [0.16, 0.26, 0.31],
            );
          }
        }
      }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    this.count = data.length / 6;
  }
  draw(f: Flight) {
    const gl = this.gl,
      w = Math.max(250, Math.round(this.canvas.clientWidth / 2.6)),
      h = Math.round((w * this.canvas.clientHeight) / this.canvas.clientWidth);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const cx = Math.floor(f.pos[0] / 2100) * 10,
      cz = Math.floor(f.pos[2] / 2100) * 10;
    if (this.tile !== cx + "," + cz) {
      this.mesh(cx, cz);
      this.tile = cx + "," + cz;
    }
    gl.viewport(0, 0, w, h);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const cam = (p: WebGLProgram) => {
      gl.useProgram(p);
      for (const [key, v] of [
        ["F", f.forward],
        ["R", f.right],
        ["U", f.up],
        ["P", f.pos],
      ] as const)
        gl.uniform3fv(gl.getUniformLocation(p, key), v);
      gl.uniform1f(gl.getUniformLocation(p, "aspect"), w / h);
    };
    gl.disable(gl.DEPTH_TEST);
    cam(this.sky);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    cam(this.land);
    gl.enable(gl.DEPTH_TEST);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    for (let i = 0; i < 2; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 24, i * 12);
    }
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
  }
}
export function gateScreen(f: Flight, w: number, h: number) {
  const d = add(gates[Math.min(7, f.gate)], scale(f.pos, -1)),
    z = dot(d, f.forward);
  return {
    x: w / 2 + (h * dot(d, f.right)) / (1.04 * z),
    y: h / 2 - (h * dot(d, f.up)) / (1.04 * z),
    radius: (h * 150) / (1.04 * z),
    z,
    dist: Math.hypot(...d),
  };
}
