/**
 * Integration Tests
 * 端到端集成测试，测试完整用户流程
 * 需求: 所有需求
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as doubanService from '../services/doubanService';
import type { DoubanBook } from '../types/models';

// Mock豆瓣服务
vi.mock('../services/doubanService');

describe('End-to-End Integration Tests', () => {
  const mockBooks: DoubanBook[] = [
    {
      id: '1',
      title: '测试书籍1',
      author: ['作者1'],
      publisher: '出版社1',
      pubdate: '2024-01',
      coverUrl: 'https://example.com/cover1.jpg',
      coverLargeUrl: 'https://example.com/cover1-large.jpg',
      rating: 8.5,
      isbn: '1234567890',
    },
    {
      id: '2',
      title: '测试书籍2',
      author: ['作者2'],
      publisher: '出版社2',
      pubdate: '2024-02',
      coverUrl: 'https://example.com/cover2.jpg',
      rating: 9.0,
      isbn: '0987654321',
    },
  ];

  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
    
    // 重置所有mocks
    vi.clearAllMocks();
    
    // Mock searchBooks
    vi.mocked(doubanService.searchBooks).mockResolvedValue(mockBooks);
  });

  describe('完整用户流程', () => {
    it('应该支持从输入到生成图片的完整流程', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 步骤1: 验证初始状态
      expect(screen.getByText('📚 书籍Best10生成器')).toBeInTheDocument();
      expect(screen.getByTestId('step-1')).toHaveClass('bg-blue-500');
      
      // 步骤2: 输入书名
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      // 验证步骤2激活
      await waitFor(() => {
        expect(screen.getByTestId('step-2')).toHaveClass('bg-blue-500');
      });

      // 步骤3: 点击搜索按钮
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      // 验证搜索弹窗打开
      await waitFor(() => {
        expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
      });

      // 步骤4: 选择书籍
      await waitFor(() => {
        expect(screen.getByTestId('book-result-1')).toBeInTheDocument();
      });
      
      const bookResult = screen.getByTestId('book-result-1');
      await user.click(bookResult);

      // 验证弹窗关闭
      await waitFor(() => {
        expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();
      });

      // 验证书籍被选中并显示在预览中
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // 验证步骤3激活
      expect(screen.getByTestId('step-3')).toHaveClass('bg-blue-500');

      // 步骤5: 验证生成按钮可用
      const generateButton = screen.getByText('生成图片');
      expect(generateButton).not.toBeDisabled();
    });

    it('应该支持多本书籍的选择和管理', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 添加第一本书
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '书籍1');
      await user.click(screen.getByTestId('search-button-0'));
      
      await waitFor(() => {
        expect(screen.getByTestId('book-result-1')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('book-result-1'));

      // 添加第二本书
      const secondInput = screen.getByTestId('book-input-1');
      await user.type(secondInput, '书籍2');
      await user.click(screen.getByTestId('search-button-1'));
      
      await waitFor(() => {
        expect(screen.getByTestId('book-result-2')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('book-result-2'));

      // 验证两本书都显示在预览中
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
        expect(screen.getByTestId('book-preview-item-1')).toBeInTheDocument();
      });

      // 验证显示已选择数量
      expect(screen.getByText(/已选择 2\/10 本书/)).toBeInTheDocument();
    });

    it('应该支持删除已选择的书籍', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 添加一本书
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      await user.click(screen.getByTestId('search-button-0'));
      
      await waitFor(() => {
        expect(screen.getByTestId('book-result-1')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('book-result-1'));

      // 验证书籍显示
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // 删除书籍
      const removeButton = screen.getByTestId('remove-button-0');
      await user.click(removeButton);

      // 验证书籍被删除
      await waitFor(() => {
        expect(screen.queryByTestId('book-preview-item-0')).not.toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('应该正确处理搜索失败', async () => {
      const user = userEvent.setup();
      
      // Mock搜索失败
      vi.mocked(doubanService.searchBooks).mockRejectedValue(
        new Error('网络错误')
      );

      render(<App />);

      // 输入并搜索
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      await user.click(screen.getByTestId('search-button-0'));

      // 验证错误提示显示
      await waitFor(() => {
        expect(screen.getByTestId('error-toast')).toBeInTheDocument();
      });
    });

    it('应该正确处理空搜索结果', async () => {
      const user = userEvent.setup();
      
      // Mock空结果
      vi.mocked(doubanService.searchBooks).mockResolvedValue([]);

      render(<App />);

      // 输入并搜索
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '不存在的书');
      await user.click(screen.getByTestId('search-button-0'));

      // 验证显示无结果提示
      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
      });
    });
  });

  describe('数据持久化', () => {
    it('应该自动保存用户选择', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 添加一本书
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      await user.click(screen.getByTestId('search-button-0'));
      
      await waitFor(() => {
        expect(screen.getByTestId('book-result-1')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('book-result-1'));

      // 等待保存
      await waitFor(() => {
        const saved = localStorage.getItem('best10_list');
        expect(saved).toBeTruthy();
      });

      // 验证保存的数据
      const savedData = JSON.parse(localStorage.getItem('best10_list') || '{}');
      expect(savedData.books).toBeDefined();
      expect(savedData.books[0].bookName).toBe('测试书籍');
    });

    it('应该在重新加载时恢复数据', async () => {
      // 预先保存数据
      const savedData = {
        id: 'test-list',
        name: 'Test List',
        books: [
          {
            rank: 1,
            bookName: '已保存的书籍',
            selectedBook: mockBooks[0],
            isSearching: false,
          },
          ...Array(9).fill(null).map((_, i) => ({
            rank: i + 2,
            bookName: '',
            isSearching: false,
          })),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('best10_list', JSON.stringify(savedData));

      // 渲染应用
      render(<App />);

      // 验证数据被恢复
      await waitFor(() => {
        const input = screen.getByTestId('book-input-0') as HTMLInputElement;
        expect(input.value).toBe('已保存的书籍');
      });

      // 验证书籍显示在预览中
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });
    });
  });

  describe('键盘快捷键', () => {
    it('应该支持ESC关闭弹窗', async () => {
      const user = userEvent.setup();
      render(<App />);

      // 打开搜索弹窗
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      await user.click(screen.getByTestId('search-button-0'));

      // 验证弹窗打开
      await waitFor(() => {
        expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
      });

      // 按ESC关闭
      await user.keyboard('{Escape}');

      // 验证弹窗关闭
      await waitFor(() => {
        expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();
      });
    });
  });

  describe('响应式设计', () => {
    it('应该在不同屏幕尺寸下正常工作', () => {
      render(<App />);

      // 验证主要区域存在
      expect(screen.getByText('输入书名')).toBeInTheDocument();
      expect(screen.getByText('生成图片')).toBeInTheDocument();
      
      // 验证响应式类名
      const mainContent = screen.getByText('输入书名').closest('.grid');
      expect(mainContent).toHaveClass('grid-cols-1');
    });
  });

  describe('清空功能', () => {
    it('应该支持清空所有书籍', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<App />);

      // 添加一本书
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      await user.click(screen.getByTestId('search-button-0'));
      
      await waitFor(() => {
        expect(screen.getByTestId('book-result-1')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('book-result-1'));

      // 验证书籍显示
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // 点击清空按钮
      const clearButton = screen.getByTestId('clear-all-button');
      await user.click(clearButton);

      // 验证所有输入框被清空
      await waitFor(() => {
        const input = screen.getByTestId('book-input-0') as HTMLInputElement;
        expect(input.value).toBe('');
      });

      // 验证预览区域为空
      expect(screen.queryByTestId('book-preview-item-0')).not.toBeInTheDocument();
    });
  });
});
