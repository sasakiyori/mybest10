# 图片搜索功能

## 概述

为了应对豆瓣API可能不可用的情况，我们添加了百度图片搜索作为备选方案。用户现在可以在两种搜索方式之间自由切换。

## 主要变更

### 1. 新增服务

**文件**: `src/services/imageSearchService.ts`

- `searchBookCoverImages(bookName: string)` - 搜索书籍封面图片
- `ImageSearchResult` - 图片搜索结果类型
- `ImageSearchError` - 图片搜索错误类型

### 2. 更新组件

**文件**: `src/components/BookSearchModal.tsx`

- 添加搜索模式切换（豆瓣搜索 / 图片搜索）
- 新增 `DoubanSearchResults` 子组件
- 新增 `ImageSearchResults` 子组件
- 支持图片选择和应用

### 3. 用户界面

搜索弹窗现在包含两个标签页：

1. **豆瓣搜索**
   - 显示完整的书籍信息
   - 包含作者、出版社、评分等
   - 列表形式展示

2. **图片搜索**
   - 显示5张封面图片
   - 网格形式展示
   - 显示图片来源

## 使用流程

```
用户输入书名
    ↓
点击搜索按钮
    ↓
选择搜索方式
    ├─→ 豆瓣搜索 → 选择书籍 → 应用
    └─→ 图片搜索 → 选择图片 → 应用
```

## 技术实现

### 搜索查询格式

```typescript
const searchQuery = `《${bookName.trim()}》 封面`;
```

### 降级策略

```
尝试百度图片搜索
    ↓
失败？
    ├─→ 是 → 使用模拟数据（5张SVG占位图）
    └─→ 否 → 返回搜索结果
```

### 数据转换

图片搜索结果会被转换为临时的 `DoubanBook` 对象：

```typescript
const tempBook: DoubanBook = {
  id: image.id,
  title: searchQuery,
  author: [],
  publisher: '',
  pubdate: '',
  coverUrl: image.imageUrl,
  coverLargeUrl: image.imageUrl,
  rating: 0,
  isbn: '',
};
```

## 测试覆盖

- ✅ 单元测试：`src/services/imageSearchService.test.ts`
- ✅ 属性测试：现有的 BookSearchModal 属性测试仍然通过
- ✅ 集成测试：现有的端到端测试仍然通过

## 文档更新

- ✅ API.md - 添加图片搜索服务文档
- ✅ README.md - 更新功能特性和使用指南
- ✅ CHANGELOG.md - 记录新功能
- ✅ docs/image-search-guide.md - 详细使用指南
- ✅ examples/image-search-example.tsx - 代码示例

## 配置选项

在 `src/types/constants.ts` 中：

```typescript
export const API_CONSTANTS = {
  USE_MOCK_DATA: true,  // 控制是否使用模拟数据
  // ...
};
```

## 未来改进

1. 支持更多图片搜索引擎（Google、Bing等）
2. 图片质量评估和排序
3. 图片缓存优化
4. 支持用户上传本地图片
5. OCR识别书名功能

## 相关文件

### 核心文件
- `src/services/imageSearchService.ts` - 图片搜索服务
- `src/components/BookSearchModal.tsx` - 搜索弹窗组件

### 测试文件
- `src/services/imageSearchService.test.ts` - 单元测试

### 文档文件
- `docs/image-search-guide.md` - 使用指南
- `examples/image-search-example.tsx` - 代码示例

### 更新文件
- `API.md` - API文档
- `README.md` - 项目说明
- `CHANGELOG.md` - 更新日志

## 兼容性

- ✅ 向后兼容：不影响现有功能
- ✅ 测试通过：所有现有测试仍然通过
- ✅ 类型安全：完整的TypeScript类型定义
- ✅ 错误处理：友好的错误提示

## 性能影响

- 图片搜索是独立的，不影响豆瓣搜索性能
- 使用懒加载，只在切换到图片搜索标签时才执行搜索
- 模拟数据降级确保用户体验不中断

## 安全考虑

- 所有用户输入都经过验证和编码
- 图片URL使用HTTPS
- 错误信息不暴露敏感信息
- 遵循同源策略和CORS规范
