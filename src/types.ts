export interface PdfDocumentItem {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  pageCount?: number;
  arrayBuffer: ArrayBuffer;
  objectUrl?: string;
}

export type ViewMode = 'canvas' | 'native';
export type DisplayMode = 'single' | 'continuous';

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  displayMode: DisplayMode;
  viewMode: ViewMode;
}
