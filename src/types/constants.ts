/**
 * 常量定义
 * 包含默认配置、模板类型等常量
 */

import type { GeneratorConfig, TemplateType, LayoutMode } from './models';

/**
 * 模板类型常量
 */
export const TEMPLATE_TYPES: Record<string, TemplateType> = {
  CLASSIC: 'classic',
  MODERN: 'modern',
  MINIMAL: 'minimal',
} as const;

/**
 * 布局模式常量
 */
export const LAYOUT_MODES: Record<string, LayoutMode> = {
  LIST: 'list',
  GRID: 'grid',
} as const;

/**
 * 默认生成器配置
 */
export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  title: '我的书籍BEST10',
  subtitle: undefined,
  backgroundColor: '#2C3E50',      // 现代深色背景
  textColor: '#ECF0F1',            // 浅色文字
  accentColor: '#3498DB',          // 蓝色强调色
  template: 'modern',              // 默认现代模板
  fontSize: {
    title: 52,
    rank: 40,
    bookName: 26,
  },
  layout: {
    width: 1080,                   // 1080x1920 高清尺寸
    height: 1920,
    padding: 40,
    spacing: 20,
    mode: 'grid',                  // 默认网格模式
  },
};

/**
 * 预设模板配置
 */
export const PRESET_TEMPLATES: Record<TemplateType, Partial<GeneratorConfig>> = {
  classic: {
    backgroundColor: '#DC143C',
    textColor: '#FFD700',
    accentColor: '#FFFFFF',
    fontSize: {
      title: 48,
      rank: 36,
      bookName: 24,
    },
  },
  modern: {
    backgroundColor: '#2C3E50',
    textColor: '#ECF0F1',
    accentColor: '#3498DB',
    fontSize: {
      title: 52,
      rank: 40,
      bookName: 26,
    },
  },
  minimal: {
    backgroundColor: '#FFFFFF',
    textColor: '#2C3E50',
    accentColor: '#95A5A6',
    fontSize: {
      title: 44,
      rank: 32,
      bookName: 22,
    },
  },
};

/**
 * API相关常量
 */
export const API_CONSTANTS = {
  DOUBAN_BASE_URL: 'https://douban.uieee.com/v2/book', // 注意：此API可能不可用
  SEARCH_TIMEOUT: 15000,           // 15秒超时（CORS代理需要更长时间）
  MAX_SEARCH_RESULTS: 5,           // 最多显示5个搜索结果
  RETRY_ATTEMPTS: 2,               // 重试次数
  USE_MOCK_DATA: false,            // 使用真实API（图片搜索会尝试多个来源）
} as const;

/**
 * 存储相关常量
 */
export const STORAGE_KEYS = {
  BEST10_LIST: 'best10_list',
  GENERATOR_CONFIG: 'generator_config',
} as const;

/**
 * 图片相关常量
 */
export const IMAGE_CONSTANTS = {
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
  DEFAULT_COVER_PLACEHOLDER: '/placeholder-cover.png',
  MIN_COVER_WIDTH: 300,
  MIN_COVER_HEIGHT: 400,
  EXPORT_QUALITY: 1.0,             // PNG质量
  JPEG_QUALITY: 0.95,              // JPG质量
} as const;

/**
 * 验证相关常量
 */
export const VALIDATION_CONSTANTS = {
  MIN_BOOK_NAME_LENGTH: 1,
  MAX_BOOK_NAME_LENGTH: 100,
  BOOK_COUNT: 10,                  // 固定10本书
  MIN_RANK: 1,
  MAX_RANK: 10,
} as const;

/**
 * UI相关常量
 */
export const UI_CONSTANTS = {
  SEARCH_DEBOUNCE_MS: 300,         // 搜索防抖时间
  LOADING_ANIMATION_DURATION: 200,
  SUCCESS_MESSAGE_DURATION: 3000,
  ERROR_MESSAGE_DURATION: 5000,
} as const;
