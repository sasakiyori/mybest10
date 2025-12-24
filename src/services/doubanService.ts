/**
 * 豆瓣书籍搜索服务
 * 使用页面抓取方式获取书籍信息
 */

import type { DoubanBook } from '../types/models';
import { API_CONSTANTS } from '../types/constants';

/**
 * API错误类型
 */
export class DoubanAPIError extends Error {
  statusCode?: number;
  originalError?: unknown;
  userFriendlyMessage?: string;
  
  constructor(
    message: string,
    statusCode?: number,
    originalError?: unknown,
    userFriendlyMessage?: string
  ) {
    super(message);
    this.name = 'DoubanAPIError';
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.userFriendlyMessage = userFriendlyMessage || message;
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    return this.userFriendlyMessage || this.message;
  }
}

/**
 * CORS代理URL列表（按优先级排序）
 */
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

/**
 * 从HTML中解析书籍信息
 */
function parseDoubanSearchHTML(html: string): DoubanBook[] {
  const results: DoubanBook[] = [];
  
  try {
    // 使用正则表达式解析搜索结果
    // 豆瓣搜索页面结构: <div class="result"> 包含每本书的信息
    const bookRegex = /<div class="result"[^>]*>[\s\S]*?<div class="pic">[\s\S]*?<a[^>]*href="https:\/\/book\.douban\.com\/subject\/(\d+)\/[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/div>[\s\S]*?<div class="title">[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<span class="subject-cast">([^<]*)<\/span>[\s\S]*?(?:<span class="rating_nums">([\d.]*)<\/span>)?[\s\S]*?<\/div>/gi;
    
    let match;
    while ((match = bookRegex.exec(html)) !== null && results.length < API_CONSTANTS.MAX_SEARCH_RESULTS) {
      const [, id, coverUrl, title, info, rating] = match;
      
      // 解析作者和出版信息
      const infoParts = info.split('/').map(s => s.trim());
      const author = infoParts[0] ? [infoParts[0]] : [];
      const publisher = infoParts.length > 1 ? infoParts[infoParts.length - 2] : '';
      const pubdate = infoParts.length > 0 ? infoParts[infoParts.length - 1] : '';
      
      // 处理封面URL，获取更大的图片
      const largeCoverUrl = coverUrl.replace(/\/s\//, '/l/').replace(/\/m\//, '/l/');
      
      results.push({
        id,
        title: title.trim(),
        author,
        publisher,
        pubdate,
        coverUrl: coverUrl,
        coverLargeUrl: largeCoverUrl,
        rating: rating ? parseFloat(rating) : 0,
        isbn: '',
      });
    }
    
    // 如果上面的正则没有匹配到，尝试另一种格式（搜索结果页面可能有变化）
    if (results.length === 0) {
      // 尝试匹配 subject_search 页面格式
      const subjectRegex = /<a[^>]*href="https:\/\/book\.douban\.com\/subject\/(\d+)\/[^"]*"[^>]*class="title-text"[^>]*>([^<]+)<\/a>/gi;
      const coverRegex = /<img[^>]*src="(https:\/\/[^"]*doubanio\.com\/[^"]+)"[^>]*>/gi;
      const ratingRegex = /<span[^>]*class="rating_nums"[^>]*>([\d.]+)<\/span>/gi;
      
      const titles: {id: string; title: string}[] = [];
      const covers: string[] = [];
      const ratings: number[] = [];
      
      let m;
      while ((m = subjectRegex.exec(html)) !== null) {
        titles.push({ id: m[1], title: m[2].trim() });
      }
      while ((m = coverRegex.exec(html)) !== null) {
        covers.push(m[1]);
      }
      while ((m = ratingRegex.exec(html)) !== null) {
        ratings.push(parseFloat(m[1]));
      }
      
      for (let i = 0; i < Math.min(titles.length, API_CONSTANTS.MAX_SEARCH_RESULTS); i++) {
        const coverUrl = covers[i] || '';
        const largeCoverUrl = coverUrl.replace(/\/s\//, '/l/').replace(/\/m\//, '/l/');
        
        results.push({
          id: titles[i].id,
          title: titles[i].title,
          author: [],
          publisher: '',
          pubdate: '',
          coverUrl,
          coverLargeUrl: largeCoverUrl,
          rating: ratings[i] || 0,
          isbn: '',
        });
      }
    }
  } catch (error) {
    console.warn('解析豆瓣HTML失败:', error);
  }
  
  return results;
}

/**
 * 带超时的fetch请求
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONSTANTS.SEARCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DoubanAPIError(
        'Request timeout',
        undefined,
        error,
        '请求超时（超过5秒），请检查网络连接后重试'
      );
    }
    throw error;
  }
}

/**
 * 通过CORS代理获取页面内容
 * 会尝试多个代理直到成功
 */
async function fetchWithCorsProxy(targetUrl: string): Promise<string> {
  let lastError: Error | undefined;
  
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(targetUrl);
      const response = await fetchWithTimeout(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      }, API_CONSTANTS.SEARCH_TIMEOUT);
      
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`CORS代理 ${proxy} 失败:`, error);
      continue;
    }
  }
  
  throw new DoubanAPIError(
    'All CORS proxies failed',
    undefined,
    lastError,
    '网络请求失败，请稍后重试'
  );
}

/**
 * 模拟书籍数据（用于开发测试）
 */
const MOCK_BOOKS: Record<string, DoubanBook[]> = {
  '三体': [
    {
      id: '6518605',
      title: '三体',
      author: ['刘慈欣'],
      publisher: '重庆出版社',
      pubdate: '2008-1',
      coverUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%234A90E2" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="24"%3E三体%3C/text%3E%3C/svg%3E',
      coverLargeUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%234A90E2" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="48"%3E三体%3C/text%3E%3C/svg%3E',
      rating: 8.8,
      isbn: '9787536692930',
    },
  ],
  '活着': [
    {
      id: '1003000',
      title: '活着',
      author: ['余华'],
      publisher: '作家出版社',
      pubdate: '2012-8',
      coverUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%23E74C3C" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="24"%3E活着%3C/text%3E%3C/svg%3E',
      coverLargeUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23E74C3C" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="48"%3E活着%3C/text%3E%3C/svg%3E',
      rating: 9.1,
      isbn: '9787506365437',
    },
  ],
  '百年孤独': [
    {
      id: '6082808',
      title: '百年孤独',
      author: ['加西亚·马尔克斯'],
      publisher: '南海出版公司',
      pubdate: '2011-6',
      coverUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%2395A5A6" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="20"%3E百年孤独%3C/text%3E%3C/svg%3E',
      coverLargeUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%2395A5A6" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="40"%3E百年孤独%3C/text%3E%3C/svg%3E',
      rating: 9.2,
      isbn: '9787544253994',
    },
  ],
};

/**
 * 搜索书籍
 * 使用页面抓取方式从豆瓣获取书籍信息
 * @param query 搜索关键词
 * @returns 书籍列表（最多返回MAX_SEARCH_RESULTS个结果）
 */
export async function searchBooks(query: string): Promise<DoubanBook[]> {
  // 验证输入：检查空字符串、纯空格、以及包含null字符的字符串
  if (!query || query.trim().length === 0 || query.includes('\0')) {
    throw new DoubanAPIError(
      'Empty search query',
      undefined,
      undefined,
      '搜索关键词不能为空，请输入书名'
    );
  }

  // 如果启用模拟数据
  if (API_CONSTANTS.USE_MOCK_DATA) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const trimmedQuery = query.trim();
    
    // 精确匹配
    if (MOCK_BOOKS[trimmedQuery]) {
      return MOCK_BOOKS[trimmedQuery];
    }
    
    // 模糊匹配
    const results: DoubanBook[] = [];
    for (const [key, books] of Object.entries(MOCK_BOOKS)) {
      if (key.includes(trimmedQuery) || trimmedQuery.includes(key)) {
        results.push(...books);
      }
    }
    
    if (results.length > 0) {
      return results.slice(0, API_CONSTANTS.MAX_SEARCH_RESULTS);
    }
    
    // 如果没有匹配，返回一个通用的模拟结果
    return [{
      id: `mock-${Date.now()}`,
      title: trimmedQuery,
      author: ['作者未知'],
      publisher: '出版社未知',
      pubdate: new Date().getFullYear().toString(),
      coverUrl: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%239B59B6" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="20"%3E${encodeURIComponent(trimmedQuery)}%3C/text%3E%3C/svg%3E`,
      coverLargeUrl: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%239B59B6" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="40"%3E${encodeURIComponent(trimmedQuery)}%3C/text%3E%3C/svg%3E`,
      rating: 0,
      isbn: '',
    }];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    // 使用豆瓣搜索页面进行抓取
    const searchUrl = `https://www.douban.com/search?cat=1001&q=${encodedQuery}`;
    
    const html = await fetchWithCorsProxy(searchUrl);
    const books = parseDoubanSearchHTML(html);
    
    if (books.length === 0) {
      // 如果没有找到结果，返回空数组
      return [];
    }
    
    return books;
  } catch (error) {
    if (error instanceof DoubanAPIError) {
      throw error;
    }
    
    // 处理其他未知错误
    throw new DoubanAPIError(
      'Search failed',
      undefined,
      error,
      '搜索失败，请稍后重试。如果问题持续，请尝试其他关键词。'
    );
  }
}

/**
 * 从HTML中解析书籍详情
 */
function parseDoubanBookDetailHTML(html: string, id: string): DoubanBook | null {
  try {
    // 解析标题
    const titleMatch = html.match(/<span[^>]*property="v:itemreviewed"[^>]*>([^<]+)<\/span>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // 解析封面图片
    const coverMatch = html.match(/<a[^>]*class="nbg"[^>]*href="([^"]+)"[^>]*>/i);
    const coverLargeUrl = coverMatch ? coverMatch[1] : '';
    const coverUrl = coverLargeUrl.replace('/l/', '/m/');
    
    // 解析评分
    const ratingMatch = html.match(/<strong[^>]*class="rating_num"[^>]*>([\d.]+)<\/strong>/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    
    // 解析作者
    const authorMatch = html.match(/作者[^<]*<\/span>[\s]*<a[^>]*>([^<]+)<\/a>/i);
    const author = authorMatch ? [authorMatch[1].trim()] : [];
    
    // 解析出版社
    const publisherMatch = html.match(/出版社:[\s]*<\/span>[\s]*<a[^>]*>([^<]+)<\/a>/i) || 
                           html.match(/出版社:[\s]*<\/span>[\s]*([^<]+)/i);
    const publisher = publisherMatch ? publisherMatch[1].trim() : '';
    
    // 解析出版日期
    const pubdateMatch = html.match(/出版年:[\s]*<\/span>[\s]*([^<\n]+)/i);
    const pubdate = pubdateMatch ? pubdateMatch[1].trim() : '';
    
    // 解析ISBN
    const isbnMatch = html.match(/ISBN:[\s]*<\/span>[\s]*([\d-]+)/i);
    const isbn = isbnMatch ? isbnMatch[1].replace(/-/g, '') : '';
    
    if (!title) {
      return null;
    }
    
    return {
      id,
      title,
      author,
      publisher,
      pubdate,
      coverUrl,
      coverLargeUrl,
      rating,
      isbn,
    };
  } catch (error) {
    console.warn('解析豆瓣书籍详情HTML失败:', error);
    return null;
  }
}

/**
 * 获取书籍详情
 * 使用页面抓取方式从豆瓣获取书籍详情
 * @param id 豆瓣书籍ID
 * @returns 书籍详情
 */
export async function getBookDetail(id: string): Promise<DoubanBook> {
  // 验证输入：检查空字符串、纯空格、以及包含null字符的字符串
  if (!id || id.trim().length === 0 || id.includes('\0')) {
    throw new DoubanAPIError(
      'Empty book ID',
      undefined,
      undefined,
      '书籍ID无效'
    );
  }

  try {
    const detailUrl = `https://book.douban.com/subject/${id}/`;
    const html = await fetchWithCorsProxy(detailUrl);
    const book = parseDoubanBookDetailHTML(html, id);
    
    if (!book) {
      throw new DoubanAPIError(
        'Failed to parse book detail',
        undefined,
        undefined,
        '无法解析书籍信息'
      );
    }
    
    return book;
  } catch (error) {
    if (error instanceof DoubanAPIError) {
      throw error;
    }
    
    throw new DoubanAPIError(
      'Failed to get book detail',
      undefined,
      error,
      '获取书籍详情失败，请稍后重试'
    );
  }
}

/**
 * 豆瓣服务接口（用于依赖注入和测试）
 */
export interface DoubanService {
  searchBooks(query: string): Promise<DoubanBook[]>;
  getBookDetail(id: string): Promise<DoubanBook>;
}

/**
 * 默认豆瓣服务实例
 */
export const doubanService: DoubanService = {
  searchBooks,
  getBookDetail,
};
