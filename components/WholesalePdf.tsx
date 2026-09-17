"use client";

import { useEffect, useRef, useState } from "react";

type WholesalePdfProps = {
  src: string;
  title: string;
};

export function WholesalePdf({ src, title }: WholesalePdfProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    async function renderPdf() {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjs.getDocument({ url: src });
      const pdf = await loadingTask.promise;
      if (cancelled || !container) return;

      container.replaceChildren();

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !container) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const width = container.clientWidth || baseViewport.width;
        const scale = width / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `${title} ${pageNumber}`);
        canvas.className = "mb-4 block h-auto w-full last:mb-0";
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvas, viewport }).promise;
        if (cancelled) return;
        container.appendChild(canvas);
      }
    }

    renderPdf().catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [src, title]);

  if (failed) {
    return (
      <object
        data={src}
        type="application/pdf"
        title={title}
        className="block h-[75vh] w-full min-h-[32rem] bg-las-bg"
      >
        <iframe src={src} title={title} className="block h-[75vh] w-full min-h-[32rem] bg-las-bg" />
      </object>
    );
  }

  return <div ref={containerRef} className="min-h-[24rem] w-full bg-las-bg" />;
}
