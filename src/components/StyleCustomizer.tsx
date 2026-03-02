/**
 * StyleCustomizer Component
 * 样式自定义组件，提供背景色、文字色、标题编辑和模板选择功能
 * 需求: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeneratorConfig, TemplateType, LayoutMode } from '../types/models';
import { PRESET_TEMPLATES } from '../types/constants';

interface StyleCustomizerProps {
  config: GeneratorConfig;
  onConfigChange: (config: Partial<GeneratorConfig>) => void;
  onPreview?: () => void;
}

/**
 * 模板选项配置
 */
const TEMPLATE_OPTIONS: Array<{
  value: TemplateType;
  label: string;
  description: string;
}> = [
  {
    value: 'classic',
    label: '经典',
    description: '红色背景，金色文字',
  },
  {
    value: 'modern',
    label: '现代',
    description: '深色背景，蓝色强调',
  },
  {
    value: 'minimal',
    label: '简约',
    description: '白色背景，深色文字',
  },
];

/**
 * 布局模式选项
 */
const LAYOUT_MODE_OPTIONS: Array<{
  value: LayoutMode;
  label: string;
  description: string;
}> = [
  {
    value: 'list',
    label: '列表',
    description: '纵向排列',
  },
  {
    value: 'grid',
    label: '网格',
    description: '紧凑排列',
  },
];

export function StyleCustomizer({ config, onConfigChange, onPreview }: StyleCustomizerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  // 本地状态缓冲，防止每次击键都触发全局 context 更新
  const [localTitle, setLocalTitle] = useState(config.title);
  const [localSubtitle, setLocalSubtitle] = useState(config.subtitle || '');
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当外部 config.title 变化时（如切换模板）同步本地状态并取消未提交的防抖
  useEffect(() => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
    setLocalTitle(config.title);
  }, [config.title]);

  useEffect(() => {
    if (subtitleDebounceRef.current) {
      clearTimeout(subtitleDebounceRef.current);
      subtitleDebounceRef.current = null;
    }
    setLocalSubtitle(config.subtitle || '');
  }, [config.subtitle]);

  // 卸载时清理防抖定时器
  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      if (subtitleDebounceRef.current) clearTimeout(subtitleDebounceRef.current);
    };
  }, []);

  /**
   * 处理模板切换
   */
  const handleTemplateChange = (template: TemplateType) => {
    const templateConfig = PRESET_TEMPLATES[template];
    onConfigChange({
      template,
      ...templateConfig,
      backgroundImage: undefined, // 切换模板时清除自定义背景
    });
  };

  /**
   * 处理背景图片上传
   */
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onConfigChange({ backgroundImage: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  /**
   * 清除背景图片
   */
  const handleClearBackgroundImage = () => {
    onConfigChange({ backgroundImage: undefined });
    if (backgroundImageInputRef.current) {
      backgroundImageInputRef.current.value = '';
    }
  };

  /**
   * 处理标题变化 - 使用本地状态 + 防抖，避免每次击键触发全局重渲染
   */
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTitle(value);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      onConfigChange({ title: value });
      titleDebounceRef.current = null;
    }, 150);
  }, [onConfigChange]);

  /**
   * 处理副标题变化 - 使用本地状态 + 防抖
   */
  const handleSubtitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSubtitle(value);
    if (subtitleDebounceRef.current) clearTimeout(subtitleDebounceRef.current);
    subtitleDebounceRef.current = setTimeout(() => {
      onConfigChange({ subtitle: value || undefined });
      subtitleDebounceRef.current = null;
    }, 150);
  }, [onConfigChange]);

  /**
   * 处理背景颜色变化
   */
  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ backgroundColor: e.target.value });
  };

  /**
   * 处理文字颜色变化
   */
  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ textColor: e.target.value });
  };

  /**
   * 处理强调色变化
   */
  const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ accentColor: e.target.value });
  };

  /**
   * 处理布局模式变化
   */
  const handleLayoutModeChange = (mode: LayoutMode) => {
    onConfigChange({
      layout: {
        ...config.layout,
        mode,
      },
    });
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 标题和展开控制 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5 sm:gap-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          样式设置
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          aria-label={isExpanded ? '收起' : '展开'}
        >
          {isExpanded ? '收起' : '更多选项'}
          <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 模板选择 */}
      <div className="space-y-2 sm:space-y-3">
        <label className="block text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">
          选择模板
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTemplateChange(option.value)}
              className={`
                relative p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 group
                ${config.template === option.value
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                }
              `}
              data-testid={`template-${option.value}`}
            >
              {config.template === option.value && (
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className={`font-medium text-xs sm:text-sm ${config.template === option.value ? 'text-indigo-400' : 'text-slate-300'}`}>{option.label}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden xs:block">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义背景图片 */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">
            自定义背景
          </label>
          {config.backgroundImage && (
            <button
              onClick={handleClearBackgroundImage}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              清除图片
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            ref={backgroundImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            className="hidden"
            data-testid="bg-image-input"
          />
          <button
            onClick={() => backgroundImageInputRef.current?.click()}
            className={`
              flex-1 px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 border-dashed transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-2
              ${config.backgroundImage 
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                : 'border-slate-600 hover:border-indigo-400 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/50'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {config.backgroundImage ? '✓ 已上传背景图片' : '上传自定义背景图片'}
          </button>
        </div>
        {config.backgroundImage && (
          <div className="relative rounded-lg overflow-hidden border border-slate-600 h-20">
            <img 
              src={config.backgroundImage} 
              alt="背景预览" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent flex items-center px-3">
              <span className="text-xs text-slate-200">背景预览</span>
            </div>
          </div>
        )}
      </div>

      {/* 布局模式选择 */}
      <div className="space-y-2 sm:space-y-3">
        <label className="block text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">
          排版模式
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {LAYOUT_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLayoutModeChange(option.value)}
              className={`
                relative p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 group
                ${config.layout.mode === option.value
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                }
              `}
              data-testid={`layout-${option.value}`}
            >
              {config.layout.mode === option.value && (
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2">
                {option.value === 'list' ? (
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                )}
                <div className={`font-medium text-xs sm:text-sm ${config.layout.mode === option.value ? 'text-indigo-400' : 'text-slate-300'}`}>{option.label}</div>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 标题编辑 */}
      <div className="space-y-1.5 sm:space-y-2">
        <label htmlFor="title-input" className="block text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">
          标题文字
        </label>
        <input
          id="title-input"
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="输入标题，如：我的书籍BEST10"
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700 border-2 border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 sm:focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 text-slate-100 placeholder-slate-500 text-xs sm:text-sm"
          data-testid="title-input"
        />
      </div>

      {/* 副标题编辑（可选） */}
      {isExpanded && (
        <div className="space-y-1.5 sm:space-y-2 animate-fade-in">
          <label htmlFor="subtitle-input" className="block text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">
            副标题（可选）
          </label>
          <input
            id="subtitle-input"
            type="text"
            value={localSubtitle}
            onChange={handleSubtitleChange}
            placeholder="输入副标题"
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700 border-2 border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 sm:focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 text-slate-100 placeholder-slate-500 text-xs sm:text-sm"
            data-testid="subtitle-input"
          />
        </div>
      )}

      {/* 颜色选择器 */}
      {isExpanded && (
        <div className="space-y-3 sm:space-y-4 animate-fade-in">
          <h3 className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">颜色设置</h3>
          
          {/* 背景颜色 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <label htmlFor="bg-color" className="text-xs sm:text-sm text-slate-400 w-14 sm:w-20 flex-shrink-0">
              背景色
            </label>
            <div className="relative">
              <input
                id="bg-color"
                type="color"
                value={config.backgroundColor}
                onChange={handleBackgroundColorChange}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-2 border-slate-600 overflow-hidden"
                data-testid="bg-color-picker"
              />
            </div>
            <input
              type="text"
              value={config.backgroundColor}
              onChange={handleBackgroundColorChange}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-400 transition-colors font-mono min-w-0 text-slate-100"
              placeholder="#DC143C"
            />
          </div>

          {/* 文字颜色 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <label htmlFor="text-color" className="text-xs sm:text-sm text-slate-400 w-14 sm:w-20 flex-shrink-0">
              文字色
            </label>
            <div className="relative">
              <input
                id="text-color"
                type="color"
                value={config.textColor}
                onChange={handleTextColorChange}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-2 border-slate-600 overflow-hidden"
                data-testid="text-color-picker"
              />
            </div>
            <input
              type="text"
              value={config.textColor}
              onChange={handleTextColorChange}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-400 transition-colors font-mono min-w-0 text-slate-100"
              placeholder="#FFD700"
            />
          </div>

          {/* 强调色 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <label htmlFor="accent-color" className="text-xs sm:text-sm text-slate-400 w-14 sm:w-20 flex-shrink-0">
              强调色
            </label>
            <div className="relative">
              <input
                id="accent-color"
                type="color"
                value={config.accentColor}
                onChange={handleAccentColorChange}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-2 border-slate-600 overflow-hidden"
                data-testid="accent-color-picker"
              />
            </div>
            <input
              type="text"
              value={config.accentColor}
              onChange={handleAccentColorChange}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-400 transition-colors font-mono min-w-0 text-slate-100"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      )}

      {/* 预览按钮 */}
      {onPreview && (
        <button
          onClick={onPreview}
          className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 font-medium text-sm shadow-md shadow-indigo-500/20"
          data-testid="preview-button"
        >
          实时预览
        </button>
      )}

      {/* 当前配置预览 */}
      <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl border border-slate-600 overflow-hidden">
        <div className="text-[10px] sm:text-xs text-slate-400 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700/50 border-b border-slate-600">样式预览</div>
        <div
          className="h-20 sm:h-28 flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: config.backgroundColor,
            color: config.textColor,
          }}
          data-testid="style-preview"
        >
          {config.backgroundImage && (
            <img 
              src={config.backgroundImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )}
          <div className="text-center px-3 sm:px-4 relative z-10">
            <div className="text-base sm:text-xl font-bold truncate">{config.title}</div>
            {config.subtitle && (
              <div className="text-[10px] sm:text-xs mt-1 sm:mt-1.5 truncate" style={{ color: config.accentColor }}>
                {config.subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
