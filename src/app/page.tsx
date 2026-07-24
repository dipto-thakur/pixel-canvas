import { PixelCanvas, emptyMatrix } from "@/components/pc2";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-16 bg-[#090909] p-8">
      <section className="w-full max-w-3xl">
        <h2 className="mb-4 text-sm text-neutral-500">text generator</h2>
        <PixelCanvas text="DIPTO THAKUR" height={220} />
      </section>

      <section className="w-full max-w-3xl">
        <h2 className="mb-4 text-sm text-neutral-500">github generator (empty matrix placeholder)</h2>
        <PixelCanvas
          generator="github"
          github={{ contributions: emptyMatrix() }}
          height={160}
        />
      </section>
    </main>
  );
}
