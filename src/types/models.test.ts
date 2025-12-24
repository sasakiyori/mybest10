/**
 * 数据模型单元测试
 * 测试类型定义的正确性和默认值
 */

import { describe, it, expect } from 'vitest';
import type {
  DoubanBook,
  BookEntry,
  GeneratorConfig,
  Best10List,
  TemplateType,
} from './models';
import {
  DEFAULT_GENERATOR_CONFIG,
  PRESET_TEMPLATES,
  TEMPLATE_TYPES,
  API_CONSTANTS,
  STORAGE_KEYS,
  IMAGE_CONSTANTS,
  VALIDATION_CONSTANTS,
  UI_CONSTANTS,
} from './constants';

describe('数据模型类型定义', () => {
  describe('DoubanBook', () => {
    it('应该包含所有必需字段', () => {
      const book: DoubanBook = {
        id: '123',
        title: '测试书籍',
        author: ['作者1', '作者2'],
        publisher: '测试出版社',
        pubdate: '2024-01',
        coverUrl: 'https://example.com/cover.jpg',
        rating: 8.5,
        isbn: '9787111111111',
      };

      expect(book.id).toBe('123');
      expect(book.title).toBe('测试书籍');
      expect(book.author).toHaveLength(2);
      expect(book.publisher).toBe('测试出版社');
      expect(book.pubdate).toBe('2024-01');
      expect(book.coverUrl).toBe('https://example.com/cover.jpg');
      expect(book.rating).toBe(8.5);
      expect(book.isbn).toBe('9787111111111');
    });

    it('应该支持可选的coverLargeUrl字段', () => {
      const bookWithLargeCover: DoubanBook = {
        id: '123',
        title: '测试书籍',
        author: ['作者1'],
        publisher: '测试出版社',
        pubdate: '2024-01',
        coverUrl: 'https://example.com/cover.jpg',
        coverLargeUrl: 'https://example.com/cover-large.jpg',
        rating: 8.5,
        isbn: '9787111111111',
      };

      expect(bookWithLargeCover.coverLargeUrl).toBe('https://example.com/cover-large.jpg');
    });
  });

  describe('BookEntry', () => {
    it('应该包含所有必需字段', () => {
      const entry: BookEntry = {
        rank: 1,
        bookName: '测试书名',
        isSearching: false,
      };

      expect(entry.rank).toBe(1);
      expect(entry.bookName).toBe('测试书名');
      expect(entry.isSearching).toBe(false);
    });

    it('应该支持可选字段', () => {
      const doubanBook: DoubanBook = {
        id: '123',
        title: '测试书籍',
        author: ['作者1'],
        publisher: '测试出版社',
        pubdate: '2024-01',
        coverUrl: 'https://example.com/cover.jpg',
        rating: 8.5,
        isbn: '9787111111111',
      };

      const entry: BookEntry = {
        rank: 1,
        bookName: '测试书名',
        selectedBook: doubanBook,
        customCover: 'https://example.com/custom.jpg',
        isSearching: false,
        searchResults: [doubanBook],
      };

      expect(entry.selectedBook).toBeDefined();
      expect(entry.customCover).toBe('https://example.com/custom.jpg');
      expect(entry.searchResults).toHaveLength(1);
    });
  });

  describe('GeneratorConfig', () => {
    it('应该包含所有必需字段', () => {
      const config: GeneratorConfig = {
        title: '测试标题',
        backgroundColor: '#FF0000',
        textColor: '#FFFFFF',
        accentColor: '#000000',
        template: 'classic',
        fontSize: {
          title: 48,
          rank: 36,
          bookName: 24,
        },
        layout: {
          width: 1080,
          height: 1920,
          padding: 40,
          spacing: 20,
          mode: 'list',
        },
      };

      expect(config.title).toBe('测试标题');
      expect(config.backgroundColor).toBe('#FF0000');
      expect(config.textColor).toBe('#FFFFFF');
      expect(config.accentColor).toBe('#000000');
      expect(config.template).toBe('classic');
      expect(config.fontSize.title).toBe(48);
      expect(config.layout.width).toBe(1080);
    });

    it('应该支持可选的subtitle字段', () => {
      const config: GeneratorConfig = {
        title: '测试标题',
        subtitle: '测试副标题',
        backgroundColor: '#FF0000',
        textColor: '#FFFFFF',
        accentColor: '#000000',
        template: 'classic',
        fontSize: {
          title: 48,
          rank: 36,
          bookName: 24,
        },
        layout: {
          width: 1080,
          height: 1920,
          padding: 40,
          spacing: 20,
          mode: 'list',
        },
      };

      expect(config.subtitle).toBe('测试副标题');
    });
  });

  describe('Best10List', () => {
    it('应该包含所有必需字段', () => {
      const list: Best10List = {
        id: 'list-123',
        name: '我的书单',
        books: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      expect(list.id).toBe('list-123');
      expect(list.name).toBe('我的书单');
      expect(list.books).toHaveLength(0);
      expect(list.createdAt).toBeInstanceOf(Date);
      expect(list.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('TemplateType', () => {
    it('应该只接受有效的模板类型', () => {
      const validTypes: TemplateType[] = ['classic', 'modern', 'minimal'];
      
      validTypes.forEach(type => {
        const config: GeneratorConfig = {
          title: '测试',
          backgroundColor: '#FF0000',
          textColor: '#FFFFFF',
          accentColor: '#000000',
          template: type,
          fontSize: { title: 48, rank: 36, bookName: 24 },
          layout: { width: 1080, height: 1920, padding: 40, spacing: 20, mode: 'list' },
        };
        
        expect(config.template).toBe(type);
      });
    });
  });
});

describe('常量定义', () => {
  describe('DEFAULT_GENERATOR_CONFIG', () => {
    it('应该包含所有必需的配置字段', () => {
      expect(DEFAULT_GENERATOR_CONFIG.title).toBe('我的书籍BEST10');
      expect(DEFAULT_GENERATOR_CONFIG.backgroundColor).toBe('#DC143C');
      expect(DEFAULT_GENERATOR_CONFIG.textColor).toBe('#FFD700');
      expect(DEFAULT_GENERATOR_CONFIG.accentColor).toBe('#FFFFFF');
      expect(DEFAULT_GENERATOR_CONFIG.template).toBe('classic');
    });

    it('应该包含正确的字体大小配置', () => {
      expect(DEFAULT_GENERATOR_CONFIG.fontSize.title).toBe(48);
      expect(DEFAULT_GENERATOR_CONFIG.fontSize.rank).toBe(36);
      expect(DEFAULT_GENERATOR_CONFIG.fontSize.bookName).toBe(24);
    });

    it('应该包含正确的布局配置', () => {
      expect(DEFAULT_GENERATOR_CONFIG.layout.width).toBe(1080);
      expect(DEFAULT_GENERATOR_CONFIG.layout.height).toBe(1920);
      expect(DEFAULT_GENERATOR_CONFIG.layout.padding).toBe(40);
      expect(DEFAULT_GENERATOR_CONFIG.layout.spacing).toBe(20);
    });
  });

  describe('PRESET_TEMPLATES', () => {
    it('应该包含所有三种模板类型', () => {
      expect(PRESET_TEMPLATES.classic).toBeDefined();
      expect(PRESET_TEMPLATES.modern).toBeDefined();
      expect(PRESET_TEMPLATES.minimal).toBeDefined();
    });

    it('每个模板应该包含颜色配置', () => {
      Object.values(PRESET_TEMPLATES).forEach(template => {
        expect(template.backgroundColor).toBeDefined();
        expect(template.textColor).toBeDefined();
        expect(template.accentColor).toBeDefined();
      });
    });

    it('每个模板应该包含字体大小配置', () => {
      Object.values(PRESET_TEMPLATES).forEach(template => {
        expect(template.fontSize).toBeDefined();
        expect(template.fontSize?.title).toBeGreaterThan(0);
        expect(template.fontSize?.rank).toBeGreaterThan(0);
        expect(template.fontSize?.bookName).toBeGreaterThan(0);
      });
    });
  });

  describe('TEMPLATE_TYPES', () => {
    it('应该包含所有模板类型常量', () => {
      expect(TEMPLATE_TYPES.CLASSIC).toBe('classic');
      expect(TEMPLATE_TYPES.MODERN).toBe('modern');
      expect(TEMPLATE_TYPES.MINIMAL).toBe('minimal');
    });
  });

  describe('API_CONSTANTS', () => {
    it('应该包含豆瓣API基础URL', () => {
      expect(API_CONSTANTS.DOUBAN_BASE_URL).toBe('https://douban.uieee.com/v2/book');
    });

    it('应该包含合理的超时时间', () => {
      expect(API_CONSTANTS.SEARCH_TIMEOUT).toBe(5000);
    });

    it('应该包含最大搜索结果数', () => {
      expect(API_CONSTANTS.MAX_SEARCH_RESULTS).toBe(5);
    });

    it('应该包含重试次数', () => {
      expect(API_CONSTANTS.RETRY_ATTEMPTS).toBe(2);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('应该包含所有存储键', () => {
      expect(STORAGE_KEYS.BEST10_LIST).toBe('best10_list');
      expect(STORAGE_KEYS.GENERATOR_CONFIG).toBe('generator_config');
    });
  });

  describe('IMAGE_CONSTANTS', () => {
    it('应该包含支持的图片格式', () => {
      expect(IMAGE_CONSTANTS.SUPPORTED_FORMATS).toContain('image/jpeg');
      expect(IMAGE_CONSTANTS.SUPPORTED_FORMATS).toContain('image/png');
      expect(IMAGE_CONSTANTS.SUPPORTED_FORMATS).toContain('image/webp');
    });

    it('应该包含最小封面尺寸', () => {
      expect(IMAGE_CONSTANTS.MIN_COVER_WIDTH).toBe(300);
      expect(IMAGE_CONSTANTS.MIN_COVER_HEIGHT).toBe(400);
    });

    it('应该包含导出质量配置', () => {
      expect(IMAGE_CONSTANTS.EXPORT_QUALITY).toBe(1.0);
      expect(IMAGE_CONSTANTS.JPEG_QUALITY).toBe(0.95);
    });
  });

  describe('VALIDATION_CONSTANTS', () => {
    it('应该包含书名长度限制', () => {
      expect(VALIDATION_CONSTANTS.MIN_BOOK_NAME_LENGTH).toBe(1);
      expect(VALIDATION_CONSTANTS.MAX_BOOK_NAME_LENGTH).toBe(100);
    });

    it('应该包含书籍数量和排名范围', () => {
      expect(VALIDATION_CONSTANTS.BOOK_COUNT).toBe(10);
      expect(VALIDATION_CONSTANTS.MIN_RANK).toBe(1);
      expect(VALIDATION_CONSTANTS.MAX_RANK).toBe(10);
    });
  });

  describe('UI_CONSTANTS', () => {
    it('应该包含搜索防抖时间', () => {
      expect(UI_CONSTANTS.SEARCH_DEBOUNCE_MS).toBe(300);
    });

    it('应该包含消息显示时长', () => {
      expect(UI_CONSTANTS.SUCCESS_MESSAGE_DURATION).toBe(3000);
      expect(UI_CONSTANTS.ERROR_MESSAGE_DURATION).toBe(5000);
    });
  });
});
