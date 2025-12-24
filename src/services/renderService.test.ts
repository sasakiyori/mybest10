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

      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      downloadImage(blob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
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
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      await generateAndDownload(mockBooks, mockConfig, 'test.png', 'png');

      expect(mockLink.download).toBe('test.png');
      expect(mockLink.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it('should generate and download JPEG image', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      await generateAndDownload(mockBooks, mockConfig, 'test.png', 'jpeg');

      expect(mockLink.download).toBe('test.jpg');
      expect(mockLink.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it('should use default filename if not provided', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      await generateAndDownload(mockBooks, mockConfig);

      expect(mockLink.download).toBe('best10.png');
      expect(mockLink.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if canvas context is null', async () => {
      // Mock getContext to return null
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

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

      // Restore original getContext
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });
  });
});
