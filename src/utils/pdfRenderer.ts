import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN matching installed pdfjs-dist version or fallback version
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  // Always create a copy of the ArrayBuffer so pdfjs worker transfers do not detach state ArrayBuffers
  const safeBuffer = data && data.byteLength > 0 ? data.slice(0) : new ArrayBuffer(0);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeBuffer) });
  return await loadingTask.promise;
}

export async function renderPdfPage(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0,
  rotation: number = 0
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  // Set crisp canvas dimensions for high DPI / mobile & desktop displays (min scale 2x for sharp detail)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const outputScale = Math.max(dpr, 2);

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = Math.floor(viewport.width) + 'px';
  canvas.style.height = Math.floor(viewport.height) + 'px';

  // Enable high-quality smoothing for images & vector curves
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  context.scale(outputScale, outputScale);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
    renderInteractiveForms: true,
  };

  await page.render(renderContext).promise;

  return { width: viewport.width, height: viewport.height };
}
