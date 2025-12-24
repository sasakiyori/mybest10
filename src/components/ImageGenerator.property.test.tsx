/**
 * ImageGenerator Property Tests
 * 属性测试：图片导出格式正确性
 * Feature: book-best10-generator, Property 11: 图片导出格式正确性
 * Validates: Requirements 5.7
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { generateImage } from '../services/renderService';
import type { BookEntry, GeneratorConfig } from '../types/models';
import { DEFAULT_GENERATOR_CONFIG } from '../types/constants';

/**
 * 创建测试用的书籍条目
 */
function createTestBookEntry(rank: number): BookEntry {
  return {
    rank,
    bookName: `测试书籍 ${rank}`,
    selectedBook: {
      id: `book-${rank}`,
      title: `测试书籍 ${rank}`,
      author: ['测试作者'],
      publisher: '测试出版社',
      pubdate: '2024',
      coverUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      rating: 8.5,
      isbn: '1234567890',
    },
    isSearching: false,
  };
}

/**
 * 检测Blob的MIME类型
 */
async function detectBlobType(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer);
      
      // PNG magic number: 89 50 4E 47
      if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
        resolve('image/png');
        return;
      }
      
      // JPEG magic number: FF D8 FF
      if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
        resolve('image/jpeg');
        return;
      }
      
      resolve('unknown');
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob.slice(0, 4));
  });
}

/**
 * 将PNG Blob转换为JPEG Blob
 */
async function convertToJpeg(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 白色背景（JPEG不支持透明）
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (jpegBlob) => {
          URL.revokeObjectURL(url);
          if (jpegBlob) {
            resolve(jpegBlob);
          } else {
            reject(new Error('Failed to convert to JPEG'));
          }
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

describe('ImageGenerator Property Tests', () => {
  let createdUrls: string[] = [];

  beforeEach(() => {
    createdUrls = [];
  });

  afterEach(() => {
    // 清理所有创建的URL
    createdUrls.forEach(url => URL.revokeObjectURL(url));
    createdUrls = [];
  });

  /**
   * 属性 11: 图片导出格式正确性
   * 对于任何图片导出操作，系统应该能够生成用户指定格式（PNG或JPG）的图片文件，
   * 且文件可以被标准图片查看器正常打开。
   * Validates: Requirements 5.7
   */
  it('Property 11: PNG format export produces valid PNG files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (bookCount, title) => {
          // 创建测试数据
          const books: BookEntry[] = Array.from({ length: bookCount }, (_, i) =>
            createTestBookEntry(i + 1)
          );

          const config: GeneratorConfig = {
            ...DEFAULT_GENERATOR_CONFIG,
            title,
          };

          // 生成PNG图片
          const blob = await generateImage(books, config);

          // 验证Blob类型
          expect(blob.type).toBe('image/png');

          // 验证文件签名
          const detectedType = await detectBlobType(blob);
          expect(detectedType).toBe('image/png');

          // 验证可以创建有效的URL
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          expect(url).toMatch(/^blob:/);

          // 验证可以加载为图片
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              expect(img.width).toBeGreaterThan(0);
              expect(img.height).toBeGreaterThan(0);
              resolve();
            };
            img.onerror = () => reject(new Error('Failed to load PNG image'));
            img.src = url;
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('Property 11: JPEG format export produces valid JPEG files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (bookCount, title) => {
          // 创建测试数据
          const books: BookEntry[] = Array.from({ length: bookCount }, (_, i) =>
            createTestBookEntry(i + 1)
          );

          const config: GeneratorConfig = {
            ...DEFAULT_GENERATOR_CONFIG,
            title,
          };

          // 生成PNG图片
          const pngBlob = await generateImage(books, config);

          // 转换为JPEG
          const jpegBlob = await convertToJpeg(pngBlob);

          // 验证Blob类型
          expect(jpegBlob.type).toBe('image/jpeg');

          // 验证文件签名
          const detectedType = await detectBlobType(jpegBlob);
          expect(detectedType).toBe('image/jpeg');

          // 验证可以创建有效的URL
          const url = URL.createObjectURL(jpegBlob);
          createdUrls.push(url);
          expect(url).toMatch(/^blob:/);

          // 验证可以加载为图片
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              expect(img.width).toBeGreaterThan(0);
              expect(img.height).toBeGreaterThan(0);
              resolve();
            };
            img.onerror = () => reject(new Error('Failed to load JPEG image'));
            img.src = url;
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('Property 11: Both formats produce images with correct dimensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 800, max: 1200 }),
        fc.integer({ min: 1200, max: 1800 }),
        async (bookCount, width, height) => {
          // 创建测试数据
          const books: BookEntry[] = Array.from({ length: bookCount }, (_, i) =>
            createTestBookEntry(i + 1)
          );

          const config: GeneratorConfig = {
            ...DEFAULT_GENERATOR_CONFIG,
            layout: {
              ...DEFAULT_GENERATOR_CONFIG.layout,
              width,
              height,
            },
          };

          // 生成PNG图片
          const pngBlob = await generateImage(books, config);
          const pngUrl = URL.createObjectURL(pngBlob);
          createdUrls.push(pngUrl);

          // 验证PNG尺寸
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              expect(img.width).toBe(width);
              expect(img.height).toBe(height);
              resolve();
            };
            img.onerror = () => reject(new Error('Failed to load PNG'));
            img.src = pngUrl;
          });

          // 转换为JPEG并验证尺寸
          const jpegBlob = await convertToJpeg(pngBlob);
          const jpegUrl = URL.createObjectURL(jpegBlob);
          createdUrls.push(jpegUrl);

          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              expect(img.width).toBe(width);
              expect(img.height).toBe(height);
              resolve();
            };
            img.onerror = () => reject(new Error('Failed to load JPEG'));
            img.src = jpegUrl;
          });
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);
});
