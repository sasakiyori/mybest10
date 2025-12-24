/**
 * 豆瓣API服务单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchBooks, getBookDetail, DoubanAPIError } from './doubanService';

describe('doubanService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('searchBooks', () => {
    it('应该成功搜索并返回书籍列表', async () => {
      // 需求: 2.2, 2.4, 9.5
      const mockResponse = {
        count: 2,
        start: 0,
        total: 2,
        books: [
          {
            id: '1',
            title: '测试书籍1',
            author: ['作者1'],
            publisher: '出版社1',
            pubdate: '2024-01',
            image: 'https://example.com/cover1.jpg',
            images: {
              small: 'https://example.com/cover1-small.jpg',
              medium: 'https://example.com/cover1-medium.jpg',
              large: 'https://example.com/cover1-large.jpg',
            },
            rating: {
              average: 8.5,
            },
            isbn13: '9781234567890',
          },
          {
            id: '2',
            title: '测试书籍2',
            author: ['作者2', '作者3'],
            publisher: '出版社2',
            pubdate: '2024-02',
            image: 'https://example.com/cover2.jpg',
            images: {
              medium: 'https://example.com/cover2-medium.jpg',
            },
            rating: {
              average: 9.0,
            },
            isbn10: '1234567890',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const results = await searchBooks('测试');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: '1',
        title: '测试书籍1',
        author: ['作者1'],
        publisher: '出版社1',
        pubdate: '2024-01',
        coverUrl: 'https://example.com/cover1-medium.jpg',
        coverLargeUrl: 'https://example.com/cover1-large.jpg',
        rating: 8.5,
        isbn: '9781234567890',
      });
      expect(results[1]).toMatchObject({
        id: '2',
        title: '测试书籍2',
        author: ['作者2', '作者3'],
        coverUrl: 'https://example.com/cover2-medium.jpg',
        isbn: '1234567890',
      });
    });

    it('应该正确处理空结果', async () => {
      // 需求: 2.4
      const mockResponse = {
        count: 0,
        start: 0,
        total: 0,
        books: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const results = await searchBooks('不存在的书');

      expect(results).toEqual([]);
    });

    it('应该正确解析API响应中的所有字段', async () => {
      // 需求: 9.5
      const mockResponse = {
        count: 1,
        start: 0,
        total: 1,
        books: [
          {
            id: 'test-id',
            title: '完整测试书籍',
            author: ['作者A', '作者B'],
            publisher: '测试出版社',
            pubdate: '2024-12',
            image: 'https://example.com/default.jpg',
            images: {
              small: 'https://example.com/small.jpg',
              medium: 'https://example.com/medium.jpg',
              large: 'https://example.com/large.jpg',
            },
            rating: {
              average: 7.8,
            },
            isbn13: '9780123456789',
            isbn10: '0123456789',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const results = await searchBooks('完整测试');

      expect(results).toHaveLength(1);
      const book = results[0];
      
      // 验证所有字段都被正确解析
      expect(book.id).toBe('test-id');
      expect(book.title).toBe('完整测试书籍');
      expect(book.author).toEqual(['作者A', '作者B']);
      expect(book.publisher).toBe('测试出版社');
      expect(book.pubdate).toBe('2024-12');
      expect(book.coverUrl).toBe('https://example.com/medium.jpg');
      expect(book.coverLargeUrl).toBe('https://example.com/large.jpg');
      expect(book.rating).toBe(7.8);
      expect(book.isbn).toBe('9780123456789');
    });

    it('应该处理缺失的可选字段', async () => {
      // 需求: 9.5
      const mockResponse = {
        count: 1,
        start: 0,
        total: 1,
        books: [
          {
            id: 'minimal-id',
            title: '最小书籍',
            author: [],
            publisher: '',
            pubdate: '',
            image: 'https://example.com/cover.jpg',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const results = await searchBooks('最小');

      expect(results).toHaveLength(1);
      const book = results[0];
      
      expect(book.id).toBe('minimal-id');
      expect(book.title).toBe('最小书籍');
      expect(book.author).toEqual([]);
      expect(book.publisher).toBe('');
      expect(book.pubdate).toBe('');
      expect(book.coverUrl).toBe('https://example.com/cover.jpg');
      expect(book.rating).toBe(0);
      expect(book.isbn).toBe('');
    });

    it('应该正确编码搜索查询', async () => {
      // 需求: 2.2
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, start: 0, total: 0, books: [] }),
      });

      await searchBooks('测试 书籍');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('测试 书籍')),
        expect.any(Object)
      );
    });

    it('应该在搜索前去除查询字符串的空格', async () => {
      // 需求: 2.2
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, start: 0, total: 0, books: [] }),
      });

      await searchBooks('  测试  ');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('测试')),
        expect.any(Object)
      );
    });

    it('应该拒绝空查询字符串', async () => {
      await expect(searchBooks('')).rejects.toThrow(DoubanAPIError);
      await expect(searchBooks('   ')).rejects.toThrow(DoubanAPIError);
    });

    it('应该处理404错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(searchBooks('测试')).rejects.toThrow(DoubanAPIError);
      await expect(searchBooks('测试')).rejects.toThrow('未找到相关书籍');
    });

    it('应该处理429限流错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(searchBooks('测试')).rejects.toThrow(DoubanAPIError);
      await expect(searchBooks('测试')).rejects.toThrow('请求过于频繁');
    });

    it('应该处理500服务器错误并重试', async () => {
      // 500错误会触发重试，最终抛出网络错误
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchBooks('测试')).rejects.toThrow(DoubanAPIError);
      // 验证进行了重试（1次初始 + 2次重试 = 3次）
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('getBookDetail', () => {
    it('应该成功获取书籍详情', async () => {
      // 需求: 2.2, 9.5
      const mockBook = {
        id: 'detail-id',
        title: '详情书籍',
        author: ['详情作者'],
        publisher: '详情出版社',
        pubdate: '2024-03',
        image: 'https://example.com/detail.jpg',
        images: {
          medium: 'https://example.com/detail-medium.jpg',
          large: 'https://example.com/detail-large.jpg',
        },
        rating: {
          average: 8.8,
        },
        isbn13: '9789876543210',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockBook,
      });

      const result = await getBookDetail('detail-id');

      expect(result).toMatchObject({
        id: 'detail-id',
        title: '详情书籍',
        author: ['详情作者'],
        publisher: '详情出版社',
        pubdate: '2024-03',
        coverUrl: 'https://example.com/detail-medium.jpg',
        coverLargeUrl: 'https://example.com/detail-large.jpg',
        rating: 8.8,
        isbn: '9789876543210',
      });
    });

    it('应该拒绝空ID', async () => {
      await expect(getBookDetail('')).rejects.toThrow(DoubanAPIError);
      await expect(getBookDetail('   ')).rejects.toThrow(DoubanAPIError);
    });

    it('应该处理404错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(getBookDetail('nonexistent')).rejects.toThrow(DoubanAPIError);
      await expect(getBookDetail('nonexistent')).rejects.toThrow('未找到相关书籍');
    });
  });
});
