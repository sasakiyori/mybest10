/**
 * 图片搜索与缓存后端服务
 * 用于抓取百度/豆瓣图片并缓存到本地
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 图片缓存目录
const CACHE_DIR = path.join(__dirname, 'image-cache');

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// 启用 CORS
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供缓存的图片
app.use('/images', express.static(CACHE_DIR));

/**
 * 生成图片文件名的哈希
 */
function getImageHash(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * 下载图片并缓存到本地
 */
async function downloadAndCacheImage(imageUrl) {
  const hash = getImageHash(imageUrl);
  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
  const filename = `${hash}${ext}`;
  const filepath = path.join(CACHE_DIR, filename);

  // 如果已经缓存，直接返回
  if (fs.existsSync(filepath)) {
    console.log(`缓存命中: ${filename}`);
    return `/images/${filename}`;
  }

  // 根据图片URL选择合适的 Referer
  let referer = 'https://www.baidu.com/';
  if (imageUrl.includes('doubanio.com') || imageUrl.includes('douban.com')) {
    referer = 'https://book.douban.com/';
  }

  try {
    console.log(`下载图片: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.buffer();
    
    // 验证是否为有效图片（检查文件头）
    if (buffer.length < 100) {
      throw new Error('图片太小，可能无效');
    }

    fs.writeFileSync(filepath, buffer);
    console.log(`图片已缓存: ${filename} (${buffer.length} bytes)`);
    
    return `/images/${filename}`;
  } catch (error) {
    console.error(`下载图片失败: ${imageUrl}`, error.message);
    return null;
  }
}

/**
 * 从百度图片搜索获取图片（只选择豆瓣来源）
 */
async function searchBaiduImages(query) {
  const results = [];
  // 搜索关键词加上"豆瓣"来限定图片来源
  const searchUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&word=${encodeURIComponent(query + ' 豆瓣 封面')}&pn=0&rn=50`;

  try {
    console.log(`百度图片搜索(豆瓣源): ${query}`);
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://image.baidu.com/',
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      // 过滤只保留豆瓣来源的图片
      const doubanItems = data.data.filter(item => {
        if (!item || typeof item !== 'object') return false;
        
        // 检查所有可能包含来源信息的字段
        const fieldsToCheck = [
          item.fromURL,
          item.fromPageTitleEnc,
          item.fromPageTitle,
          item.replaceUrl,
          item.thumbURL,
          item.middleURL,
          item.objURL,
          item.hoverURL,
          JSON.stringify(item),  // 检查整个对象
        ].filter(Boolean).join(' ').toLowerCase();
        
        // 检查是否来自豆瓣
        return fieldsToCheck.includes('douban');
      });
      
      console.log(`找到 ${doubanItems.length} 个豆瓣图片结果`);
      
      // 如果没有找到豆瓣结果，打印第一个结果用于调试
      if (doubanItems.length === 0 && data.data.length > 0 && data.data[0]) {
        console.log('调试 - 第一个百度图片结果字段:', Object.keys(data.data[0]).join(', '));
      }
      
      for (const item of doubanItems.slice(0, 10)) {
        if (item.thumbURL || item.middleURL) {
          const imageUrl = item.middleURL || item.thumbURL;
          const localUrl = await downloadAndCacheImage(imageUrl);
          
          if (localUrl) {
            results.push({
              id: `baidu-${results.length}-${Date.now()}`,
              thumbnailUrl: localUrl,
              imageUrl: localUrl,
              title: item.fromPageTitle || `${query} - 图片 ${results.length + 1}`,
              source: '百度图片(豆瓣)',
            });
          }
        }
        
        if (results.length >= 5) break;
      }
    }

    console.log(`百度图片搜索结果: ${results.length} 张`);
  } catch (error) {
    console.error('百度图片搜索失败:', error.message);
  }

  return results;
}

/**
 * 从豆瓣搜索获取书籍封面
 */
async function searchDoubanImages(query) {
  const results = [];
  const searchUrl = `https://www.douban.com/search?cat=1001&q=${encodeURIComponent(query)}`;

  try {
    console.log(`豆瓣搜索: ${query}`);
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 解析豆瓣搜索结果中的封面图片
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('doubanio.com') && results.length < 3) {
        // 获取大图URL
        const largeCoverUrl = src.replace(/\/s\//, '/l/').replace(/\/m\//, '/l/');
        
        // 下载并缓存图片（同步处理）
        results.push({
          originalUrl: largeCoverUrl,
          thumbnailUrl: src,
        });
      }
    });

    console.log(`豆瓣找到 ${results.length} 张图片，开始下载...`);

    // 下载所有找到的图片
    const downloadedResults = [];
    for (const item of results) {
      const localUrl = await downloadAndCacheImage(item.originalUrl);
      if (localUrl) {
        downloadedResults.push({
          id: `douban-${downloadedResults.length}-${Date.now()}`,
          thumbnailUrl: localUrl,
          imageUrl: localUrl,
          title: `${query} - 豆瓣 ${downloadedResults.length + 1}`,
          source: '豆瓣',
        });
      }
    }

    console.log(`豆瓣图片下载完成: ${downloadedResults.length} 张`);
    return downloadedResults;
  } catch (error) {
    console.error('豆瓣搜索失败:', error.message);
    return [];
  }
}

/**
 * 从 Open Library 搜索
 */
async function searchOpenLibrary(query) {
  const results = [];

  try {
    console.log(`Open Library 搜索: ${query}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3`,
      { timeout: 15000 }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.docs && Array.isArray(data.docs)) {
      for (const doc of data.docs.slice(0, 3)) {
        if (doc.cover_i) {
          const coverId = doc.cover_i;
          const imageUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          const localUrl = await downloadAndCacheImage(imageUrl);

          if (localUrl) {
            results.push({
              id: `openlibrary-${coverId}-${results.length}`,
              thumbnailUrl: localUrl,
              imageUrl: localUrl,
              title: doc.title || query,
              source: 'Open Library',
            });
          }
        }
      }
    }

    console.log(`Open Library 搜索结果: ${results.length} 张`);
  } catch (error) {
    console.error('Open Library 搜索失败:', error.message);
  }

  return results;
}

/**
 * API: 搜索书籍封面图片
 */
app.get('/api/search-images', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: '请提供搜索关键词' });
  }

  const query = q.trim();
  console.log(`\n========== 开始搜索: ${query} ==========`);

  try {
    // 仅使用百度搜索（豆瓣和 Open Library 代码保留但不调用）
    const [baiduResults] = await Promise.all([
      searchBaiduImages(query),
      // searchDoubanImages(query),
      // searchOpenLibrary(query),
    ]);

    // 合并结果
    const allResults = [...baiduResults];
    
    console.log(`搜索完成，共 ${allResults.length} 张图片`);
    console.log(`========== 搜索结束 ==========\n`);

    res.json({
      success: true,
      query,
      results: allResults.slice(0, 10),
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败', message: error.message });
  }
});

/**
 * API: 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * API: 清除缓存
 */
app.delete('/api/cache', (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    }
    console.log(`清除了 ${files.length} 个缓存文件`);
    res.json({ success: true, cleared: files.length });
  } catch (error) {
    res.status(500).json({ error: '清除缓存失败', message: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     图片搜索服务已启动                           ║
║     地址: http://localhost:${PORT}               ║
║     缓存目录: ${CACHE_DIR}                       
╚════════════════════════════════════════════════╝
  `);
});
