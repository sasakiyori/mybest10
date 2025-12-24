/**
 * StorageService属性测试
 * 验证数据持久化的正确性
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  saveBest10List,
  loadBest10List,
  clearBest10List,
  saveConfig,
  loadConfig,
} from './storageService';
import type { Best10List, GeneratorConfig, BookEntry, DoubanBook } from '../types/models';

// 测试前清理LocalStorage
beforeEach(() => {
  localStorage.clear();
});

// 测试后清理LocalStorage
afterEach(() => {
  localStorage.clear();
});

// ===== Arbitraries (生成器) =====

/**
 * 生成随机DoubanBook
 */
const arbitraryDoubanBook = (): fc.Arbitrary<DoubanBook> =>
  fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    author: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
    publisher: fc.string({ minLength: 1 }),
    pubdate: fc.string({ minLength: 1 }),
    coverUrl: fc.webUrl(),
    coverLargeUrl: fc.option(fc.webUrl(), { nil: undefined }),
    rating: fc.double({ min: 0, max: 10, noNaN: true }),
    isbn: fc.string({ minLength: 1 }),
  });

/**
 * 生成随机BookEntry
 */
const arbitraryBookEntry = (): fc.Arbitrary<BookEntry> =>
  fc.record({
    rank: fc.integer({ min: 1, max: 10 }),
    bookName: fc.string({ minLength: 1 }),
    selectedBook: fc.option(arbitraryDoubanBook(), { nil: undefined }),
    customCover: fc.option(fc.webUrl(), { nil: undefined }),
    isSearching: fc.boolean(),
    searchResults: fc.option(fc.array(arbitraryDoubanBook()), { nil: undefined }),
  });

/**
 * 生成随机Best10List
 */
const arbitraryBest10List = (): fc.Arbitrary<Best10List> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1 }),
    books: fc.array(arbitraryBookEntry(), { minLength: 0, maxLength: 10 }),
    createdAt: fc.date({ noInvalidDate: true }),
    updatedAt: fc.date({ noInvalidDate: true }),
  });

/**
 * 生成随机GeneratorConfig
 */
const arbitraryGeneratorConfig = (): fc.Arbitrary<GeneratorConfig> =>
  fc.record({
    title: fc.string({ minLength: 1 }),
    subtitle: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    backgroundColor: fc.oneof(
      fc.constant('#FF0000'),
      fc.constant('#00FF00'),
      fc.constant('#0000FF'),
      fc.constant('#FFFF00'),
      fc.constant('#FF00FF'),
      fc.constant('#00FFFF')
    ),
    textColor: fc.oneof(
      fc.constant('#000000'),
      fc.constant('#FFFFFF'),
      fc.constant('#333333'),
      fc.constant('#666666')
    ),
    accentColor: fc.oneof(
      fc.constant('#FFD700'),
      fc.constant('#FF6347'),
      fc.constant('#4169E1')
    ),
    template: fc.constantFrom('classic', 'modern', 'minimal'),
    fontSize: fc.record({
      title: fc.integer({ min: 12, max: 72 }),
      rank: fc.integer({ min: 12, max: 72 }),
      bookName: fc.integer({ min: 12, max: 72 }),
    }),
    layout: fc.record({
      width: fc.integer({ min: 800, max: 2000 }),
      height: fc.integer({ min: 1000, max: 3000 }),
      padding: fc.integer({ min: 10, max: 100 }),
      spacing: fc.integer({ min: 5, max: 50 }),
    }),
  });

// ===== 属性测试 =====

describe('StorageService - Property Tests', () => {
  /**
   * 属性 1: 数据持久化往返一致性
   * 验证: 需求 1.2, 7.1, 7.2
   * 
   * Feature: book-best10-generator, Property 1: 数据持久化往返一致性
   */
  it('Property 1: Best10List round-trip consistency', () => {
    fc.assert(
      fc.property(arbitraryBest10List(), (originalList) => {
        // 保存数据
        saveBest10List(originalList);
        
        // 读取数据
        const loadedList = loadBest10List();
        
        // 验证数据不为null
        expect(loadedList).not.toBeNull();
        
        if (loadedList) {
          // 验证核心字段一致性
          expect(loadedList.id).toBe(originalList.id);
          expect(loadedList.name).toBe(originalList.name);
          expect(loadedList.books.length).toBe(originalList.books.length);
          
          // 验证日期字段（转换为时间戳比较）
          expect(loadedList.createdAt.getTime()).toBe(originalList.createdAt.getTime());
          expect(loadedList.updatedAt.getTime()).toBe(originalList.updatedAt.getTime());
          
          // 验证每个书籍条目
          loadedList.books.forEach((loadedBook, index) => {
            const originalBook = originalList.books[index];
            expect(loadedBook.rank).toBe(originalBook.rank);
            expect(loadedBook.bookName).toBe(originalBook.bookName);
            expect(loadedBook.isSearching).toBe(originalBook.isSearching);
            expect(loadedBook.customCover).toBe(originalBook.customCover);
            
            // 验证selectedBook
            if (originalBook.selectedBook) {
              expect(loadedBook.selectedBook).toBeDefined();
              expect(loadedBook.selectedBook?.id).toBe(originalBook.selectedBook.id);
              expect(loadedBook.selectedBook?.title).toBe(originalBook.selectedBook.title);
            } else {
              expect(loadedBook.selectedBook).toBeUndefined();
            }
          });
        }
        
        // 清理
        clearBest10List();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试: GeneratorConfig往返一致性
   */
  it('Property: GeneratorConfig round-trip consistency', () => {
    fc.assert(
      fc.property(arbitraryGeneratorConfig(), (originalConfig) => {
        // 保存配置
        saveConfig(originalConfig);
        
        // 读取配置
        const loadedConfig = loadConfig();
        
        // 验证配置不为null
        expect(loadedConfig).not.toBeNull();
        
        if (loadedConfig) {
          // 验证所有字段一致性
          expect(loadedConfig.title).toBe(originalConfig.title);
          expect(loadedConfig.subtitle).toBe(originalConfig.subtitle);
          expect(loadedConfig.backgroundColor).toBe(originalConfig.backgroundColor);
          expect(loadedConfig.textColor).toBe(originalConfig.textColor);
          expect(loadedConfig.accentColor).toBe(originalConfig.accentColor);
          expect(loadedConfig.template).toBe(originalConfig.template);
          
          // 验证嵌套对象
          expect(loadedConfig.fontSize).toEqual(originalConfig.fontSize);
          expect(loadedConfig.layout).toEqual(originalConfig.layout);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 2: Unicode字符输入支持
   * 验证: 需求 1.4
   * 
   * Feature: book-best10-generator, Property 2: Unicode字符输入支持
   */
  it('Property 2: Unicode character input support', () => {
    // 生成包含各种Unicode字符的书名
    const unicodeBookNameArbitrary = fc.oneof(
      // 中文书名
      fc.constantFrom(
        '红楼梦',
        '三体',
        '活着',
        '平凡的世界',
        '百年孤独',
        '追风筝的人',
        '解忧杂货店',
        '白夜行',
        '挪威的森林',
        '小王子'
      ),
      // 包含Emoji的书名
      fc.constantFrom(
        '📚 读书笔记',
        '✨ 星空物语',
        '🎉 庆祝时刻',
        '😊 快乐生活',
        '🌟 闪耀人生'
      ),
      // 混合字符
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.constantFrom('中文', '日本語', '한국어', ''),
        fc.constantFrom('😀', '📚', '✨', '')
      ).map(([en, asian, emoji]) => `${en} ${asian} ${emoji}`.trim())
    );

    fc.assert(
      fc.property(
        fc.array(unicodeBookNameArbitrary, { minLength: 1, maxLength: 10 }),
        (bookNames) => {
          // 创建包含Unicode字符的Best10List
          const list: Best10List = {
            id: 'test-unicode-id',
            name: 'Unicode测试列表📚',
            books: bookNames.map((name, index) => ({
              rank: index + 1,
              bookName: name,
              isSearching: false,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // 保存数据
          saveBest10List(list);

          // 读取数据
          const loadedList = loadBest10List();

          // 验证数据不为null
          expect(loadedList).not.toBeNull();

          if (loadedList) {
            // 验证列表名称（包含中文和emoji）
            expect(loadedList.name).toBe(list.name);

            // 验证每个书名都正确保存和读取
            loadedList.books.forEach((loadedBook, index) => {
              const originalBook = list.books[index];
              expect(loadedBook.bookName).toBe(originalBook.bookName);
              
              // 验证字符串长度一致（确保没有字符丢失）
              expect(loadedBook.bookName.length).toBe(originalBook.bookName.length);
            });
          }

          // 清理
          clearBest10List();
        }
      ),
      { numRuns: 100 }
    );
  });
});
