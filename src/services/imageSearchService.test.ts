/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 图片搜索服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchBookCoverImages, ImageSearchError } from './imageSearchService';

// Mock fetch
global.fetch = vi.fn();

// 创建一个模拟的图片 Blob（1x1 像素的 PNG）
const MOCK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const createMockImageBlob = () => {
  const binaryStr = atob(MOCK_IMAGE_BASE64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/png' });
};

// 辅助函数：创建支持图片下载的 mock
const createFetchMock = (apiResponses: Record<string, () => Promise<Response>>) => {
  return (url: string) => {
    // 检查是否是图片下载请求（通过图片代理）
    if (url.includes('weserv.nl') || 
        (url.includes('corsproxy.io') && (url.includes('.jpg') || url.includes('.png') || url.includes('covers.')))) {
      return Promise.resolve({
        ok: true,
        blob: async () => createMockImageBlob(),
      } as Response);
    }
    
    // 检查 API 响应
    for (const [pattern, handler] of Object.entries(apiResponses)) {
      if (url.includes(pattern)) {
        return handler();
      }
    }
    
    return Promise.reject(new Error('Not found'));
  };
};

describe('imageSearchService', () => {
  describe('searchBookCoverImages', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('应该在书名为空时抛出错误', async () => {
      await expect(searchBookCoverImages('')).rejects.toThrow(ImageSearchError);
      await expect(searchBookCoverImages('   ')).rejects.toThrow(ImageSearchError);
    });

    it('应该尝试多个图片来源', async () => {
      // Mock Google Books API响应
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'test-id',
              volumeInfo: {
                title: '三体',
                imageLinks: {
                  thumbnail: 'https://example.com/thumb.jpg',
                  large: 'https://example.com/large.jpg',
                },
              },
            },
          ],
        }),
      });

      // Mock其他API失败
      (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));
      (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));

      const results = await searchBookCoverImages('三体');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该处理所有API失败的情况', async () => {
      // Mock所有API失败
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const results = await searchBookCoverImages('测试书籍');
      
      // 应该返回模拟数据作为降级方案
      expect(results).toHaveLength(5);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('thumbnailUrl');
      expect(results[0]).toHaveProperty('imageUrl');
    });

    it('应该正确解析Google Books响应', async () => {
      (global.fetch as any).mockImplementation(createFetchMock({
        'googleapis.com': () => Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              {
                id: 'book-1',
                volumeInfo: {
                  title: '活着',
                  imageLinks: {
                    thumbnail: 'http://example.com/thumb.jpg',
                    medium: 'http://example.com/medium.jpg',
                  },
                },
              },
            ],
          }),
        } as Response),
      }));

      const results = await searchBookCoverImages('活着');
      
      const googleResult = results.find(r => r.source === 'Google Books');
      expect(googleResult).toBeDefined();
      // 图片应该已经转换为 Base64 Data URL
      expect(googleResult?.imageUrl).toMatch(/^data:image\//);
    });

    it('应该正确解析Open Library响应', async () => {
      (global.fetch as any).mockImplementation(createFetchMock({
        'openlibrary.org/search': () => Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              {
                title: '百年孤独',
                cover_i: 12345,
              },
            ],
          }),
        } as Response),
      }));

      const results = await searchBookCoverImages('百年孤独');
      
      const openLibResult = results.find(r => r.source === 'Open Library');
      expect(openLibResult).toBeDefined();
      // 图片应该已经转换为 Base64 Data URL
      expect(openLibResult?.imageUrl).toMatch(/^data:image\//);
    });

    it('应该处理特殊字符的书名', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const specialNames = [
        '《三体》',
        '活着！',
        '百年孤独？',
        'C++程序设计',
      ];

      for (const name of specialNames) {
        const results = await searchBookCoverImages(name);
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('应该合并多个来源的结果', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Google Books
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [
                {
                  id: 'google-1',
                  volumeInfo: {
                    title: '测试',
                    imageLinks: { thumbnail: 'https://google.com/1.jpg' },
                  },
                },
              ],
            }),
          });
        } else if (callCount === 2) {
          // Open Library
          return Promise.resolve({
            ok: true,
            json: async () => ({
              docs: [{ title: '测试', cover_i: 123 }],
            }),
          });
        }
        return Promise.reject(new Error('Failed'));
      });

      const results = await searchBookCoverImages('测试');
      
      // 应该有来自不同来源的结果
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('ImageSearchError', () => {
    it('应该创建带有用户友好消息的错误', () => {
      const error = new ImageSearchError('Technical error', '用户友好的错误消息');
      
      expect(error.message).toBe('Technical error');
      expect(error.getUserMessage()).toBe('用户友好的错误消息');
    });

    it('应该在没有用户友好消息时返回原始消息', () => {
      const error = new ImageSearchError('Error message');
      
      expect(error.getUserMessage()).toBe('Error message');
    });
  });
});
