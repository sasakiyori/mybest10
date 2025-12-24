/**
 * 图片搜索功能示例
 * 演示如何使用图片搜索服务
 */

import React, { useState } from 'react';
import { searchBookCoverImages, type ImageSearchResult } from '../src/services/imageSearchService';

/**
 * 图片搜索示例组件
 */
export function ImageSearchExample() {
  const [bookName, setBookName] = useState('');
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 执行搜索
   */
  const handleSearch = async () => {
    if (!bookName.trim()) {
      setError('请输入书名');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const images = await searchBookCoverImages(bookName);
      setResults(images);
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error && 'getUserMessage' in err) {
        setError((err as { getUserMessage: () => string }).getUserMessage());
      } else {
        setError('搜索失败');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">图片搜索示例</h1>

      {/* 搜索输入 */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入书名，例如：三体"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            找到 {results.length} 张图片
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((image) => (
              <div
                key={image.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[2/3] bg-gray-100">
                  <img
                    src={image.thumbnailUrl}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{image.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    来源: {image.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">使用说明</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• 输入书名后点击"搜索"按钮</li>
          <li>• 系统会自动在搜索查询中添加"封面"关键词</li>
          <li>• 返回最多5张相关图片</li>
          <li>• 点击图片可以查看详情</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">代码示例</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`import { searchBookCoverImages } from './services/imageSearchService';

// 搜索书籍封面
const images = await searchBookCoverImages('三体');

// 处理结果
images.forEach(image => {
  console.log(\`\${image.title} - \${image.source}\`);
});`}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * 对比搜索示例
 * 演示豆瓣搜索和图片搜索的组合使用
 */
export function ComparisonExample() {
  const [bookName, setBookName] = useState('');
  const [doubanResults, setDoubanResults] = useState<{ id: string; title: string; coverUrl?: string }[]>([]);
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!bookName.trim()) return;

    setLoading(true);

    // 同时执行两种搜索
    try {
      const [douban, images] = await Promise.all([
        import('../src/services/doubanService').then(m => m.searchBooks(bookName)),
        searchBookCoverImages(bookName),
      ]);

      setDoubanResults(douban);
      setImageResults(images);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">搜索对比示例</h1>

      {/* 搜索输入 */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入书名进行对比搜索"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {loading ? '搜索中...' : '对比搜索'}
          </button>
        </div>
      </div>

      {/* 结果对比 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 豆瓣搜索结果 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            豆瓣搜索 ({doubanResults.length} 个结果)
          </h2>
          <div className="space-y-3">
            {doubanResults.map((book) => (
              <div key={book.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-600">
                  {book.author.join(', ')}
                </p>
                <p className="text-sm text-gray-500">
                  {book.publisher} · {book.pubdate}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 图片搜索结果 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            图片搜索 ({imageResults.length} 张图片)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {imageResults.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                <img
                  src={image.thumbnailUrl}
                  alt={image.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="p-2">
                  <p className="text-xs truncate">{image.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
