/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createCanvas, Image as CanvasImage } from 'canvas';

const dataUrlSizeMap = new Map<string, { width: number; height: number }>();

// Setup Canvas for Node environment
beforeAll(() => {
  // Mock Image compatible with node-canvas drawImage
  class MockImage extends CanvasImage {
    onload: (() => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    private _src: string = '';
    private hasSignaledLoad = false;

    constructor() {
      super();
      this.width = 300;
      this.height = 400;
    }

    set src(value: string) {
      this._src = value;

      if (value.startsWith('data:')) {
        const size = dataUrlSizeMap.get(value);
        if (size) {
          this.width = size.width;
          this.height = size.height;
        }

        try {
          super.src = value as unknown as string;
        } catch (error) {
          if (this.onerror) {
            this.onerror(error);
          }
        }

        this.signalLoad();
        return;
      }

      this.signalLoad();
    }

    get src() {
      return this._src;
    }

    private signalLoad() {
      if (this.hasSignaledLoad) {
        return;
      }

      this.hasSignaledLoad = true;
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  }

  (global as any).Image = MockImage;

  // Store original createElement
  const originalCreateElement = document.createElement.bind(document);

  // Override createElement to use canvas package for canvas elements
  document.createElement = function(tagName: string, options?: any) {
    if (tagName === 'canvas') {
      const canvas = createCanvas(800, 600) as any;

      if (!canvas.toBlob) {
        canvas.toBlob = (callback: (blob: Blob | null) => void, type?: string, quality?: number) => {
          try {
            const mimeType = type || 'image/png';
            let buffer: Buffer;

            if (mimeType === 'image/jpeg') {
              buffer = canvas.toBuffer('image/jpeg', {
                quality: typeof quality === 'number' ? quality : 0.92,
              });
            } else {
              buffer = canvas.toBuffer('image/png');
            }

            const blob = new Blob([buffer], { type: mimeType });
            (blob as any).__buffer = buffer;
            (blob as any).__width = canvas.width;
            (blob as any).__height = canvas.height;
            callback(blob);
          } catch {
            callback(null);
          }
        };
      }

      return canvas;
    }
    if (tagName === 'a') {
      const link = originalCreateElement(tagName, options);
      // Ensure click is a function
      if (!link.click) {
        link.click = vi.fn();
      }
      return link;
    }
    return originalCreateElement(tagName, options);
  };

  URL.createObjectURL = vi.fn((blob?: Blob) => {
    if (blob && (blob as any).__buffer) {
      const mimeType = blob.type || 'image/png';
      const base64 = (blob as any).__buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      if ((blob as any).__width && (blob as any).__height) {
        dataUrlSizeMap.set(dataUrl, {
          width: (blob as any).__width,
          height: (blob as any).__height,
        });
      }

      return dataUrl;
    }

    return 'mock-url';
  });

  URL.revokeObjectURL = vi.fn((url?: string) => {
    if (url) {
      dataUrlSizeMap.delete(url);
    }
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
