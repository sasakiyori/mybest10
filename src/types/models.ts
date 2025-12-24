/**
 * 核心数据模型定义
 * 定义书籍Best10生成器的所有数据结构
 */

/**
 * 豆瓣书籍信息
 */
export interface DoubanBook {
  id: string;                      // 豆瓣书籍ID
  title: string;                   // 书名
  author: string[];                // 作者列表
  publisher: string;               // 出版社
  pubdate: string;                 // 出版日期
  coverUrl: string;                // 封面URL（中等尺寸）
  coverLargeUrl?: string;          // 大尺寸封面URL
  rating: number;                  // 评分
  isbn: string;                    // ISBN
}

/**
 * 书籍条目（包含排名和选择状态）
 */
export interface BookEntry {
  rank: number;                    // 排名 1-10
  bookName: string;                // 用户输入的书名
  selectedBook?: DoubanBook;       // 选中的豆瓣书籍
  customCover?: string;            // 自定义封面URL（可选）
  isSearching: boolean;            // 是否正在搜索
  searchResults?: DoubanBook[];    // 搜索结果缓存
}

/**
 * 模板类型
 */
export type TemplateType = 'classic' | 'modern' | 'minimal';

/**
 * 布局模式
 */
export type LayoutMode = 'list' | 'grid';

/**
 * 字体大小配置
 */
export interface FontSizeConfig {
  title: number;
  rank: number;
  bookName: number;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  width: number;                   // 画布宽度
  height: number;                  // 画布高度
  padding: number;                 // 边距
  spacing: number;                 // 间距
  mode: LayoutMode;                // 布局模式: list(列表) | grid(网格)
}

/**
 * 图片生成器配置
 */
export interface GeneratorConfig {
  title: string;                   // 标题文字
  subtitle?: string;               // 副标题（可选）
  backgroundColor: string;         // 背景颜色（hex）
  backgroundImage?: string;        // 自定义背景图片（base64或URL）
  textColor: string;               // 文字颜色（hex）
  accentColor: string;             // 强调色（hex）
  template: TemplateType;          // 模板类型
  fontSize: FontSizeConfig;        // 字体大小配置
  layout: LayoutConfig;            // 布局配置
}

/**
 * Best10列表
 */
export interface Best10List {
  id: string;
  name: string;
  books: BookEntry[];
  createdAt: Date;
  updatedAt: Date;
}
