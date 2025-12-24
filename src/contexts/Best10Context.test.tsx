/**
 * Best10Context 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Best10Provider, useBest10 } from './Best10Context';
import { VALIDATION_CONSTANTS, DEFAULT_GENERATOR_CONFIG } from '../types/constants';
import type { DoubanBook } from '../types/models';

describe('Best10Context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应该初始化10个空的书籍条目', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    expect(result.current.books).toHaveLength(VALIDATION_CONSTANTS.BOOK_COUNT);
    
    result.current.books.forEach((book, index) => {
      expect(book.rank).toBe(index + 1);
      expect(book.bookName).toBe('');
      expect(book.isSearching).toBe(false);
      expect(book.selectedBook).toBeUndefined();
    });
  });

  it('应该使用默认配置初始化', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    expect(result.current.config).toEqual(DEFAULT_GENERATOR_CONFIG);
  });

  it('应该更新书名', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    act(() => {
      result.current.updateBookName(0, '测试书名');
    });

    expect(result.current.books[0].bookName).toBe('测试书名');
    expect(result.current.books[0].rank).toBe(1);
  });

  it('应该选择书籍', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const mockBook: DoubanBook = {
      id: '123',
      title: '测试书籍',
      author: ['作者1'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/cover.jpg',
      rating: 8.5,
      isbn: '1234567890',
    };

    act(() => {
      result.current.selectBook(0, mockBook);
    });

    expect(result.current.books[0].selectedBook).toEqual(mockBook);
    expect(result.current.books[0].bookName).toBe('测试书籍');
    expect(result.current.books[0].isSearching).toBe(false);
  });

  it('应该移除书籍', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const mockBook: DoubanBook = {
      id: '123',
      title: '测试书籍',
      author: ['作者1'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/cover.jpg',
      rating: 8.5,
      isbn: '1234567890',
    };

    act(() => {
      result.current.selectBook(0, mockBook);
    });

    expect(result.current.books[0].selectedBook).toBeDefined();

    act(() => {
      result.current.removeBook(0);
    });

    expect(result.current.books[0].bookName).toBe('');
    expect(result.current.books[0].selectedBook).toBeUndefined();
    expect(result.current.books[0].rank).toBe(1); // rank保持不变
  });

  it('应该重新排序书籍', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const book1: DoubanBook = {
      id: '1',
      title: '书籍1',
      author: ['作者1'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/1.jpg',
      rating: 8.5,
      isbn: '1234567890',
    };

    const book2: DoubanBook = {
      id: '2',
      title: '书籍2',
      author: ['作者2'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/2.jpg',
      rating: 9.0,
      isbn: '0987654321',
    };

    act(() => {
      result.current.selectBook(0, book1);
      result.current.selectBook(1, book2);
    });

    expect(result.current.books[0].selectedBook?.id).toBe('1');
    expect(result.current.books[1].selectedBook?.id).toBe('2');

    act(() => {
      result.current.reorderBooks(0, 1);
    });

    // 书籍已交换
    expect(result.current.books[0].selectedBook?.id).toBe('2');
    expect(result.current.books[1].selectedBook?.id).toBe('1');
    
    // rank已更新
    expect(result.current.books[0].rank).toBe(1);
    expect(result.current.books[1].rank).toBe(2);
  });

  it('应该更新配置', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    act(() => {
      result.current.updateConfig({
        title: '新标题',
        backgroundColor: '#000000',
      });
    });

    expect(result.current.config.title).toBe('新标题');
    expect(result.current.config.backgroundColor).toBe('#000000');
    // 其他配置保持不变
    expect(result.current.config.textColor).toBe(DEFAULT_GENERATOR_CONFIG.textColor);
  });

  it('应该设置搜索状态', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    act(() => {
      result.current.setSearching(0, true);
    });

    expect(result.current.books[0].isSearching).toBe(true);

    act(() => {
      result.current.setSearching(0, false);
    });

    expect(result.current.books[0].isSearching).toBe(false);
  });

  it('应该设置搜索结果', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const mockResults: DoubanBook[] = [
      {
        id: '1',
        title: '结果1',
        author: ['作者1'],
        publisher: '出版社',
        pubdate: '2024',
        coverUrl: 'http://example.com/1.jpg',
        rating: 8.5,
        isbn: '1234567890',
      },
    ];

    act(() => {
      result.current.setSearchResults(0, mockResults);
    });

    expect(result.current.books[0].searchResults).toEqual(mockResults);
  });

  it('应该清空所有书籍', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const mockBook: DoubanBook = {
      id: '123',
      title: '测试书籍',
      author: ['作者1'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/cover.jpg',
      rating: 8.5,
      isbn: '1234567890',
    };

    act(() => {
      result.current.selectBook(0, mockBook);
      result.current.selectBook(1, mockBook);
    });

    expect(result.current.books[0].selectedBook).toBeDefined();
    expect(result.current.books[1].selectedBook).toBeDefined();

    act(() => {
      result.current.clearAllBooks();
    });

    result.current.books.forEach((book, index) => {
      expect(book.rank).toBe(index + 1);
      expect(book.bookName).toBe('');
      expect(book.selectedBook).toBeUndefined();
    });
  });

  it('应该设置当前搜索索引', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    expect(result.current.currentSearchIndex).toBeNull();

    act(() => {
      result.current.setCurrentSearchIndex(3);
    });

    expect(result.current.currentSearchIndex).toBe(3);

    act(() => {
      result.current.setCurrentSearchIndex(null);
    });

    expect(result.current.currentSearchIndex).toBeNull();
  });

  it('应该设置错误信息', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    expect(result.current.error).toBeNull();

    act(() => {
      result.current.setError('测试错误');
    });

    expect(result.current.error).toBe('测试错误');

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });

  it('应该设置加载状态', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('应该在无效索引时不更新书名', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const booksBefore = [...result.current.books];

    act(() => {
      result.current.updateBookName(-1, '无效');
      result.current.updateBookName(10, '无效');
    });

    expect(result.current.books).toEqual(booksBefore);
  });

  it('应该在无效索引时不选择书籍', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const mockBook: DoubanBook = {
      id: '123',
      title: '测试书籍',
      author: ['作者1'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/cover.jpg',
      rating: 8.5,
      isbn: '1234567890',
    };

    const booksBefore = [...result.current.books];

    act(() => {
      result.current.selectBook(-1, mockBook);
      result.current.selectBook(10, mockBook);
    });

    expect(result.current.books).toEqual(booksBefore);
  });

  it('应该在相同索引时不重新排序', () => {
    const { result } = renderHook(() => useBest10(), {
      wrapper: Best10Provider,
    });

    const mockBook: DoubanBook = {
      id: '123',
      title: '测试书籍',
      author: ['作者1'],
      publisher: '出版社',
      pubdate: '2024',
      coverUrl: 'http://example.com/cover.jpg',
      rating: 8.5,
      isbn: '1234567890',
    };

    act(() => {
      result.current.selectBook(0, mockBook);
    });

    const booksBefore = [...result.current.books];

    act(() => {
      result.current.reorderBooks(0, 0);
    });

    expect(result.current.books).toEqual(booksBefore);
  });
});
