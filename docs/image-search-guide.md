# 图片搜索功能使用指南

## 概述

当豆瓣API不可用或搜索结果不理想时，可以使用图片搜索作为备选方案来获取书籍封面。图片搜索会从多个来源获取封面图片：

- **豆瓣图片** - 从豆瓣API获取书籍封面
- **百度图片** - 从百度图片搜索获取封面，中文书籍资源丰富
- **Google Books** - 从Google Books API获取封面
- **Open Library** - 从Open Library获取封面

## 功能特点

- 支持两种搜索方式：豆瓣搜索和图片搜索
- 多来源并行搜索（豆瓣、百度图片、Google Books、Open Library），提高成功率
- 返回前8张最相关的图片
- 支持图片预览和选择
- 降级策略：当所有来源都失败时，自动使用模拟数据

## 使用方法

### 1. 在搜索弹窗中切换搜索模式

当打开书籍搜索弹窗时，你会看到两个标签页：

- **豆瓣搜索**：搜索豆瓣书籍数据库，获取完整的书籍信息
- **图片搜索**：从多个来源（豆瓣、百度图片、Google Books、Open Library）搜索书籍封面

### 2. 使用图片搜索

1. 点击"图片搜索"标签
2. 系统会自动搜索"《书名》 封面"
3. 浏览返回的5张图片
4. 点击选择你喜欢的封面

### 3. 图片显示

图片搜索结果以网格形式显示：
- 每张图片显示缩略图
- 显示图片标题和来源
- 点击图片即可选择

## 技术实现

### 多来源搜索策略

图片搜索会同时尝试三个来源：

```typescript
const results = await Promise.allSettled([
  searchFromDoubanImages(bookName),    // 豆瓣图片
  searchFromGoogleBooks(bookName),     // Google Books
  searchFromOpenLibrary(bookName),     // Open Library
]);
```

### 各来源特点

1. **豆瓣图片**
   - 中文书籍覆盖好
   - 图片质量高
   - 可能受网络限制

2. **Google Books**
   - 全球书籍覆盖广
   - API稳定可靠
   - 支持多语言

3. **Open Library**
   - 开放数据源
   - 无需API密钥
   - 图片资源丰富

### 搜索查询格式

不同来源使用不同的查询方式：

```typescript
// 豆瓣：直接搜索书名
const doubanUrl = `https://douban.uieee.com/v2/book/search?q=${bookName}`;

// Google Books：使用books API
const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${bookName}`;

// Open Library：使用search API
const openLibraryUrl = `https://openlibrary.org/search.json?q=${bookName}`;
```

### API调用示例

```typescript
import { searchBookCoverImages } from './services/imageSearchService';

try {
  const images = await searchBookCoverImages('三体');
  console.log(`找到 ${images.length} 张图片`);
  
  images.forEach(image => {
    console.log(`- ${image.title} (来源: ${image.source})`);
  });
} catch (error) {
  console.error('搜索失败:', error.getUserMessage());
}
```

### 返回数据结构

```typescript
interface ImageSearchResult {
  id: string;           // 唯一标识符
  thumbnailUrl: string; // 缩略图URL（用于列表显示）
  imageUrl: string;     // 原图URL（用于实际使用）
  title: string;        // 图片标题
  source: string;       // 来源网站
}
```

## 降级策略

当所有图片搜索来源都不可用时，系统会自动生成模拟数据：

1. 生成5张不同颜色的SVG占位图
2. 每张图片包含书名文字
3. 确保用户体验不中断

```
尝试豆瓣图片 ──┐
尝试Google Books ──┼──> 合并结果 ──> 返回前5张
尝试Open Library ──┘
         ↓
    全部失败？
         ↓
   使用模拟数据
```

## 最佳实践

### 1. 优先使用豆瓣搜索

豆瓣搜索提供完整的书籍信息（作者、出版社、评分等），建议优先使用。

### 2. 图片搜索适用场景

- 豆瓣API不可用
- 豆瓣搜索无结果
- 需要特定版本的封面
- 想要更多封面选择

### 3. 组合使用

```typescript
// 先尝试豆瓣搜索
try {
  const books = await searchBooks('三体');
  if (books.length > 0) {
    // 使用豆瓣结果
    return books;
  }
} catch (error) {
  // 豆瓣失败，降级到图片搜索
  console.log('豆瓣搜索失败，使用图片搜索');
}

// 使用图片搜索
const images = await searchBookCoverImages('三体');
```

## 注意事项

### 1. 网络依赖

图片搜索依赖外部API，可能受到以下因素影响：
- 网络连接状态
- API服务可用性
- 跨域限制

### 2. 图片质量

- 搜索结果的图片质量可能不一致
- 建议预览后再选择
- 可以多次搜索获取不同结果

### 3. 版权问题

- 图片来自互联网，使用时请注意版权
- 仅用于个人学习和非商业用途
- 商业使用请获取授权

## 故障排查

### 问题：搜索无结果

**可能原因：**
- 书名输入不准确
- 网络连接问题
- API服务暂时不可用

**解决方案：**
1. 检查书名拼写
2. 尝试使用简化的书名（去掉书名号）
3. 检查网络连接
4. 稍后重试

### 问题：图片加载失败

**可能原因：**
- 图片URL失效
- 网络连接问题
- 跨域限制

**解决方案：**
1. 刷新页面重试
2. 选择其他图片
3. 切换到豆瓣搜索

### 问题：搜索速度慢

**可能原因：**
- 网络速度慢
- API响应慢

**解决方案：**
1. 等待搜索完成
2. 检查网络连接
3. 使用豆瓣搜索（通常更快）

## 开发者信息

### 配置选项

在 `src/types/constants.ts` 中可以配置：

```typescript
export const API_CONSTANTS = {
  USE_MOCK_DATA: true,  // 是否使用模拟数据
  // ... 其他配置
};
```

### 扩展功能

如果需要支持其他图片搜索引擎，可以：

1. 在 `imageSearchService.ts` 中添加新的搜索函数
2. 修改 `BookSearchModal.tsx` 添加新的标签页
3. 更新类型定义

### 测试

运行图片搜索服务测试：

```bash
npm test src/services/imageSearchService.test.ts
```

## 更新日志

### v1.0.0 (2024-02-14)
- 初始版本
- 支持百度图片搜索
- 支持模拟数据降级
- 集成到搜索弹窗

## 相关文档

- [API文档](../API.md)
- [贡献指南](../CONTRIBUTING.md)
- [设计文档](../.kiro/specs/book-best10-generator/design.md)
