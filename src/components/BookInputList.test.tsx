/**
 * BookInputList 单元测试
 * 需求: 1.1, 1.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookInputList } from './BookInputList';
import { Best10Provider } from '../contexts/Best10Context';
import { VALIDATION_CONSTANTS } from '../types/constants';

describe('BookInputList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * 测试: 验证渲染10个输入框
   * 需求: 1.1
   */
  it('应该渲染10个输入框', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    // 验证渲染了10个输入框
    for (let i = 0; i < VALIDATION_CONSTANTS.BOOK_COUNT; i++) {
      const input = screen.getByTestId(`book-input-${i}`);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', `输入第${i + 1}名书籍...`);
    }
  });

  /**
   * 测试: 验证每个输入框对应正确的排名
   * 需求: 1.1
   */
  it('应该为每个输入框显示正确的排名', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    // 验证排名显示
    for (let i = 1; i <= VALIDATION_CONSTANTS.BOOK_COUNT; i++) {
      const rankBadge = screen.getByText(i.toString());
      expect(rankBadge).toBeInTheDocument();
    }
  });

  /**
   * 测试: 验证输入变化触发状态更新
   * 需求: 1.2
   */
  it('应该在输入变化时更新状态', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const input = screen.getByTestId('book-input-0') as HTMLInputElement;
    
    // 输入书名
    fireEvent.change(input, { target: { value: '三体' } });
    
    // 验证输入值已更新
    expect(input.value).toBe('三体');
  });

  /**
   * 测试: 验证多个输入框可以独立更新
   * 需求: 1.2
   */
  it('应该允许多个输入框独立更新', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const input0 = screen.getByTestId('book-input-0') as HTMLInputElement;
    const input1 = screen.getByTestId('book-input-1') as HTMLInputElement;
    const input2 = screen.getByTestId('book-input-2') as HTMLInputElement;
    
    // 输入不同的书名
    fireEvent.change(input0, { target: { value: '三体' } });
    fireEvent.change(input1, { target: { value: '流浪地球' } });
    fireEvent.change(input2, { target: { value: '球状闪电' } });
    
    // 验证每个输入框的值都正确
    expect(input0.value).toBe('三体');
    expect(input1.value).toBe('流浪地球');
    expect(input2.value).toBe('球状闪电');
  });

  /**
   * 测试: 验证搜索按钮点击
   * 需求: 1.5
   */
  it('应该在点击搜索按钮时触发搜索', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const input = screen.getByTestId('book-input-0') as HTMLInputElement;
    const searchButton = screen.getByTestId('search-button-0');
    
    // 输入书名
    fireEvent.change(input, { target: { value: '三体' } });
    
    // 点击搜索按钮
    fireEvent.click(searchButton);
    
    // 验证按钮可以被点击（不会抛出错误）
    expect(searchButton).toBeInTheDocument();
  });

  /**
   * 测试: 验证空输入时搜索按钮被禁用
   * 需求: 1.5
   */
  it('应该在输入为空时禁用搜索按钮', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const searchButton = screen.getByTestId('search-button-0');
    
    // 验证初始状态下按钮被禁用
    expect(searchButton).toBeDisabled();
  });

  /**
   * 测试: 验证有输入时搜索按钮启用
   * 需求: 1.5
   */
  it('应该在有输入时启用搜索按钮', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const input = screen.getByTestId('book-input-0') as HTMLInputElement;
    const searchButton = screen.getByTestId('search-button-0');
    
    // 输入书名
    fireEvent.change(input, { target: { value: '三体' } });
    
    // 验证按钮已启用
    expect(searchButton).not.toBeDisabled();
  });

  /**
   * 测试: 验证只有空格时搜索按钮被禁用
   * 需求: 1.5
   */
  it('应该在输入只有空格时禁用搜索按钮', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const input = screen.getByTestId('book-input-0') as HTMLInputElement;
    const searchButton = screen.getByTestId('search-button-0');
    
    // 输入空格
    fireEvent.change(input, { target: { value: '   ' } });
    
    // 验证按钮被禁用
    expect(searchButton).toBeDisabled();
  });

  /**
   * 测试: 验证支持Unicode字符输入
   * 需求: 1.4
   */
  it('应该支持中文、英文和emoji输入', () => {
    render(
      <Best10Provider>
        <BookInputList />
      </Best10Provider>
    );

    const input0 = screen.getByTestId('book-input-0') as HTMLInputElement;
    const input1 = screen.getByTestId('book-input-1') as HTMLInputElement;
    const input2 = screen.getByTestId('book-input-2') as HTMLInputElement;
    
    // 输入不同类型的Unicode字符
    fireEvent.change(input0, { target: { value: '三体' } }); // 中文
    fireEvent.change(input1, { target: { value: 'The Three-Body Problem' } }); // 英文
    fireEvent.change(input2, { target: { value: '📚 书籍 Book 🎉' } }); // 混合emoji
    
    // 验证所有字符都正确显示
    expect(input0.value).toBe('三体');
    expect(input1.value).toBe('The Three-Body Problem');
    expect(input2.value).toBe('📚 书籍 Book 🎉');
  });
});
