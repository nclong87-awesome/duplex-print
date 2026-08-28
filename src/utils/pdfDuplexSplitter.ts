import { PDFDocument } from 'pdf-lib';

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

  // Generate Odd Pages PDF
  const oddPdf = await PDFDocument.create();
  if (oddIndices.length > 0) {
    const copiedOddPages = await oddPdf.copyPages(srcPdf, oddIndices);
    copiedOddPages.forEach((page) => oddPdf.addPage(page));
  }
  const oddBytes = await oddPdf.save();
  const oddBlob = new Blob([oddBytes as Uint8Array], { type: 'application/pdf' });
  const oddPagesUrl = URL.createObjectURL(oddBlob);

  // Generate Even Pages PDF
  const finalEvenIndices = [...evenIndices];
  if (options.reverseEvenPages) {
    finalEvenIndices.reverse();
  }

  const evenPdf = await PDFDocument.create();
  if (finalEvenIndices.length > 0) {
    const copiedEvenPages = await evenPdf.copyPages(srcPdf, finalEvenIndices);
    copiedEvenPages.forEach((page) => evenPdf.addPage(page));
  }
  const evenBytes = await evenPdf.save();
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
 * Helper to trigger print dialog for a generated PDF blob
 */
export function printPdfBlob(blobUrl: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Direct print error:', err);
        // Fallback: open in new tab
        window.open(blobUrl, '_blank');
      }
    }, 300);
  };
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
