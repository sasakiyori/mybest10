/**
 * Best10Context 属性测试
 * Feature: book-best10-generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { Best10Provider, useBest10 } from './Best10Context';
import type { DoubanBook } from '../types/models';
import { VALIDATION_CONSTANTS } from '../types/constants';

/**
 * 创建测试用的DoubanBook生成器
 */
const arbitraryDoubanBook = (): fc.Arbitrary<DoubanBook> => {
  return fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    author: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
    publisher: fc.string({ minLength: 1 }),
    pubdate: fc.string({ minLength: 1 }),
    coverUrl: fc.webUrl(),
    coverLargeUrl: fc.option(fc.webUrl(), { nil: undefined }),
    rating: fc.float({ min: 0, max: 10 }),
    isbn: fc.string({ minLength: 10, maxLength: 13 }),
  });
};

/**
 * 操作类型
 */
type Operation = 
  | { type: 'select'; index: number; book: DoubanBook }
  | { type: 'remove'; index: number }
  | { type: 'reorder'; fromIndex: number; toIndex: number };

/**
 * 创建操作序列生成器
 */
const arbitraryOperations = (): fc.Arbitrary<Operation[]> => {
  const selectOp = fc.record({
    type: fc.constant('select' as const),
    index: fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
    book: arbitraryDoubanBook(),
  });

  const removeOp = fc.record({
    type: fc.constant('remove' as const),
    index: fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
  });

  const reorderOp = fc.record({
    type: fc.constant('reorder' as const),
    fromIndex: fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
    toIndex: fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
  });

  return fc.array(
    fc.oneof(selectOp, removeOp, reorderOp),
    { minLength: 1, maxLength: 20 }
  );
};

describe('Best10Context Property Tests', () => {
  beforeEach(() => {
    // 清空localStorage
    localStorage.clear();
  });

  /**
   * 属性 8: 排名顺序唯一性
   * 验证: 需求 6.3
   * 
   * 对于任何书籍列表操作（添加、删除、拖拽重排），
   * 排名序号（1-10）应该始终保持唯一且连续，
   * 不会出现重复、跳跃或超出范围。
   */
  it('Property 8: 排名顺序唯一性 - 生成随机操作序列验证排名唯一且连续', () => {
    fc.assert(
      fc.property(arbitraryOperations(), (operations) => {
        // 渲染hook
        const { result } = renderHook(() => useBest10(), {
          wrapper: Best10Provider,
        });

        // 执行操作序列
        act(() => {
          for (const op of operations) {
            switch (op.type) {
              case 'select':
                result.current.selectBook(op.index, op.book);
                break;
              case 'remove':
                result.current.removeBook(op.index);
                break;
              case 'reorder':
                result.current.reorderBooks(op.fromIndex, op.toIndex);
                break;
            }
          }
        });

        // 验证排名唯一性和连续性
        const books = result.current.books;
        const ranks = books.map(book => book.rank);

        // 1. 验证排名数量正确
        expect(ranks.length).toBe(VALIDATION_CONSTANTS.BOOK_COUNT);

        // 2. 验证排名唯一性（没有重复）
        const uniqueRanks = new Set(ranks);
        expect(uniqueRanks.size).toBe(VALIDATION_CONSTANTS.BOOK_COUNT);

        // 3. 验证排名连续性（1-10）
        const sortedRanks = [...ranks].sort((a, b) => a - b);
        for (let i = 0; i < VALIDATION_CONSTANTS.BOOK_COUNT; i++) {
          expect(sortedRanks[i]).toBe(i + 1);
        }

        // 4. 验证排名在有效范围内
        for (const rank of ranks) {
          expect(rank).toBeGreaterThanOrEqual(VALIDATION_CONSTANTS.MIN_RANK);
          expect(rank).toBeLessThanOrEqual(VALIDATION_CONSTANTS.MAX_RANK);
        }

        // 5. 验证rank与index的对应关系（rank应该等于index + 1）
        for (let i = 0; i < books.length; i++) {
          expect(books[i].rank).toBe(i + 1);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 额外测试：验证reorderBooks正确交换位置
   */
  it('Property: reorderBooks正确交换书籍位置并保持排名连续', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
        fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
        arbitraryDoubanBook(),
        arbitraryDoubanBook(),
        (fromIndex, toIndex, book1, book2) => {
          // 跳过相同索引的情况
          if (fromIndex === toIndex) {
            return true;
          }

          const { result } = renderHook(() => useBest10(), {
            wrapper: Best10Provider,
          });

          // 在两个位置选择不同的书
          act(() => {
            result.current.selectBook(fromIndex, book1);
            result.current.selectBook(toIndex, book2);
          });

          const booksBefore = result.current.books;
          const book1Before = booksBefore[fromIndex];
          const book2Before = booksBefore[toIndex];

          // 执行重排
          act(() => {
            result.current.reorderBooks(fromIndex, toIndex);
          });

          const booksAfter = result.current.books;

          // 验证书籍已交换
          expect(booksAfter[fromIndex].selectedBook?.id).toBe(book2Before.selectedBook?.id);
          expect(booksAfter[toIndex].selectedBook?.id).toBe(book1Before.selectedBook?.id);

          // 验证排名已更新
          expect(booksAfter[fromIndex].rank).toBe(fromIndex + 1);
          expect(booksAfter[toIndex].rank).toBe(toIndex + 1);

          // 验证所有排名仍然唯一且连续
          const ranks = booksAfter.map(b => b.rank);
          const uniqueRanks = new Set(ranks);
          expect(uniqueRanks.size).toBe(VALIDATION_CONSTANTS.BOOK_COUNT);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 额外测试：验证removeBook不影响排名连续性
   */
  it('Property: removeBook清空书籍但保持排名结构', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: VALIDATION_CONSTANTS.BOOK_COUNT - 1 }),
        arbitraryDoubanBook(),
        (index, book) => {
          const { result } = renderHook(() => useBest10(), {
            wrapper: Best10Provider,
          });

          // 选择一本书
          act(() => {
            result.current.selectBook(index, book);
          });

          // 移除书籍
          act(() => {
            result.current.removeBook(index);
          });

          const books = result.current.books;

          // 验证书籍已清空
          expect(books[index].bookName).toBe('');
          expect(books[index].selectedBook).toBeUndefined();

          // 验证排名仍然正确
          expect(books[index].rank).toBe(index + 1);

          // 验证所有排名仍然唯一且连续
          const ranks = books.map(b => b.rank);
          const uniqueRanks = new Set(ranks);
          expect(uniqueRanks.size).toBe(VALIDATION_CONSTANTS.BOOK_COUNT);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
