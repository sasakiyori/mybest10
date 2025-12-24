# 图片搜索来源说明

## 概述

图片搜索功能从四个不同的来源获取书籍封面图片，以提高搜索成功率和图片质量。

## 搜索来源

### 1. 豆瓣图片 (Douban)

**API地址**: `https://douban.uieee.com/v2/book/search`

**优点**:
- 中文书籍覆盖全面
- 图片质量高
- 包含完整的书籍信息

**缺点**:
- 可能受网络限制
- API稳定性依赖第三方代理

**返回数据示例**:
```json
{
  "books": [
    {
      "id": "6518605",
      "title": "三体",
      "images": {
        "small": "https://...",
        "medium": "https://...",
        "large": "https://..."
      }
    }
  ]
}
```

### 2. 百度图片 (Baidu Images)

**API地址**: `https://image.baidu.com/search/acjson`

**优点**:
- 中文书籍图片资源丰富
- 搜索结果多样化
- 响应速度快
- 无需API密钥

**缺点**:
- 非官方API，可能不稳定
- 图片质量参差不齐
- 可能受网络限制

**返回数据示例**:
```json
{
  "data": [
    {
      "thumbURL": "https://...",
      "middleURL": "https://...",
      "objURL": "https://...",
      "fromPageTitleEnc": "三体"
    }
  ]
}
```

**搜索策略**:
- 自动在书名后添加"书籍封面"关键词
- 提高搜索准确度

### 3. Google Books API

**API地址**: `https://www.googleapis.com/books/v1/volumes`

**优点**:
- 全球书籍覆盖广
- API稳定可靠
- 无需API密钥（有配额限制）
- 支持多语言

**缺点**:
- 中文书籍相对较少
- 图片尺寸可能较小

**返回数据示例**:
```json
{
  "items": [
    {
      "id": "abc123",
      "volumeInfo": {
        "title": "The Three-Body Problem",
        "imageLinks": {
          "thumbnail": "http://...",
          "small": "http://...",
          "medium": "http://...",
          "large": "http://..."
        }
      }
    }
  ]
}
```

**图片URL优化**:
- 自动将 `http://` 替换为 `https://`
- 将 `&zoom=1` 替换为 `&zoom=3` 获取更大的图片

### 4. Open Library

**API地址**: `https://openlibrary.org/search.json`

**优点**:
- 开放数据源，完全免费
- 无需API密钥
- 图片资源丰富
- 支持多语言

**缺点**:
- 中文书籍相对较少
- 图片质量参差不齐

**返回数据示例**:
```json
{
  "docs": [
    {
      "title": "The Three-Body Problem",
      "cover_i": 12345678
    }
  ]
}
```

**封面URL格式**:
- 缩略图: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
- 大图: `https://covers.openlibrary.org/b/id/{cover_i}-L.jpg`

## 搜索策略

### 并行搜索

使用 `Promise.allSettled()` 同时请求四个来源：

```typescript
const results = await Promise.allSettled([
  searchFromDoubanImages(bookName),
  searchFromBaiduImages(bookName),
  searchFromGoogleBooks(bookName),
  searchFromOpenLibrary(bookName),
]);
```

**优点**:
- 提高搜索速度
- 即使某个来源失败，其他来源仍可返回结果
- 最大化搜索成功率

### 结果合并

1. 收集所有成功的搜索结果
2. 按来源顺序合并（豆瓣 → 百度图片 → Google Books → Open Library）
3. 返回前5张图片

```typescript
const allImages: ImageSearchResult[] = [];
results.forEach((result) => {
  if (result.status === 'fulfilled' && result.value.length > 0) {
    allImages.push(...result.value);
  }
});

return allImages.slice(0, 5);
```

### 降级策略

如果所有来源都失败：

```typescript
if (allImages.length === 0) {
  console.warn('所有图片搜索来源都失败，使用模拟数据');
  return generateMockImages(bookName);
}
```

## 使用建议

### 1. 中文书籍

优先级：豆瓣 > 百度图片 > Open Library > Google Books

```typescript
// 豆瓣和百度图片对中文书籍支持最好
searchFromDoubanImages('三体');
searchFromBaiduImages('三体');
```

### 2. 英文书籍

优先级：Google Books > Open Library > 豆瓣 > 百度图片

```typescript
// Google Books对英文书籍支持最好
searchFromGoogleBooks('The Three-Body Problem');
```

### 3. 多语言书籍

使用并行搜索，让系统自动选择最佳结果：

```typescript
searchBookCoverImages('百年孤独');
// 会同时搜索所有来源（豆瓣、百度图片、Google Books、Open Library），返回最佳结果
```

## API限制

### Google Books API

- **配额**: 每天1000次请求（免费）
- **速率限制**: 每秒100次请求
- **无需密钥**: 基础搜索不需要API密钥

如需更高配额，可以申请API密钥：
```typescript
const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=YOUR_API_KEY`;
```

### Open Library

- **无配额限制**: 完全开放
- **建议**: 合理使用，避免过度请求
- **速率限制**: 建议每秒不超过10次请求

### 豆瓣API

- **第三方代理**: 使用 `douban.uieee.com`
- **稳定性**: 依赖第三方服务
- **备选方案**: 如果不可用，会自动使用其他来源

### 百度图片

- **非官方API**: 使用 `image.baidu.com/search/acjson`
- **无配额限制**: 但建议合理使用
- **稳定性**: 可能随时变化，建议作为备选方案
- **速率限制**: 建议每秒不超过10次请求

## 错误处理

每个搜索函数都有独立的错误处理：

```typescript
async function searchFromDouban(bookName: string): Promise<ImageSearchResult[]> {
  try {
    // 搜索逻辑
    return results;
  } catch (error) {
    console.warn('豆瓣图片搜索失败:', error);
    return []; // 返回空数组，不影响其他来源
  }
}
```

## 性能优化

### 1. 并行请求

使用 `Promise.allSettled()` 而不是 `Promise.all()`：
- 即使某个请求失败，其他请求仍继续
- 不会因为一个失败而导致全部失败

### 2. 结果限制

每个来源最多返回3个结果：
- 减少数据传输量
- 提高响应速度
- 最终合并后返回前5个

### 3. 图片优化

- 使用缩略图作为预览
- 只在需要时加载大图
- 自动转换为HTTPS

## 测试

使用提供的测试页面验证各个来源：

```bash
# 在浏览器中打开
open test-image-search.html
```

测试不同类型的书籍：
- 中文书籍：三体、活着、百年孤独
- 英文书籍：The Three-Body Problem, 1984
- 多语言：百年孤独 / One Hundred Years of Solitude

## 未来改进

1. **添加更多来源**
   - Goodreads API
   - Amazon Product API
   - 国家图书馆API

2. **智能选择**
   - 根据书名语言自动选择最佳来源
   - 图片质量评分
   - 用户偏好记忆

3. **缓存优化**
   - 本地缓存搜索结果
   - 减少重复请求
   - 提高响应速度

4. **图片处理**
   - 自动裁剪和优化
   - 统一尺寸和格式
   - 水印去除

## 相关文档

- [图片搜索使用指南](./image-search-guide.md)
- [API文档](../API.md)
- [功能说明](./feature-image-search.md)
