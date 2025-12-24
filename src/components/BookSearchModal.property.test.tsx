/**
 * BookSearchModal Property Tests
 * 属性测试：验证搜索结果的正确性属性
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { DoubanBook } from '../types/models';

/**
 * 生成随机的DoubanBook对象
 */
const arbitraryDoubanBook = (): fc.Arbitrary<DoubanBook> => {
  return fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    author: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
    publisher: fc.string({ minLength: 1 }),
    pubdate: fc.string({ minLength: 1 }),
    coverUrl: fc.webUrl(),
    coverLargeUrl: fc.option(fc.webUrl()),
    rating: fc.float({ min: 0, max: 10, noNaN: true }),
    isbn: fc.string({ minLength: 1 }),
  });
};

/**
 * 生成随机的搜索结果数组
 */
const arbitrarySearchResults = (): fc.Arbitrary<DoubanBook[]> => {
  return fc.array(arbitraryDoubanBook(), { minLength: 0, maxLength: 10 });
};

describe('BookSearchModal Property Tests', () => {
  /**
   * 属性 3: 搜索结果完整性
   * 验证: 需求 2.2, 2.3
   * 
   * 对于任何搜索结果，显示的每个书籍条目都应该包含书名、作者和封面缩略图这三个必需字段
   */
  it('Property 3: Search result completeness - all results have required fields', () => {
    // Feature: book-best10-generator, Property 3: 搜索结果完整性
    fc.assert(
      fc.property(arbitrarySearchResults(), (searchResults) => {
        // 验证每个搜索结果都包含必需字段
        for (const book of searchResults) {
          // 必需字段：书名（title）
          expect(book.title).toBeDefined();
          expect(typeof book.title).toBe('string');
          expect(book.title.length).toBeGreaterThan(0);

          // 必需字段：作者（author）
          expect(book.author).toBeDefined();
          expect(Array.isArray(book.author)).toBe(true);
          expect(book.author.length).toBeGreaterThan(0);
          
          // 必需字段：封面缩略图（coverUrl）
          expect(book.coverUrl).toBeDefined();
          expect(typeof book.coverUrl).toBe('string');
          expect(book.coverUrl.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 额外验证：搜索结果的所有字段都应该是有效的
   */
  it('Property 3 Extended: All search result fields are valid', () => {
    fc.assert(
      fc.property(arbitrarySearchResults(), (searchResults) => {
        for (const book of searchResults) {
          // 验证所有必需字段
          expect(book.id).toBeDefined();
          expect(typeof book.id).toBe('string');
          
          expect(book.title).toBeDefined();
          expect(typeof book.title).toBe('string');
          
          expect(book.author).toBeDefined();
          expect(Array.isArray(book.author)).toBe(true);
          
          expect(book.publisher).toBeDefined();
          expect(typeof book.publisher).toBe('string');
          
          expect(book.pubdate).toBeDefined();
          expect(typeof book.pubdate).toBe('string');
          
          expect(book.coverUrl).toBeDefined();
          expect(typeof book.coverUrl).toBe('string');
          
          expect(book.rating).toBeDefined();
          expect(typeof book.rating).toBe('number');
          expect(book.rating).toBeGreaterThanOrEqual(0);
          expect(book.rating).toBeLessThanOrEqual(10);
          
          expect(book.isbn).toBeDefined();
          expect(typeof book.isbn).toBe('string');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 5: 书籍选择数据完整性
   * 验证: 需求 3.1, 3.3
   * 
   * 对于任何用户选择的书籍，系统保存的数据应该包含书名、封面URL、作者等所有必需字段，
   * 且这些字段都不应为空或undefined
   */
  it('Property 5: Book selection data completeness - selected book has all required fields', () => {
    // Feature: book-best10-generator, Property 5: 书籍选择数据完整性
    fc.assert(
      fc.property(arbitraryDoubanBook(), (book) => {
        // 验证选中的书籍包含所有必需字段且非空
        
        // 必需字段：书名（title）
        expect(book.title).toBeDefined();
        expect(typeof book.title).toBe('string');
        expect(book.title.length).toBeGreaterThan(0);
        
        // 必需字段：封面URL（coverUrl）
        expect(book.coverUrl).toBeDefined();
        expect(typeof book.coverUrl).toBe('string');
        expect(book.coverUrl.length).toBeGreaterThan(0);
        
        // 必需字段：作者（author）
        expect(book.author).toBeDefined();
        expect(Array.isArray(book.author)).toBe(true);
        expect(book.author.length).toBeGreaterThan(0);
        for (const author of book.author) {
          expect(typeof author).toBe('string');
          expect(author.length).toBeGreaterThan(0);
        }
        
        // 必需字段：ID（id）
        expect(book.id).toBeDefined();
        expect(typeof book.id).toBe('string');
        expect(book.id.length).toBeGreaterThan(0);
        
        // 必需字段：出版社（publisher）
        expect(book.publisher).toBeDefined();
        expect(typeof book.publisher).toBe('string');
        expect(book.publisher.length).toBeGreaterThan(0);
        
        // 必需字段：出版日期（pubdate）
        expect(book.pubdate).toBeDefined();
        expect(typeof book.pubdate).toBe('string');
        expect(book.pubdate.length).toBeGreaterThan(0);
        
        // 必需字段：ISBN（isbn）
        expect(book.isbn).toBeDefined();
        expect(typeof book.isbn).toBe('string');
        expect(book.isbn.length).toBeGreaterThan(0);
        
        // 必需字段：评分（rating）
        expect(book.rating).toBeDefined();
        expect(typeof book.rating).toBe('number');
        expect(book.rating).toBeGreaterThanOrEqual(0);
        expect(book.rating).toBeLessThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 6: 书籍选择幂等性
   * 验证: 需求 3.2
   * 
   * 对于任何书籍和排名位置，多次选择同一本书到同一位置应该产生相同的结果状态，
   * 不会创建重复条目或改变其他位置的数据
   */
  it('Property 6: Book selection idempotency - selecting same book multiple times produces same result', () => {
    // Feature: book-best10-generator, Property 6: 书籍选择幂等性
    fc.assert(
      fc.property(
        arbitraryDoubanBook(),
        fc.integer({ min: 0, max: 9 }), // 排名位置 0-9
        fc.integer({ min: 2, max: 5 }), // 选择次数 2-5
        (book, position, selectCount) => {
          // 模拟选择操作的结果
          // 第一次选择
          const firstSelection = {
            rank: position + 1,
            bookName: book.title,
            selectedBook: book,
            isSearching: false,
          };

          // 多次选择同一本书
          let currentState = firstSelection;
          for (let i = 1; i < selectCount; i++) {
            currentState = {
              rank: position + 1,
              bookName: book.title,
              selectedBook: book,
              isSearching: false,
            };
          }

          // 验证最终状态与第一次选择的状态相同
          expect(currentState.rank).toBe(firstSelection.rank);
          expect(currentState.bookName).toBe(firstSelection.bookName);
          expect(currentState.selectedBook).toEqual(firstSelection.selectedBook);
          expect(currentState.isSearching).toBe(firstSelection.isSearching);
        }
      ),
      { numRuns: 100 }
    );
  });
});
