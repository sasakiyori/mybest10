/**
 * StyleCustomizer Unit Tests
 * 测试颜色选择器、模板切换、标题编辑功能
 * 需求: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StyleCustomizer } from './StyleCustomizer';
import { DEFAULT_GENERATOR_CONFIG } from '../types/constants';
import type { GeneratorConfig } from '../types/models';

describe('StyleCustomizer Component', () => {
  /**
   * 测试组件基本渲染
   */
  it('应该正确渲染样式自定义组件', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 验证标题存在
    expect(screen.getByText('样式自定义')).toBeInTheDocument();
    
    // 验证模板选择按钮存在
    expect(screen.getByTestId('template-classic')).toBeInTheDocument();
    expect(screen.getByTestId('template-modern')).toBeInTheDocument();
    expect(screen.getByTestId('template-minimal')).toBeInTheDocument();
    
    // 验证标题输入框存在
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
  });

  /**
   * 测试模板切换功能 (需求 8.4)
   */
  it('应该能够切换模板并触发配置更新', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 点击现代模板
    const modernButton = screen.getByTestId('template-modern');
    fireEvent.click(modernButton);

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalled();
    
    // 验证传递的配置包含模板类型
    const callArgs = mockOnConfigChange.mock.calls[0][0];
    expect(callArgs.template).toBe('modern');
    expect(callArgs.backgroundColor).toBeDefined();
    expect(callArgs.textColor).toBeDefined();
  });

  /**
   * 测试标题编辑功能 (需求 8.3)
   */
  it('应该能够编辑标题文字', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    const titleInput = screen.getByTestId('title-input') as HTMLInputElement;
    
    // 修改标题
    fireEvent.change(titleInput, { target: { value: '我的新标题' } });

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalledWith({ title: '我的新标题' });
  });

  /**
   * 测试副标题编辑功能
   */
  it('应该能够编辑副标题文字', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 展开高级选项
    const expandButton = screen.getByLabelText('展开');
    fireEvent.click(expandButton);

    const subtitleInput = screen.getByTestId('subtitle-input') as HTMLInputElement;
    
    // 修改副标题
    fireEvent.change(subtitleInput, { target: { value: '副标题测试' } });

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalledWith({ subtitle: '副标题测试' });
  });

  /**
   * 测试背景颜色选择器 (需求 8.1)
   */
  it('应该能够选择背景颜色', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 展开高级选项
    const expandButton = screen.getByLabelText('展开');
    fireEvent.click(expandButton);

    const bgColorPicker = screen.getByTestId('bg-color-picker') as HTMLInputElement;
    
    // 修改背景颜色
    fireEvent.change(bgColorPicker, { target: { value: '#ff0000' } });

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalledWith({ backgroundColor: '#ff0000' });
  });

  /**
   * 测试文字颜色选择器 (需求 8.2)
   */
  it('应该能够选择文字颜色', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 展开高级选项
    const expandButton = screen.getByLabelText('展开');
    fireEvent.click(expandButton);

    const textColorPicker = screen.getByTestId('text-color-picker') as HTMLInputElement;
    
    // 修改文字颜色
    fireEvent.change(textColorPicker, { target: { value: '#00ff00' } });

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalledWith({ textColor: '#00ff00' });
  });

  /**
   * 测试强调色选择器
   */
  it('应该能够选择强调色', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 展开高级选项
    const expandButton = screen.getByLabelText('展开');
    fireEvent.click(expandButton);

    const accentColorPicker = screen.getByTestId('accent-color-picker') as HTMLInputElement;
    
    // 修改强调色
    fireEvent.change(accentColorPicker, { target: { value: '#0000ff' } });

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalledWith({ accentColor: '#0000ff' });
  });

  /**
   * 测试预览按钮
   */
  it('应该能够触发预览功能', () => {
    const mockOnConfigChange = vi.fn();
    const mockOnPreview = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
        onPreview={mockOnPreview}
      />
    );

    const previewButton = screen.getByTestId('preview-button');
    fireEvent.click(previewButton);

    // 验证预览回调被调用
    expect(mockOnPreview).toHaveBeenCalled();
  });

  /**
   * 测试样式预览区域
   */
  it('应该显示当前样式预览', () => {
    const customConfig: GeneratorConfig = {
      ...DEFAULT_GENERATOR_CONFIG,
      title: '测试标题',
      subtitle: '测试副标题',
      backgroundColor: '#FF0000',
      textColor: '#00FF00',
      accentColor: '#0000FF',
    };

    render(
      <StyleCustomizer
        config={customConfig}
        onConfigChange={vi.fn()}
      />
    );

    const previewArea = screen.getByTestId('style-preview');
    
    // 验证预览区域应用了正确的样式
    expect(previewArea).toHaveStyle({
      backgroundColor: '#FF0000',
      color: '#00FF00',
    });

    // 验证标题和副标题显示
    expect(screen.getByText('测试标题')).toBeInTheDocument();
    expect(screen.getByText('测试副标题')).toBeInTheDocument();
  });

  /**
   * 测试展开/收起功能
   */
  it('应该能够展开和收起高级选项', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 初始状态应该是收起的
    expect(screen.queryByTestId('bg-color-picker')).not.toBeInTheDocument();

    // 点击展开
    const expandButton = screen.getByLabelText('展开');
    fireEvent.click(expandButton);

    // 展开后应该显示颜色选择器
    expect(screen.getByTestId('bg-color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('text-color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('accent-color-picker')).toBeInTheDocument();

    // 点击收起
    const collapseButton = screen.getByLabelText('收起');
    fireEvent.click(collapseButton);

    // 收起后应该隐藏颜色选择器
    expect(screen.queryByTestId('bg-color-picker')).not.toBeInTheDocument();
  });

  /**
   * 测试模板选中状态
   */
  it('应该高亮显示当前选中的模板', () => {
    const classicConfig: GeneratorConfig = {
      ...DEFAULT_GENERATOR_CONFIG,
      template: 'classic',
    };

    const { rerender } = render(
      <StyleCustomizer
        config={classicConfig}
        onConfigChange={vi.fn()}
      />
    );

    // 验证经典模板被选中
    const classicButton = screen.getByTestId('template-classic');
    expect(classicButton.className).toContain('border-blue-500');

    // 切换到现代模板
    const modernConfig: GeneratorConfig = {
      ...DEFAULT_GENERATOR_CONFIG,
      template: 'modern',
    };

    rerender(
      <StyleCustomizer
        config={modernConfig}
        onConfigChange={vi.fn()}
      />
    );

    // 验证现代模板被选中
    const modernButton = screen.getByTestId('template-modern');
    expect(modernButton.className).toContain('border-blue-500');
  });

  /**
   * 测试空副标题处理
   */
  it('应该正确处理空副标题', () => {
    const mockOnConfigChange = vi.fn();
    
    const configWithSubtitle: GeneratorConfig = {
      ...DEFAULT_GENERATOR_CONFIG,
      subtitle: '初始副标题',
    };
    
    render(
      <StyleCustomizer
        config={configWithSubtitle}
        onConfigChange={mockOnConfigChange}
      />
    );

    // 展开高级选项
    const expandButton = screen.getByLabelText('展开');
    fireEvent.click(expandButton);

    const subtitleInput = screen.getByTestId('subtitle-input') as HTMLInputElement;
    
    // 验证初始值
    expect(subtitleInput.value).toBe('初始副标题');
    
    // 清空副标题
    fireEvent.change(subtitleInput, { target: { value: '' } });

    // 验证回调被调用，且副标题为undefined
    expect(mockOnConfigChange).toHaveBeenCalledWith({ subtitle: undefined });
  });

  /**
   * 测试中文输入
   */
  it('应该支持中文标题输入', () => {
    const mockOnConfigChange = vi.fn();
    
    render(
      <StyleCustomizer
        config={DEFAULT_GENERATOR_CONFIG}
        onConfigChange={mockOnConfigChange}
      />
    );

    const titleInput = screen.getByTestId('title-input') as HTMLInputElement;
    
    // 输入中文标题
    fireEvent.change(titleInput, { target: { value: '我的书籍推荐榜单' } });

    // 验证回调被调用
    expect(mockOnConfigChange).toHaveBeenCalledWith({ title: '我的书籍推荐榜单' });
  });
});
