/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 单元测试：renderService
 * 测试图片预加载、下载功能和错误处理
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { preloadImages, downloadImage, generateImage, generateAndDownload } from './renderService';
import type { BookEntry, GeneratorConfig } from '../types/models';
import { DEFAULT_GENERATOR_CONFIG } from '../types/constants';

afterEach(() => {
  vi.clearAllMocks();
});

describe('RenderService Unit Tests', () => {
  describe('preloadImages', () => {
    it('should preload valid image URLs', async () => {
      const urls = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ];

      const images = await preloadImages(urls);
      
      expect(images).toHaveLength(1);
      expect(images[0]).toBeDefined();
    });

    it('should handle empty URL array', async () => {
      const images = await preloadImages([]);
      
      expect(images).toHaveLength(0);
    });

    it('should handle multiple URLs', async () => {
      const urls = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ];

      const images = await preloadImages(urls);
      
      expect(images).toHaveLength(3);
    });
  });

  describe('downloadImage', () => {
    it('should create download link and trigger download', () => {
      const blob = new Blob(['test data'], { type: 'image/png' });
      const filename = 'test-image.png';

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      downloadImage(blob, filename);

      expect(clickSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('generateImage', () => {
    const mockConfig: GeneratorConfig = {
      ...DEFAULT_GENERATOR_CONFIG,
      title: '测试标题',
    };

    const mockBooks: BookEntry[] = [
      {
        rank: 1,
        bookName: '三体',
        selectedBook: {
          id: '1',
          title: '三体',
          author: ['刘慈欣'],
          publisher: '重庆出版社',
          pubdate: '2008-01',
          coverUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          rating: 9.3,
          isbn: '9787536692930',
        },
        isSearching: false,
      },
    ];

    it('should generate image blob', async () => {
      const blob = await generateImage(mockBooks, mockConfig);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle books with custom covers', async () => {
      const booksWithCustomCover: BookEntry[] = [
        {
          rank: 1,
          bookName: '自定义书籍',
          customCover: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          isSearching: false,
        },
      ];

      const blob = await generateImage(booksWithCustomCover, mockConfig);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should handle empty book list', async () => {
      const blob = await generateImage([], mockConfig);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should handle books without covers', async () => {
      const booksWithoutCovers: BookEntry[] = [
        {
          rank: 1,
          bookName: '无封面书籍',
          isSearching: false,
        },
      ];

      const blob = await generateImage(booksWithoutCovers, mockConfig);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should handle config with subtitle', async () => {
      const configWithSubtitle: GeneratorConfig = {
        ...mockConfig,
        subtitle: '2024年度推荐',
      };

      const blob = await generateImage(mockBooks, configWithSubtitle);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });
  });

  describe('generateAndDownload', () => {
    const mockConfig: GeneratorConfig = {
      ...DEFAULT_GENERATOR_CONFIG,
      title: '测试标题',
    };

    const mockBooks: BookEntry[] = [
      {
        rank: 1,
        bookName: '三体',
        selectedBook: {
          id: '1',
          title: '三体',
          author: ['刘慈欣'],
          publisher: '重庆出版社',
          pubdate: '2008-01',
          coverUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          rating: 9.3,
          isbn: '9787536692930',
        },
        isSearching: false,
      },
    ];

    it('should generate and download PNG image', async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      await generateAndDownload(mockBooks, mockConfig, 'test.png', 'png');

      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });

    it('should generate and download JPEG image', async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      await generateAndDownload(mockBooks, mockConfig, 'test.png', 'jpeg');

      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });

    it('should use default filename if not provided', async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      await generateAndDownload(mockBooks, mockConfig);

      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if canvas context is null', async () => {
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        if (tagName === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => null,
          } as any;
        }
        return originalCreateElement(tagName, options);
      }) as typeof document.createElement);

      const mockConfig: GeneratorConfig = {
        ...DEFAULT_GENERATOR_CONFIG,
        title: '测试标题',
      };

      const mockBooks: BookEntry[] = [
        {
          rank: 1,
          bookName: '三体',
          selectedBook: {
            id: '1',
            title: '三体',
            author: ['刘慈欣'],
            publisher: '重庆出版社',
            pubdate: '2008-01',
            coverUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            rating: 9.3,
            isbn: '9787536692930',
          },
          isSearching: false,
        },
      ];

      await expect(generateImage(mockBooks, mockConfig)).rejects.toThrow('Failed to get canvas context');

      createElementSpy.mockRestore();
    });
  });
});
