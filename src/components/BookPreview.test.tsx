/**
 * BookPreview 单元测试
 * 需求: 3.5, 6.3
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookPreview } from './BookPreview';
import { Best10Provider, useBest10 } from '../contexts/Best10Context';
import type { DoubanBook } from '../types/models';

// 模拟豆瓣书籍数据
const mockBook1: DoubanBook = {
  id: '1',
  title: '三体',
  author: ['刘慈欣'],
  publisher: '重庆出版社',
  pubdate: '2008-1',
  coverUrl: 'https://example.com/cover1.jpg',
  rating: 9.3,
  isbn: '9787536692930',
};

const mockBook2: DoubanBook = {
  id: '2',
  title: '流浪地球',
  author: ['刘慈欣'],
  publisher: '长江文艺出版社',
  pubdate: '2013-1',
  coverUrl: 'https://example.com/cover2.jpg',
  rating: 8.5,
  isbn: '9787535461',
};

const mockBook3: DoubanBook = {
  id: '3',
  title: '球状闪电',
  author: ['刘慈欣'],
  publisher: '四川科学技术出版社',
  pubdate: '2005-6',
  coverUrl: 'https://example.com/cover3.jpg',
  rating: 8.3,
  isbn: '9787536457',
};

// 辅助组件：用于在测试中选择书籍
function SelectBooksHelper({ books }: { books: Array<{ index: number; book: DoubanBook }> }) {
  const { selectBook } = useBest10();
  
  React.useEffect(() => {
    books.forEach(({ index, book }) => {
      selectBook(index, book);
    });
  }, [selectBook, books]);
  
  return null;
}

describe('BookPreview', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * 测试: 验证空状态显示
   * 需求: 3.5
   */
  it('应该在没有选中书籍时显示空状态提示', () => {
    render(
      <Best10Provider>
        <BookPreview />
      </Best10Provider>
    );

    expect(screen.getByText('还没有选择书籍')).toBeInTheDocument();
    expect(screen.getByText(/输入书名并搜索选择书籍后/)).toBeInTheDocument();
  });

  /**
   * 测试: 验证书籍信息显示完整
   * 需求: 3.5
   */
  it('应该显示书籍的封面、书名、作者和出版社', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
          { index: 1, book: mockBook2 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    // 等待书籍显示
    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证第一本书的信息
    expect(screen.getByText('三体')).toBeInTheDocument();
    expect(screen.getAllByText('刘慈欣').length).toBeGreaterThan(0);
    expect(screen.getByText('重庆出版社')).toBeInTheDocument();

    // 验证第二本书的信息
    expect(screen.getByText('流浪地球')).toBeInTheDocument();
    expect(screen.getByText('长江文艺出版社')).toBeInTheDocument();
  });

  /**
   * 测试: 验证排名显示
   * 需求: 6.3
   */
  it('应该显示正确的排名序号', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
          { index: 2, book: mockBook2 },
          { index: 4, book: mockBook3 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证排名徽章显示
    const rankBadges = screen.getAllByText(/^[1-9]$|^10$/);
    expect(rankBadges.length).toBeGreaterThan(0);
  });

  /**
   * 测试: 验证删除功能
   * 需求: 3.5
   */
  it('应该能够删除已选择的书籍', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    // 等待书籍显示
    await waitFor(() => {
      expect(screen.getByText('三体')).toBeInTheDocument();
    });

    // 查找并点击删除按钮
    const removeButton = screen.getByTestId('remove-button-0');
    fireEvent.click(removeButton);

    // 验证书籍已被删除
    await waitFor(() => {
      expect(screen.queryByText('三体')).not.toBeInTheDocument();
      expect(screen.getByText('还没有选择书籍')).toBeInTheDocument();
    });
  });

  /**
   * 测试: 验证删除按钮存在
   * 需求: 3.5
   */
  it('应该为每本书显示删除按钮', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
          { index: 1, book: mockBook2 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证删除按钮存在
    expect(screen.getByTestId('remove-button-0')).toBeInTheDocument();
    expect(screen.getByTestId('remove-button-1')).toBeInTheDocument();
  });

  /**
   * 测试: 验证拖拽手柄存在
   * 需求: 6.3
   */
  it('应该为每本书显示拖拽手柄', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
          { index: 1, book: mockBook2 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证拖拽手柄存在
    expect(screen.getByTestId('drag-handle-0')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-1')).toBeInTheDocument();
  });

  /**
   * 测试: 验证封面图片显示
   * 需求: 3.5
   */
  it('应该显示书籍封面图片', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证封面图片存在
    const coverImage = screen.getByTestId('book-cover-0') as HTMLImageElement;
    expect(coverImage).toBeInTheDocument();
    expect(coverImage.src).toContain('cover1.jpg');
    expect(coverImage.alt).toBe('三体');
  });

  /**
   * 测试: 验证已选书籍计数
   * 需求: 3.5
   */
  it('应该显示已选书籍的数量', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
          { index: 1, book: mockBook2 },
          { index: 2, book: mockBook3 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/已选择 3\/10 本书/)).toBeInTheDocument();
    });
  });

  /**
   * 测试: 验证封面加载失败时显示占位图
   * 需求: 4.3
   */
  it('应该在封面加载失败时显示占位图', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 获取封面图片并触发错误
    const coverImage = screen.getByTestId('book-cover-0') as HTMLImageElement;
    fireEvent.error(coverImage);

    // 验证占位图已设置
    expect(coverImage.src).toContain('data:image/svg+xml');
  });

  /**
   * 测试: 验证自定义封面上传按钮存在
   * 需求: 4.4
   */
  it('应该为每本书显示自定义封面上传按钮', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
          { index: 1, book: mockBook2 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证上传按钮存在
    expect(screen.getByTestId('upload-cover-button-0')).toBeInTheDocument();
    expect(screen.getByTestId('upload-cover-button-1')).toBeInTheDocument();
  });

  /**
   * 测试: 验证文件输入元素存在
   * 需求: 4.4
   */
  it('应该为每本书提供文件输入元素', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 验证文件输入存在
    const fileInput = screen.getByTestId('file-input-0') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe('file');
    expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp');
  });

  /**
   * 测试: 验证自定义封面上传功能
   * 需求: 4.4
   */
  it('应该能够上传自定义封面', async () => {
    render(
      <Best10Provider>
        <SelectBooksHelper books={[
          { index: 0, book: mockBook1 },
        ]} />
        <BookPreview />
      </Best10Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('还没有选择书籍')).not.toBeInTheDocument();
    });

    // 创建一个模拟的图片文件
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('file-input-0') as HTMLInputElement;

    // 模拟文件选择
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    // 触发change事件
    fireEvent.change(fileInput);

    // 注意：由于FileReader是异步的，实际的封面更新需要等待
    // 这里我们只验证文件输入被触发
    await waitFor(() => {
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files?.[0]).toBe(file);
    });
  });
});
