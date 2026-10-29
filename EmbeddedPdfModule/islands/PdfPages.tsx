import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import { linkStyle, noteStyle, pageStyle, placeholderStyle } from '../styles';

interface Props {
  pdfUrl: string;
  fileName: string;
}

interface RenderedPage {
  src: string;
  width: number;
  height: number;
}

type Status = 'loading' | 'done' | 'error';

const MAX_PAGES = 50;
const MIN_RENDER_WIDTH = 1200;
const MAX_RENDER_WIDTH = 2000;
const MAX_CANVAS_AREA = 5_242_880;
const MAX_CANVAS_SIDE = 32_767;
const FALLBACK_CONTAINER_WIDTH = 800;

function getRenderScale(pageWidth: number, pageHeight: number, containerWidth: number): number {
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.min(Math.max(containerWidth * pixelRatio, MIN_RENDER_WIDTH), MAX_RENDER_WIDTH);
  return Math.min(
    targetWidth / pageWidth,
    Math.sqrt(MAX_CANVAS_AREA / (pageWidth * pageHeight)),
    MAX_CANVAS_SIDE / Math.max(pageWidth, pageHeight),
  );
}

export default function PdfPages({ pdfUrl, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (import.meta.env.SSR) return;

    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let renderTask: RenderTask | null = null;
    const objectUrls: string[] = [];
    const canvas = document.createElement('canvas');

    async function renderPages() {
      const [pdfjs] = await Promise.all([
        import('pdfjs-dist/legacy/build/pdf.mjs'),
        import('pdfjs-dist/legacy/build/pdf.worker.mjs'),
      ]);
      if (cancelled) return;

      loadingTask = pdfjs.getDocument({
        url: pdfUrl,
        disableRange: true,
        verbosity: pdfjs.VerbosityLevel.ERRORS,
      });
      const pdf = await loadingTask.promise;
      if (cancelled) return;
      setPageCount(pdf.numPages);

      const containerWidth = containerRef.current?.clientWidth || FALLBACK_CONTAINER_WIDTH;
      const lastPage = Math.min(pdf.numPages, MAX_PAGES);

      for (let pageNumber = 1; pageNumber <= lastPage; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: getRenderScale(baseViewport.width, baseViewport.height, containerWidth),
        });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
        renderTask = null;

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.92),
        );
        page.cleanup();
        if (cancelled) return;
        if (!blob) throw new Error(`Page ${pageNumber} could not be encoded`);

        const src = URL.createObjectURL(blob);
        objectUrls.push(src);
        setPages((prev) => [...prev, { src, width: baseViewport.width, height: baseViewport.height }]);
      }

      canvas.width = 0;
      canvas.height = 0;
      await loadingTask.destroy();
      loadingTask = null;
      if (!cancelled) setStatus('done');
    }

    renderPages().catch(() => {
      loadingTask?.destroy();
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      loadingTask?.destroy();
      canvas.width = 0;
      canvas.height = 0;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pdfUrl]);

  return (
    <div ref={containerRef} aria-busy={status === 'loading'}>
      {status === 'loading' && pages.length === 0 && (
        <div style={placeholderStyle}>Loading {fileName}…</div>
      )}
      {pages.map((page, index) => (
        <img
          key={page.src}
          src={page.src}
          width={page.width}
          height={page.height}
          alt={`${fileName}, page ${index + 1} of ${pageCount}`}
          style={pageStyle}
        />
      ))}
      {status === 'error' && (
        <div style={placeholderStyle}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>This PDF couldn't be displayed</div>
          <div style={{ opacity: 0.7, fontSize: '0.875em' }}>
            Use the link below to open it in a new tab.
          </div>
        </div>
      )}
      {status === 'done' && pageCount > MAX_PAGES && (
        <p style={noteStyle}>
          Showing the first {MAX_PAGES} of {pageCount} pages.
        </p>
      )}
      <a href={pdfUrl} target='_blank' rel='noopener noreferrer' style={linkStyle}>
        Open {fileName}
      </a>
    </div>
  );
}
