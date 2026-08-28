import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker source
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

export interface DuplexSplitResult {
  oddPagesBlob: Blob;
  oddPagesUrl: string;
  oddCount: number;
  oddPagesList: number[];
  
  evenPagesBlob: Blob;
  evenPagesUrl: string;
  evenCount: number;
  evenPagesList: number[];

  totalPages: number;
  fileName: string;
}

export interface SplitOptions {
  reverseEvenPages?: boolean; // Reverse even pages order for specific printer tray feeds
}

/**
 * Splits a PDF document into Odd (Front) and Even (Back) page PDFs
 */
export async function splitPdfForDuplex(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  options: SplitOptions = { reverseEvenPages: false }
): Promise<DuplexSplitResult> {
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('PDF file buffer is empty or detached. Please reload the document.');
  }

  // Safely clone buffer array to prevent detachment issues
  const bufferCopy = arrayBuffer.slice(0);
  const uint8Data = new Uint8Array(bufferCopy);

  let srcPdf: PDFDocument;
  try {
    srcPdf = await PDFDocument.load(uint8Data, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
  } catch (loadErr: any) {
    console.error('pdf-lib load error:', loadErr);
    throw new Error(
      `Could not parse PDF structure: ${loadErr?.message || 'File may be corrupt or encrypted.'}`
    );
  }

  const totalPages = srcPdf.getPageCount();
  if (totalPages === 0) {
    throw new Error('The PDF document contains 0 pages.');
  }

  // 0-based page indices
  const oddIndices: number[] = [];
  const evenIndices: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    if (i % 2 === 0) {
      oddIndices.push(i);
    } else {
      evenIndices.push(i);
    }
  }

  // 1-based display page lists
  const oddPagesList = oddIndices.map((idx) => idx + 1);
  const evenPagesList = evenIndices.map((idx) => idx + 1);

  // Helper to copy exact page geometry, orientation and crop boxes
  const transferPageProperties = (
    srcDoc: PDFDocument,
    dstDoc: PDFDocument,
    copiedPages: any[],
    indices: number[]
  ) => {
    copiedPages.forEach((page, i) => {
      const srcIdx = indices[i];
      const srcPage = srcDoc.getPage(srcIdx);

      // Preserve rotation & all page bounding boxes
      page.setRotation(srcPage.getRotation());

      try {
        const mediaBox = srcPage.getMediaBox();
        if (mediaBox) page.setMediaBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
      } catch (_) {}

      try {
        const cropBox = srcPage.getCropBox();
        if (cropBox) page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      } catch (_) {}

      try {
        const bleedBox = srcPage.getBleedBox();
        if (bleedBox) page.setBleedBox(bleedBox.x, bleedBox.y, bleedBox.width, bleedBox.height);
      } catch (_) {}

      try {
        const trimBox = srcPage.getTrimBox();
        if (trimBox) page.setTrimBox(trimBox.x, trimBox.y, trimBox.width, trimBox.height);
      } catch (_) {}

      try {
        const artBox = srcPage.getArtBox();
        if (artBox) page.setArtBox(artBox.x, artBox.y, artBox.width, artBox.height);
      } catch (_) {}

      dstDoc.addPage(page);
    });
  };

  // Helper to transfer original metadata
  const transferMetadata = (srcDoc: PDFDocument, dstDoc: PDFDocument, partTag: string) => {
    try {
      const title = srcDoc.getTitle();
      if (title) dstDoc.setTitle(`${title} (${partTag})`);
      const author = srcDoc.getAuthor();
      if (author) dstDoc.setAuthor(author);
      const subject = srcDoc.getSubject();
      if (subject) dstDoc.setSubject(subject);
      const creator = srcDoc.getCreator();
      if (creator) dstDoc.setCreator(creator);
      const producer = srcDoc.getProducer();
      if (producer) dstDoc.setProducer(producer);
    } catch (_) {}
  };

  // Generate Odd Pages PDF (Part 1 - Fronts)
  const oddPdf = await PDFDocument.create();
  if (oddIndices.length > 0) {
    const copiedOddPages = await oddPdf.copyPages(srcPdf, oddIndices);
    transferPageProperties(srcPdf, oddPdf, copiedOddPages, oddIndices);
    transferMetadata(srcPdf, oddPdf, 'Front Pages - Part 1');
  }
  // Save with useObjectStreams: false for maximum raw vector & printer hardware compatibility
  const oddBytes = await oddPdf.save({ useObjectStreams: false, updateFieldAppearances: false });
  const oddBlob = new Blob([oddBytes as Uint8Array], { type: 'application/pdf' });
  const oddPagesUrl = URL.createObjectURL(oddBlob);

  // Generate Even Pages PDF (Part 2 - Backs)
  const finalEvenIndices = [...evenIndices];
  if (options.reverseEvenPages) {
    finalEvenIndices.reverse();
  }

  const evenPdf = await PDFDocument.create();
  if (finalEvenIndices.length > 0) {
    const copiedEvenPages = await evenPdf.copyPages(srcPdf, finalEvenIndices);
    transferPageProperties(srcPdf, evenPdf, copiedEvenPages, finalEvenIndices);
    transferMetadata(srcPdf, evenPdf, 'Back Pages - Part 2');
  }
  const evenBytes = await evenPdf.save({ useObjectStreams: false, updateFieldAppearances: false });
  const evenBlob = new Blob([evenBytes as Uint8Array], { type: 'application/pdf' });
  const evenPagesUrl = URL.createObjectURL(evenBlob);

  return {
    oddPagesBlob: oddBlob,
    oddPagesUrl,
    oddCount: oddIndices.length,
    oddPagesList,

    evenPagesBlob: evenBlob,
    evenPagesUrl,
    evenCount: evenIndices.length,
    evenPagesList,

    totalPages,
    fileName,
  };
}

/**
 * Renders all pages of a PDF Blob or ArrayBuffer to high-resolution PNG data URLs
 */
export async function renderPdfToImageUrls(source: Blob | ArrayBuffer): Promise<string[]> {
  let arrayBuffer: ArrayBuffer;
  if (source instanceof Blob) {
    arrayBuffer = await source.arrayBuffer();
  } else {
    arrayBuffer = source.slice(0);
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const imageUrls: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // 2.0x scale provides crisp 300 DPI printer quality
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas,
      }).promise;
      imageUrls.push(canvas.toDataURL('image/png'));
    }
  }

  return imageUrls;
}

/**
 * Opens a clean printable window/tab containing rendered PDF pages and a print trigger button
 */
export function openPrintableTab(imageUrls: string[], title: string = 'Print Document'): void {
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 16px;
          background-color: #0f172a;
          color: #f8fafc;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
        }
        .header {
          max-width: 480px;
          margin: 0 auto 20px auto;
          padding: 16px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        }
        .print-btn {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          border: none;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          width: 100%;
          margin-top: 12px;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .print-btn:active {
          transform: scale(0.98);
        }
        .page-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          overflow: hidden;
          margin: 0 auto 16px auto;
          max-width: 100%;
        }
        .page-img {
          width: 100%;
          height: auto;
          display: block;
        }
        @media print {
          .no-print { display: none !important; }
          html, body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .page-img {
            width: 100% !important;
            height: auto !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print header">
        <h3 style="margin:0 0 6px 0; font-size:18px;">🖨️ ${title}</h3>
        <p style="margin:0; font-size:13px; color:#cbd5e1;">
          Tap the button below to open your device printer dialog:
        </p>
        <button class="print-btn" onclick="window.print()">
          🖨️ Open Printer Dialog
        </button>
      </div>
      <div>
        ${imageUrls
          .map(
            (img, i) => `
          <div class="page-card">
            <img src="${img}" class="page-img" alt="Page ${i + 1}" />
          </div>
        `
          )
          .join('')}
      </div>
      <script>
        setTimeout(function() {
          try { window.print(); } catch(e) {}
        }, 300);
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

/**
 * Triggers native system printer dialog for Android Chrome and mobile/desktop browsers
 */
export async function printPdfBlob(
  blobUrl: string,
  blob?: Blob,
  title: string = 'Print Document'
): Promise<void> {
  try {
    let pdfSource: Blob | ArrayBuffer;
    if (blob) {
      pdfSource = blob;
    } else {
      const res = await fetch(blobUrl);
      pdfSource = await res.blob();
    }

    const imageUrls = await renderPdfToImageUrls(pdfSource);

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No printable pages found.');
    }

    const mountId = 'duplex-print-mount';
    const styleId = 'duplex-print-style';

    // Clean up any stale print mounts
    document.getElementById(mountId)?.remove();
    document.getElementById(styleId)?.remove();

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @media screen {
        #${mountId} {
          display: none !important;
        }
      }
      @media print {
        body > *:not(#${mountId}) {
          display: none !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
        #${mountId} {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .duplex-print-page-img {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        @page {
          margin: 0;
          size: auto;
        }
      }
    `;
    document.head.appendChild(styleEl);

    const mountDiv = document.createElement('div');
    mountDiv.id = mountId;

    imageUrls.forEach((imgUrl, index) => {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.className = 'duplex-print-page-img';
      img.alt = `Page ${index + 1}`;
      mountDiv.appendChild(img);
    });

    document.body.appendChild(mountDiv);

    // Give browser brief time to layout images
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanup = () => {
      setTimeout(() => {
        document.getElementById(mountId)?.remove();
        document.getElementById(styleId)?.remove();
      }, 1000);
    };

    window.addEventListener('afterprint', cleanup, { once: true });

    try {
      window.print();
    } catch (printErr) {
      console.error('window.print error:', printErr);
      cleanup();
      // Fallback: open printable window
      openPrintableTab(imageUrls, title);
    }
  } catch (err) {
    console.error('Failed to trigger native print:', err);
    // Ultimate fallback if PDF rendering fails
    window.open(blobUrl, '_blank');
  }
}

/**
 * Helper to open PDF in a new tab for native printing
 */
export async function openPdfInNewTab(
  blobUrl: string,
  blob?: Blob,
  title: string = 'PDF Document'
): Promise<void> {
  try {
    let pdfSource: Blob | ArrayBuffer;
    if (blob) {
      pdfSource = blob;
    } else {
      const res = await fetch(blobUrl);
      pdfSource = await res.blob();
    }
    const imageUrls = await renderPdfToImageUrls(pdfSource);
    openPrintableTab(imageUrls, title);
  } catch (err) {
    console.error('Failed to open printable tab:', err);
    window.open(blobUrl, '_blank');
  }
}

/**
 * Helper to download a PDF file blob
 */
export function downloadPdfBlob(blob: Blob, defaultFilename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

