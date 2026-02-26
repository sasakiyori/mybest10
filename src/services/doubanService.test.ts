/**
 * 豆瓣服务单元测试（对齐当前 HTML 抓取 + CORS 代理实现）
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
    it('应该拒绝空查询', async () => {
      await expect(searchBooks('')).rejects.toThrow(DoubanAPIError);
      await expect(searchBooks('   ')).rejects.toThrow(DoubanAPIError);
    });

    it('应该通过代理抓取并解析 HTML 结果', async () => {
      const mockHtml = `
        <div class="result">
          <div class="pic">
            <a href="https://book.douban.com/subject/6518605/">
              <img src="https://img1.doubanio.com/view/subject/m/public/s2768378.jpg">
            </a>
          </div>
          <div class="title">
            <a>三体</a>
            <span class="subject-cast">刘慈欣 / 重庆出版社 / 2008-1</span>
            <span class="rating_nums">8.8</span>
          </div>
        </div>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockHtml,
      } as Response);

      const results = await searchBooks('三体');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toMatchObject({
        id: '6518605',
        title: '三体',
        author: ['刘慈欣'],
      });
      expect(results[0].rating).toBeGreaterThanOrEqual(0);
      expect(results[0].coverUrl).toContain('/m/');
      expect(results[0].coverLargeUrl).toContain('/l/');
    });

    it('应该在代理都失败时抛出统一错误', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network down'));

      await expect(searchBooks('测试')).rejects.toThrow(DoubanAPIError);
      await expect(searchBooks('测试')).rejects.toThrow('All CORS proxies failed');
    });

    it('应该在无可解析内容时返回空数组', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '<html><body>empty</body></html>',
      } as Response);

      const results = await searchBooks('不存在');
      expect(results).toEqual([]);
    });
  });

  describe('getBookDetail', () => {
    it('应该拒绝空 ID', async () => {
      await expect(getBookDetail('')).rejects.toThrow(DoubanAPIError);
      await expect(getBookDetail('   ')).rejects.toThrow(DoubanAPIError);
    });

    it('应该解析书籍详情页面', async () => {
      const detailHtml = `
        <span property="v:itemreviewed">活着</span>
        <a class="nbg" href="https://img1.doubanio.com/view/subject/l/public/s29053580.jpg"></a>
        <strong class="rating_num">9.4</strong>
        <span>作者</span> <a>余华</a>
        <span>出版社:</span> <a>作家出版社</a>
        <span>出版年:</span> 2012-8
        <span>ISBN:</span> 9787506365437
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => detailHtml,
      } as Response);

      const result = await getBookDetail('1003000');

      expect(result).toMatchObject({
        id: '1003000',
        title: '活着',
        author: ['余华'],
        publisher: '作家出版社',
        pubdate: '2012-8',
        rating: 9.4,
        isbn: '9787506365437',
      });
    });

    it('应该在详情解析失败时抛出业务错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '<html><body>invalid</body></html>',
      } as Response);

      await expect(getBookDetail('invalid')).rejects.toThrow(DoubanAPIError);
      await expect(getBookDetail('invalid')).rejects.toThrow('Failed to parse book detail');
    });
  });
});
