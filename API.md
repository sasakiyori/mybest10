# API 文档

本文档描述书籍Best10生成器的内部API和服务接口。

## 目录

- [豆瓣服务 (DoubanService)](#豆瓣服务-doubanservice)
- [图片搜索服务 (ImageSearchService)](#图片搜索服务-imagesearchservice)
- [存储服务 (StorageService)](#存储服务-storageservice)
- [渲染服务 (RenderService)](#渲染服务-renderservice)
- [Context API](#context-api)
- [数据模型](#数据模型)

---

## 豆瓣服务 (DoubanService)

位置：`src/services/doubanService.ts`

### searchBooks

搜索书籍。

```typescript
function searchBooks(query: string): Promise<DoubanBook[]>
```

**参数：**
- `query` (string): 搜索关键词

**返回：**
- `Promise<DoubanBook[]>`: 书籍列表（最多5个结果）

**异常：**
- `DoubanAPIError`: API请求失败

**示例：**
```typescript
import { searchBooks } from './services/doubanService';

try {
  const books = await searchBooks('三体');
  console.log(books);
} catch (error) {
  if (error instanceof DoubanAPIError) {
    console.error(error.getUserMessage());
  }
}
```

### getBookDetail

获取书籍详情。

```typescript
function getBookDetail(id: string): Promise<DoubanBook>
```

**参数：**
- `id` (string): 豆瓣书籍ID

**返回：**
- `Promise<DoubanBook>`: 书籍详情

**异常：**
- `DoubanAPIError`: API请求失败

**示例：**
```typescript
import { getBookDetail } from './services/doubanService';

const book = await getBookDetail('1007305');
console.log(book.title);
```

### DoubanAPIError

自定义错误类。

```typescript
class DoubanAPIError extends Error {
  statusCode?: number;
  originalError?: unknown;
  userFriendlyMessage?: string;
  
  getUserMessage(): string;
}
```

**属性：**
- `statusCode`: HTTP状态码
- `originalError`: 原始错误对象
- `userFriendlyMessage`: 用户友好的错误消息

**方法：**
- `getUserMessage()`: 获取用户友好的错误消息

---

## 图片搜索服务 (ImageSearchService)

位置：`src/services/imageSearchService.ts`

提供百度图片搜索功能，作为豆瓣API的备选方案。

### searchBookCoverImages

搜索书籍封面图片。

```typescript
function searchBookCoverImages(bookName: string): Promise<ImageSearchResult[]>
```

**参数：**
- `bookName` (string): 书名

**返回：**
- `Promise<ImageSearchResult[]>`: 图片搜索结果列表（最多5个结果）

**异常：**
- `ImageSearchError`: 搜索失败

**示例：**
```typescript
import { searchBookCoverImages } from './services/imageSearchService';

try {
  const images = await searchBookCoverImages('三体');
  console.log(images);
} catch (error) {
  if (error instanceof ImageSearchError) {
    console.error(error.getUserMessage());
  }
}
```

### ImageSearchResult

图片搜索结果。

```typescript
interface ImageSearchResult {
  id: string;
  thumbnailUrl: string;  // 缩略图URL
  imageUrl: string;      // 原图URL
  title: string;         // 图片标题
  source: string;        // 来源网站
}
```

### ImageSearchError

自定义错误类。

```typescript
class ImageSearchError extends Error {
  userFriendlyMessage?: string;
  
  getUserMessage(): string;
}
```

**属性：**
- `userFriendlyMessage`: 用户友好的错误消息

**方法：**
- `getUserMessage()`: 获取用户友好的错误消息

**使用场景：**

当豆瓣API不可用或搜索结果不理想时，可以使用图片搜索作为备选方案：

```typescript
import { searchBooks } from './services/doubanService';
import { searchBookCoverImages } from './services/imageSearchService';

// 先尝试豆瓣搜索
try {
  const books = await searchBooks('三体');
  if (books.length === 0) {
    // 如果没有结果，使用图片搜索
    const images = await searchBookCoverImages('三体');
  }
} catch (error) {
  // 豆瓣API失败，降级到图片搜索
  const images = await searchBookCoverImages('三体');
}
```

---

## 存储服务 (StorageService)

位置：`src/services/storageService.ts`

### saveBest10List

保存Best10列表到LocalStorage。

```typescript
function saveBest10List(list: Best10List): void
```

**参数：**
- `list` (Best10List): 要保存的列表

**异常：**
- `Error`: 存储失败或容量不足

**示例：**
```typescript
import { saveBest10List } from './services/storageService';

const list: Best10List = {
  id: 'list-1',
  name: 'My Best 10',
  books: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

saveBest10List(list);
```

### loadBest10List

从LocalStorage加载Best10列表。

```typescript
function loadBest10List(): Best10List | null
```

**返回：**
- `Best10List | null`: 列表对象，如果不存在则返回null

**示例：**
```typescript
import { loadBest10List } from './services/storageService';

const list = loadBest10List();
if (list) {
  console.log(list.books);
}
```

### clearBest10List

清空Best10列表。

```typescript
function clearBest10List(): void
```

**异常：**
- `Error`: 清空失败

### saveConfig

保存生成器配置。

```typescript
function saveConfig(config: GeneratorConfig): void
```

**参数：**
- `config` (GeneratorConfig): 生成器配置

**异常：**
- `Error`: 存储失败或容量不足

### loadConfig

加载生成器配置。

```typescript
function loadConfig(): GeneratorConfig | null
```

**返回：**
- `GeneratorConfig | null`: 配置对象，如果不存在则返回null

---

## 渲染服务 (RenderService)

位置：`src/services/renderService.ts`

### generateImage

生成Best10图片。

```typescript
function generateImage(
  books: BookEntry[],
  config: GeneratorConfig
): Promise<Blob>
```

**参数：**
- `books` (BookEntry[]): 书籍列表
- `config` (GeneratorConfig): 生成器配置

**返回：**
- `Promise<Blob>`: 图片Blob对象

**异常：**
- `Error`: 生成失败

**示例：**
```typescript
import { generateImage } from './services/renderService';

const blob = await generateImage(books, config);
const url = URL.createObjectURL(blob);
```

### preloadImages

预加载图片。

```typescript
function preloadImages(urls: string[]): Promise<HTMLImageElement[]>
```

**参数：**
- `urls` (string[]): 图片URL数组

**返回：**
- `Promise<HTMLImageElement[]>`: 加载完成的图片元素数组

**示例：**
```typescript
import { preloadImages } from './services/renderService';

const images = await preloadImages([
  'https://example.com/cover1.jpg',
  'https://example.com/cover2.jpg',
]);
```

### downloadImage

下载图片。

```typescript
function downloadImage(blob: Blob, filename: string): void
```

**参数：**
- `blob` (Blob): 图片Blob对象
- `filename` (string): 文件名

**示例：**
```typescript
import { downloadImage } from './services/renderService';

downloadImage(blob, 'my-best10.png');
```

### generateAndDownload

生成并下载图片。

```typescript
function generateAndDownload(
  books: BookEntry[],
  config: GeneratorConfig,
  filename?: string,
  format?: 'png' | 'jpeg'
): Promise<void>
```

**参数：**
- `books` (BookEntry[]): 书籍列表
- `config` (GeneratorConfig): 生成器配置
- `filename` (string, 可选): 文件名，默认'best10.png'
- `format` ('png' | 'jpeg', 可选): 图片格式，默认'png'

**示例：**
```typescript
import { generateAndDownload } from './services/renderService';

await generateAndDownload(books, config, 'my-best10.jpg', 'jpeg');
```

### clearImageCache

清除图片缓存。

```typescript
function clearImageCache(): void
```

---

## Context API

位置：`src/contexts/Best10Context.tsx`

### Best10Provider

全局状态提供者。

```typescript
function Best10Provider({ children }: { children: React.ReactNode }): JSX.Element
```

**示例：**
```typescript
import { Best10Provider } from './contexts/Best10Context';

function App() {
  return (
    <Best10Provider>
      <YourComponents />
    </Best10Provider>
  );
}
```

### useBest10

使用Best10上下文。

```typescript
function useBest10(): Best10ContextType
```

**返回：**
```typescript
interface Best10ContextType {
  books: BookEntry[];
  currentSearchIndex: number | null;
  error: string | null;
  isLoading: boolean;
  config: GeneratorConfig;
  
  updateBookName: (index: number, name: string) => void;
  setCurrentSearchIndex: (index: number | null) => void;
  selectBook: (index: number, book: DoubanBook) => void;
  removeBook: (index: number) => void;
  reorderBooks: (fromIndex: number, toIndex: number) => void;
  uploadCustomCover: (index: number, file: File) => Promise<void>;
  updateConfig: (config: Partial<GeneratorConfig>) => void;
  clearAllBooks: () => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}
```

**示例：**
```typescript
import { useBest10 } from './contexts/Best10Context';

function MyComponent() {
  const { books, updateBookName } = useBest10();
  
  return (
    <input
      value={books[0].bookName}
      onChange={(e) => updateBookName(0, e.target.value)}
    />
  );
}
```

---

## 数据模型

位置：`src/types/models.ts`

### DoubanBook

豆瓣书籍信息。

```typescript
interface DoubanBook {
  id: string;
  title: string;
  author: string[];
  publisher: string;
  pubdate: string;
  coverUrl: string;
  coverLargeUrl?: string;
  rating: number;
  isbn: string;
}
```

### BookEntry

书籍条目。

```typescript
interface BookEntry {
  rank: number;
  bookName: string;
  selectedBook?: DoubanBook;
  customCover?: string;
  isSearching: boolean;
  searchResults?: DoubanBook[];
}
```

### GeneratorConfig

生成器配置。

```typescript
interface GeneratorConfig {
  title: string;
  subtitle?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  template: TemplateType;
  fontSize: FontSizeConfig;
  layout: LayoutConfig;
}

type TemplateType = 'classic' | 'modern' | 'minimal';

interface FontSizeConfig {
  title: number;
  rank: number;
  bookName: number;
}

interface LayoutConfig {
  width: number;
  height: number;
  padding: number;
  spacing: number;
}
```

### Best10List

Best10列表。

```typescript
interface Best10List {
  id: string;
  name: string;
  books: BookEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 常量

位置：`src/types/constants.ts`

### API_CONSTANTS

API相关常量。

```typescript
const API_CONSTANTS = {
  DOUBAN_BASE_URL: 'https://douban.uieee.com/v2/book',
  SEARCH_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 2,
  MAX_SEARCH_RESULTS: 5,
};
```

### IMAGE_CONSTANTS

图片相关常量。

```typescript
const IMAGE_CONSTANTS = {
  DEFAULT_COVER_PLACEHOLDER: '/placeholder-cover.png',
  EXPORT_QUALITY: 1.0,
  JPEG_QUALITY: 0.9,
};
```

### DEFAULT_CONFIG

默认生成器配置。

```typescript
const DEFAULT_CONFIG: GeneratorConfig = {
  title: '我的Best10书单',
  backgroundColor: '#DC143C',
  textColor: '#FFD700',
  accentColor: '#FFD700',
  template: 'classic',
  fontSize: {
    title: 48,
    rank: 64,
    bookName: 28,
  },
  layout: {
    width: 1080,
    height: 1920,
    padding: 60,
    spacing: 20,
  },
};
```

---

## 错误处理

所有服务方法都可能抛出错误。建议使用try-catch处理：

```typescript
try {
  const books = await searchBooks('三体');
} catch (error) {
  if (error instanceof DoubanAPIError) {
    // 处理API错误
    console.error(error.getUserMessage());
  } else if (error instanceof Error) {
    // 处理其他错误
    console.error(error.message);
  }
}
```

---

## 最佳实践

1. **使用TypeScript类型**
   ```typescript
   import type { BookEntry, GeneratorConfig } from './types/models';
   ```

2. **错误处理**
   ```typescript
   try {
     await operation();
   } catch (error) {
     handleError(error);
   }
   ```

3. **使用Context**
   ```typescript
   const { books, updateBookName } = useBest10();
   ```

4. **异步操作**
   ```typescript
   const blob = await generateImage(books, config);
   ```

---

## 版本兼容性

- React >= 19.0
- TypeScript >= 5.0
- 现代浏览器（支持Canvas API和LocalStorage）

---

## 更多信息

- [README.md](./README.md) - 项目概述
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- [设计文档](./.kiro/specs/book-best10-generator/design.md) - 详细设计
