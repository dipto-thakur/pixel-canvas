import type { Generator } from "./base";

/**
 * GeneratorManager — registry of available generators.
 * PixelCanvas registers one generator per mount; future multi-generator
 * scenarios can activate different ones at runtime.
 */
export class GeneratorManager {
  private readonly _registry = new Map<string, Generator>();
  private _active: Generator | null = null;

  register(generator: Generator): void {
    this._registry.set(generator.name, generator);
    if (!this._active) this._active = generator;
  }

  unregister(name: string): void {
    if (this._active?.name === name) this._active = null;
    this._registry.delete(name);
  }

  activate(name: string): void {
    const g = this._registry.get(name);
    if (!g) throw new Error(`PixelCanvas: unknown generator "${name}"`);
    this._active = g;
  }

  has(name: string): boolean { return this._registry.has(name); }

  clear(): void {
    this._registry.clear();
    this._active = null;
  }

  get active(): Generator | null { return this._active; }

  get names(): string[] { return [...this._registry.keys()]; }
}
