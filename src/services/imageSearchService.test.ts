/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 图片搜索服务测试（对齐当前后端优先 + 回退策略）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchBookCoverImages, ImageSearchError } from './imageSearchService';

describe('imageSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('searchBookCoverImages', () => {
    it('应该在书名为空时抛出错误', async () => {
      await expect(searchBookCoverImages('')).rejects.toThrow(ImageSearchError);
      await expect(searchBookCoverImages('   ')).rejects.toThrow(ImageSearchError);
    });

    it('后端可用时应优先返回后端结果', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/health')) {
          return Promise.resolve({ ok: true } as Response);
        }

        if (url.includes('/api/search-images')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              results: [
                {
                  id: 'backend-1',
                  thumbnailUrl: '/img/t1.jpg',
                  imageUrl: '/img/i1.jpg',
                  title: '三体封面',
                  source: 'backend',
                },
              ],
            }),
          } as Response);
        }

        return Promise.reject(new Error('unexpected call'));
      });

      const results = await searchBookCoverImages('三体');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('backend-1');
      expect(results[0].thumbnailUrl).toContain('http://localhost:3001');
      expect(results[0].imageUrl).toContain('http://localhost:3001');
    });

    it('后端不可用且代理失败时应回退到模拟数据', async () => {
      (global.fetch as any).mockRejectedValue(new Error('network error'));

      const results = await searchBookCoverImages('测试书籍');

      expect(results).toHaveLength(5);
      expect(results[0].source).toBe('模拟数据');
      expect(results[0].imageUrl).toMatch(/^data:image\//);
    });

    it('后端不可用时可通过 CORS 回退方案获得百度结果', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/health')) {
          return Promise.reject(new Error('backend down'));
        }

        if (url.includes('api.allorigins.win/get?url=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              contents: '"thumbURL":"https://a.example.com/t.jpg","middleURL":"https://a.example.com/m.jpg"',
            }),
          } as Response);
        }

        return Promise.reject(new Error('unexpected call'));
      });

      const results = await searchBookCoverImages('活着');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toBe('百度图片');
      expect(results[0].thumbnailUrl).toContain('https://');
      expect(results[0].imageUrl).toContain('https://');
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
