import type { GridConfig, SequenceItem, TextSamplerOptions } from "../types";
import { buildCoverageMap, DEFAULT_SAMPLER_OPTIONS } from "../sampler";
import type { Generator } from "./base";

export class TextGenerator implements Generator {
  readonly name = "text";

  private _cache:   Float32Array[] = [];
  private _items:   SequenceItem[];
  private _options: Omit<TextSamplerOptions, "text">;
  private _empty =  new Float32Array(0);
  private _index =  0;

  constructor(
    items: SequenceItem | SequenceItem[],
    options: Partial<Omit<TextSamplerOptions, "text">> = {},
  ) {
    this._items   = Array.isArray(items) ? items : [items];
    this._options = { ...DEFAULT_SAMPLER_OPTIONS, ...options };
  }

  get length()          { return this._items.length; }
  get index()           { return this._index; }
  get currentDuration() { return this._items[this._index]?.duration ?? 2000; }

  hasNext():     boolean { return this._index < this._items.length - 1; }
  hasPrevious(): boolean { return this._index > 0; }

  async build(grid: GridConfig): Promise<void> {
    this._index = 0;
    this._empty = new Float32Array(grid.cols * grid.rows);

    if (typeof document === "undefined") {
      this._cache = this._items.map(() => this._empty);
      return;
    }

    if ("fonts" in document) await document.fonts.ready;

    this._cache = await Promise.all(
      this._items.map(({ text }) =>
        buildCoverageMap(grid, { ...this._options, text }).then(r => r.coverage),
      ),
    );
  }

  current():   Float32Array { return this._cache[this._index] ?? this._empty; }
  next():      Float32Array { if (this.hasNext())     this._index++; return this.current(); }
  previous():  Float32Array { if (this.hasPrevious()) this._index--; return this.current(); }

  goto(index: number): Float32Array {
    this._index = Math.max(0, Math.min(index, this._items.length - 1));
    return this.current();
  }

  reset(): void { this._index = 0; }
}
