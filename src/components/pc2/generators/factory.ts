import type { Generator } from "./base";
import { TextGenerator } from "./text";
import { GithubGenerator } from "./github";

import type {
  GeneratorType,
  GridConfig,
  SequenceItem,
  TextSamplerOptions,
  GithubOptions,
} from "../types";

export interface GeneratorFactoryOptions {
  type?: GeneratorType;
  grid: GridConfig;
  text?: string;
  sequence?: SequenceItem[];
  textOptions?: Partial<Omit<TextSamplerOptions, "text">>;
  github?: GithubOptions;
}

const DEFAULT_TEXT = "DIPTO THAKUR";

/**
 * GeneratorFactory
 *
 * Single entry point for generator creation.
 * PixelCanvas never instantiates generators directly.
 */
export async function createGenerator(
  opts: GeneratorFactoryOptions,
): Promise<Generator> {
  const type = opts.type ?? detectType(opts);

  validateOptions(type, opts);

  const generator = create(type, opts);

  await generator.build(opts.grid);

  return generator;
}

function create(
  type: GeneratorType,
  opts: GeneratorFactoryOptions,
): Generator {
  switch (type) {
    case "github":
      return new GithubGenerator(
        opts.github!.contributions,
      );

    case "text":
      return new TextGenerator(
        opts.sequence ?? [
          {
            text:
              opts.text ??
              DEFAULT_TEXT,
          },
        ],
        opts.textOptions,
      );

    default: {
      const exhaustive: never = type;

      throw new Error(
        `PixelCanvas: unsupported generator "${exhaustive}".`,
      );
    }
  }
}

function validateOptions(
  type: GeneratorType,
  opts: GeneratorFactoryOptions,
) {
  switch (type) {
    case "github":
      if (!opts.github) {
        throw new Error(
          "PixelCanvas: missing github options.",
        );
      }

      if (!opts.github.contributions?.length) {
        throw new Error(
          "PixelCanvas: github contributions are empty.",
        );
      }

      break;

    case "text":
      break;
  }
}

function detectType(
  opts: GeneratorFactoryOptions,
): GeneratorType {
  return opts.github
    ? "github"
    : "text";
}