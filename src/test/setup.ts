/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createCanvas } from 'canvas';

// Setup Canvas for Node environment
beforeAll(() => {
  // Mock Image to auto-trigger onload
  class MockImage {
    onload: (() => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    src: string = '';
    width: number = 300;
    height: number = 400;

    constructor() {
      // Auto-trigger onload after src is set
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
      return createCanvas(800, 600) as any;
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

  // Mock URL if not available
  if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = vi.fn(() => 'mock-url');
    URL.revokeObjectURL = vi.fn();
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
