// Hand-lettered title, drawn on a pixel grid with a stepped italic slant.
export function drawWordmark(canvas: HTMLCanvasElement) {
  const glyphs: Record<string, string[]> = {
    A: [
      "0011100",
      "0111110",
      "1100011",
      "1100011",
      "1111111",
      "1100011",
      "1100011",
    ],
    S: [
      "0111111",
      "1100000",
      "1100000",
      "0111110",
      "0000011",
      "0000011",
      "1111110",
    ],
    T: [
      "11111111",
      "11111111",
      "00011000",
      "00011000",
      "00011000",
      "00011000",
      "00011000",
    ],
    R: [
      "1111110",
      "1100011",
      "1100011",
      "1111110",
      "1111000",
      "1101100",
      "1100111",
    ],
    "-": ["0000", "0000", "0000", "1111", "0000", "0000", "0000"],
    "6": [
      "0011111",
      "0110000",
      "1100000",
      "1111110",
      "1100011",
      "1100011",
      "0111110",
    ],
  };
  const title = "ASTRA-6";
  canvas.width = [...title].reduce(
    (w, letter) => w + glyphs[letter][0].length + 1,
    2,
  );
  const ctx = canvas.getContext("2d")!;
  let left = 0;
  for (const letter of title) {
    const rows = glyphs[letter];
    ctx.fillStyle = letter === "6" ? "#ff8455" : "#fff3d4";
    rows.forEach((row, y) =>
      [...row].forEach((pixel, x) => {
        if (pixel === "1")
          ctx.fillRect(left + x + Math.floor((6 - y) / 2), y * 2, 1, 2);
      }),
    );
    left += rows[0].length + 1;
  }
}

type Point = [number, number];
export function drawCover(canvas: HTMLCanvasElement) {
  const w = (canvas.width = Math.ceil(canvas.clientWidth / 2.4));
  const h = (canvas.height = Math.ceil(canvas.clientHeight / 2.4));
  if (!w || !h) return;
  const c = canvas.getContext("2d")!;
  // The aircraft is painted at sprite resolution, then scaled without interpolation.
  const sprite = document.createElement("canvas");
  sprite.width = 194;
  sprite.height = 108;
  const p = sprite.getContext("2d")!;
  function panel(color: string, ...points: Point[]) {
    p.fillStyle = color;
    p.beginPath();
    points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    p.fill();
  }
  const dark = "#343142",
    shadow = "#615c70",
    metal = "#b4a2a1",
    light = "#f1d5bb",
    red = "#ef704a";
  // Far stabilizer and wing, fuselage, then near wing and tail.
  panel(dark, [45, 65], [33, 42], [38, 41], [63, 59]);
  panel(shadow, [40, 62], [34, 43], [38, 42], [62, 59]);
  panel(dark, [83, 54], [62, 10], [68, 9], [120, 48]);
  panel(metal, [85, 51], [65, 12], [69, 12], [115, 47]);
  panel(red, [68, 17], [65, 12], [69, 12], [78, 19]);
  panel(
    dark,
    [24, 69],
    [55, 53],
    [110, 40],
    [143, 33],
    [184, 30],
    [191, 31],
    [159, 43],
    [88, 65],
    [43, 77],
    [25, 76],
  );
  panel(
    shadow,
    [28, 69],
    [105, 46],
    [183, 31],
    [168, 38],
    [85, 64],
    [39, 75],
    [26, 74],
  );
  panel(
    metal,
    [33, 66],
    [70, 51],
    [137, 36],
    [177, 31],
    [153, 40],
    [85, 59],
    [40, 70],
  );
  panel(light, [57, 56], [119, 39], [181, 30], [169, 33], [70, 55]);
  panel(dark, [116, 42], [126, 35], [143, 31], [154, 32], [150, 35], [131, 42]);
  panel("#6e9fa8", [124, 39], [129, 35], [142, 32], [147, 32], [138, 36]);
  panel("#def4df", [131, 35], [142, 32], [144, 32], [136, 35]);
  panel(dark, [55, 62], [47, 29], [53, 26], [79, 55], [71, 60]);
  panel(metal, [57, 59], [49, 30], [53, 28], [76, 54]);
  panel(red, [51, 38], [49, 30], [53, 28], [60, 36]);
  panel(dark, [100, 51], [123, 48], [98, 75], [51, 102], [46, 102], [57, 72]);
  panel(metal, [95, 55], [119, 49], [96, 72], [50, 98], [60, 73]);
  panel(light, [62, 71], [115, 51], [98, 63], [59, 75]);
  panel(shadow, [71, 81], [107, 59], [94, 73], [52, 97]);
  panel(red, [54, 87], [66, 81], [62, 89], [50, 98]);
  panel(dark, [39, 68], [62, 62], [45, 82], [20, 92], [19, 90]);
  panel(metal, [39, 68], [57, 64], [44, 78], [22, 89]);
  panel(dark, [21, 69], [32, 65], [39, 68], [37, 75], [27, 78], [21, 76]);
  panel("#aa7c80", [22, 70], [29, 68], [32, 70], [30, 75], [23, 76]);
  panel("#ffa36b", [21, 71], [27, 70], [25, 74], [16, 76]);
  const portrait = w / h < 0.95;
  const width = Math.min(w * (portrait ? 0.67 : 0.38), h * 0.94);
  const left = w * (portrait ? 0.26 : 0.56),
    top = h * (portrait ? 0.32 : 0.25);
  c.imageSmoothingEnabled = false;
  const anchorX = left + width * 0.12,
    anchorY = top + (width * 73) / 194;
  c.fillStyle = "rgba(242,201,193,.34)";
  c.beginPath();
  c.moveTo(anchorX, anchorY);
  c.lineTo(0, anchorY + anchorX * 0.32);
  c.lineTo(0, anchorY + anchorX * 0.39);
  c.closePath();
  c.fill();
  c.drawImage(sprite, left, top, width, (width * 108) / 194);
}
