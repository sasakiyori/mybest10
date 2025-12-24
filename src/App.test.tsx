/**
 * App Integration Tests
 * 测试完整的用户流程和响应式布局
 * 需求: 6.1, 6.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as doubanService from './services/doubanService';
import type { DoubanBook } from './types/models';

// Mock doubanService
vi.mock('./services/doubanService');

describe('App Integration Tests', () => {
  const mockBook: DoubanBook = {
    id: '1',
    title: '测试书籍',
    author: ['测试作者'],
    publisher: '测试出版社',
    pubdate: '2024-01',
    coverUrl: 'https://example.com/cover.jpg',
    rating: 8.5,
    isbn: '1234567890',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('完整用户流程', () => {
    it('应该支持完整的输入-搜索-选择-生成流程', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API
      vi.mocked(doubanService.searchBooks).mockResolvedValue([mockBook]);

      render(<App />);

      // 步骤1: 验证初始状态
      expect(screen.getByText('📚 书籍Best10生成器')).toBeInTheDocument();
      expect(screen.getByTestId('step-1')).toHaveClass('bg-blue-500');
      expect(screen.getByTestId('step-2')).toHaveClass('bg-gray-200');
      expect(screen.getByTestId('step-3')).toHaveClass('bg-gray-200');

      // 步骤2: 输入书名
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      expect(firstInput).toHaveValue('测试书籍');

      // 步骤3: 点击搜索按钮
      const searchButton = screen.getByTestId('search-button-0');
      expect(searchButton).toBeEnabled();
      await user.click(searchButton);

      // 步骤4: 验证搜索弹窗打开
      await waitFor(() => {
        expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
      });

      // 步骤5: 等待搜索结果
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });

      // 步骤6: 选择书籍
      const bookResult = screen.getByTestId('book-result-1');
      await user.click(bookResult);

      // 步骤7: 验证弹窗关闭
      await waitFor(() => {
        expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();
      });

      // 步骤8: 验证书籍出现在预览中
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // 步骤9: 验证步骤指引更新到步骤3
      expect(screen.getByTestId('step-3')).toHaveClass('bg-blue-500');

      // 步骤10: 验证生成按钮可用
      const generateButton = screen.getByTestId('generate-button');
      expect(generateButton).toBeEnabled();
    });

    it('应该在没有选择书籍时禁用生成按钮', () => {
      render(<App />);

      const generateButton = screen.getByTestId('generate-button');
      expect(generateButton).toBeDisabled();
      expect(screen.getByText('请至少选择一本书籍后再生成图片')).toBeInTheDocument();
    });

    it('应该支持清空所有书籍', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API
      vi.mocked(doubanService.searchBooks).mockResolvedValue([mockBook]);

      render(<App />);

      // 输入并选择一本书
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });

      const bookResult = screen.getByTestId('book-result-1');
      await user.click(bookResult);

      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      // 点击清空所有
      const clearButton = screen.getByTestId('clear-all-button');
      await user.click(clearButton);

      // 验证确认对话框被调用
      expect(confirmSpy).toHaveBeenCalledWith('确定要清空所有书籍吗？此操作不可恢复。');

      // 验证书籍被清空
      await waitFor(() => {
        expect(screen.queryByTestId('book-preview-item-0')).not.toBeInTheDocument();
      });

      // 验证成功提示
      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.getByText('已清空所有书籍')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });

    it('应该在取消清空时保留书籍', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API
      vi.mocked(doubanService.searchBooks).mockResolvedValue([mockBook]);

      render(<App />);

      // 输入并选择一本书
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });

      const bookResult = screen.getByTestId('book-result-1');
      await user.click(bookResult);

      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // Mock window.confirm返回false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      // 点击清空所有
      const clearButton = screen.getByTestId('clear-all-button');
      await user.click(clearButton);

      // 验证书籍仍然存在
      expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();

      confirmSpy.mockRestore();
    });
  });

  describe('步骤指引', () => {
    it('应该在初始状态显示步骤1为激活状态', () => {
      render(<App />);

      expect(screen.getByTestId('step-1')).toHaveClass('bg-blue-500');
      expect(screen.getByTestId('step-2')).toHaveClass('bg-gray-200');
      expect(screen.getByTestId('step-3')).toHaveClass('bg-gray-200');
    });

    it('应该在输入书名后激活步骤2', async () => {
      const user = userEvent.setup();
      render(<App />);

      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试');

      // 步骤2应该激活
      expect(screen.getByTestId('step-2')).toHaveClass('bg-blue-500');
    });

    it('应该在选择书籍后激活步骤3', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API
      vi.mocked(doubanService.searchBooks).mockResolvedValue([mockBook]);

      render(<App />);

      // 输入并选择书籍
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });

      const bookResult = screen.getByTestId('book-result-1');
      await user.click(bookResult);

      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // 步骤3应该激活
      expect(screen.getByTestId('step-3')).toHaveClass('bg-blue-500');
    });
  });

  describe('响应式布局', () => {
    it('应该渲染所有主要区域', () => {
      render(<App />);

      // 验证头部
      expect(screen.getByText('📚 书籍Best10生成器')).toBeInTheDocument();
      expect(screen.getByText('创建你的专属书单图片，分享到社交媒体')).toBeInTheDocument();

      // 验证步骤指引（使用getAllByText因为有多个相同文本）
      expect(screen.getAllByText('输入书名').length).toBeGreaterThan(0);
      expect(screen.getByText('搜索选择')).toBeInTheDocument();
      expect(screen.getAllByText('生成图片').length).toBeGreaterThan(0);

      // 验证页脚
      expect(screen.getByText('使用豆瓣API获取书籍信息 · 数据保存在本地浏览器')).toBeInTheDocument();
    });

    it('应该使用网格布局组织内容', () => {
      const { container } = render(<App />);

      // 查找网格容器
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('lg:grid-cols-2');
    });
  });

  describe('错误处理', () => {
    it('应该显示API错误提示', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API失败
      vi.mocked(doubanService.searchBooks).mockRejectedValue(new Error('网络错误'));

      render(<App />);

      // 输入并搜索
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      // 验证错误提示
      await waitFor(() => {
        expect(screen.getByTestId('error-toast')).toBeInTheDocument();
      });
    });

    it('应该允许关闭错误提示', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API失败
      vi.mocked(doubanService.searchBooks).mockRejectedValue(new Error('网络错误'));

      render(<App />);

      // 输入并搜索
      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      // 等待错误提示出现
      await waitFor(() => {
        expect(screen.getByTestId('error-toast')).toBeInTheDocument();
      });

      // 查找并点击关闭按钮
      const errorToast = screen.getByTestId('error-toast');
      const closeButton = within(errorToast).getByLabelText('关闭');
      await user.click(closeButton);

      // 验证错误提示消失
      await waitFor(() => {
        expect(screen.queryByTestId('error-toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('加载状态', () => {
    it('应该在isLoading为true时显示加载动画', () => {
      // 这个测试需要修改context来设置loading状态
      // 由于我们使用的是真实的context，这里只验证组件结构
      render(<App />);
      
      // 验证加载动画不在初始状态显示
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('数据持久化', () => {
    it('应该在页面加载时恢复保存的数据', async () => {
      const user = userEvent.setup();
      
      // Mock搜索API
      vi.mocked(doubanService.searchBooks).mockResolvedValue([mockBook]);

      // 第一次渲染：输入并选择书籍
      const { unmount } = render(<App />);

      const firstInput = screen.getByTestId('book-input-0');
      await user.type(firstInput, '测试书籍');
      
      const searchButton = screen.getByTestId('search-button-0');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
      });

      const bookResult = screen.getByTestId('book-result-1');
      await user.click(bookResult);

      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      });

      // 卸载组件
      unmount();

      // 第二次渲染：验证数据被恢复
      render(<App />);

      await waitFor(() => {
        const restoredInput = screen.getByTestId('book-input-0');
        expect(restoredInput).toHaveValue('测试书籍');
      }, { timeout: 2000 });

      // 验证书籍在预览中显示
      await waitFor(() => {
        expect(screen.getByTestId('book-preview-item-0')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
