import type { GridConfig, SampleResult, TextSamplerOptions } from "./types";

export async function sampleCoverage(
  grid: GridConfig,
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void | Promise<void>,
  supersample = 3,
): Promise<Float32Array> {
  if (typeof document === "undefined")
    return new Float32Array(grid.cols * grid.rows);

  const ss = Math.max(1, supersample | 0);

  const width  = Math.ceil(grid.gridWidth * ss);
  const height = Math.ceil(grid.gridHeight * ss);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("PixelCanvas: sampler context unavailable.");

  ctx.setTransform(ss, 0, 0, ss, 0, 0);
  ctx.clearRect(0, 0, grid.gridWidth, grid.gridHeight);

  await render(ctx, grid.gridWidth, grid.gridHeight);

  const pixels = ctx.getImageData(0, 0, width, height).data;
  const coverage = new Float32Array(grid.rows * grid.cols);

  const cell = Math.max(1, Math.floor(grid.cellSize * ss));

  for (let row = 0; row < grid.rows; row++) {
    const py = Math.floor(row * grid.step * ss);

    for (let col = 0; col < grid.cols; col++) {
      const px = Math.floor(col * grid.step * ss);

      let alpha = 0;
      let samples = 0;

      for (let y = 0; y < cell && py + y < height; y++) {
        let index = ((py + y) * width + px) * 4 + 3;

        for (let x = 0; x < cell && px + x < width; x++) {
          alpha += pixels[index];
          index += 4;
          samples++;
        }
      }

      coverage[row * grid.cols + col] = samples ? alpha / (samples * 255) : 0;
    }
  }

  return coverage;
}

export async function buildCoverageMap(
  grid: GridConfig,
  options: TextSamplerOptions,
): Promise<SampleResult> {
  if (typeof document === "undefined")
    return {
      coverage: new Float32Array(grid.cols * grid.rows),
      cols: grid.cols,
      rows: grid.rows,
    };

  if ("fonts" in document) await document.fonts.ready;

  const coverage = await sampleCoverage(
    grid,
    (ctx, width, height) => {
      const lines = options.text.trim().split("\n");

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      const availableWidth  = width * (1 - options.paddingX * 2);
      const availableHeight = height * (1 - options.paddingY * 2);

      let low = 6;
      let high = Math.floor(availableHeight);
      let fontSize = low;

      while (low <= high) {
        const mid = (low + high) >> 1;

        ctx.font = `${options.fontWeight} ${mid}px ${options.fontFamily}`;

        const widest = Math.max(
          ...lines.map(line =>
            ctx.measureText(line).width +
            Math.max(0, line.length - 1) * options.letterSpacing,
          ),
        );

        const metric = ctx.measureText("Hg");
        const lineHeight =
          metric.actualBoundingBoxAscent +
          metric.actualBoundingBoxDescent +
          options.lineHeight;

        const totalHeight =
          lineHeight * lines.length - options.lineHeight;

        if (widest <= availableWidth && totalHeight <= availableHeight) {
          fontSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      ctx.font = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`;

      const metric = ctx.measureText("Hg");
      const ascent = metric.actualBoundingBoxAscent;
      const descent = metric.actualBoundingBoxDescent;

      const lineHeight = ascent + descent + options.lineHeight;
      const totalHeight = lineHeight * lines.length - options.lineHeight;

      let y = (height - totalHeight) * 0.5 + ascent;

      for (const line of lines) {
        if (options.letterSpacing === 0) {
          ctx.fillText(line, width * 0.5, y);
        } else {
          const glyphs = [...line];
          const widths = glyphs.map(g => ctx.measureText(g).width);

          const totalWidth =
            widths.reduce((a, b) => a + b, 0) +
            Math.max(0, glyphs.length - 1) * options.letterSpacing;

          let x = width * 0.5 - totalWidth * 0.5;

          for (let i = 0; i < glyphs.length; i++) {
            ctx.fillText(glyphs[i], x, y);
            x += widths[i] + options.letterSpacing;
          }
        }

        y += lineHeight;
      }
    },
    options.supersample,
  );

  return {
    coverage,
    cols: grid.cols,
    rows: grid.rows,
  };
}

export const DEFAULT_SAMPLER_OPTIONS: TextSamplerOptions = {
  text: "DIPTO THAKUR",
  fontFamily: 'ui-sans-serif,"Geist","Inter",system-ui,sans-serif',
  fontWeight: 700,
  letterSpacing: 0,
  lineHeight: 8,
  paddingX: 0.10,
  paddingY: 0.18,
  supersample: 3,
};