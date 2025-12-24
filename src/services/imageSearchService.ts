/**
 * 图片搜索服务
 * 优先使用后端服务器抓取，失败时回退到 CORS 代理
 */

import { API_CONSTANTS } from '../types/constants';

// 后端服务器地址
const BACKEND_URL = 'http://localhost:3001';

/**
 * 图片搜索结果
 */
export interface ImageSearchResult {
  id: string;
  thumbnailUrl: string;  // 缩略图URL
  imageUrl: string;      // 原图URL
  title: string;         // 图片标题
  source: string;        // 来源网站
}

/**
 * 图片搜索错误类型
 */
export class ImageSearchError extends Error {
  userFriendlyMessage?: string;
  
  constructor(
    message: string,
    userFriendlyMessage?: string
  ) {
    super(message);
    this.name = 'ImageSearchError';
    this.userFriendlyMessage = userFriendlyMessage || message;
  }

  getUserMessage(): string {
    return this.userFriendlyMessage || this.message;
  }
}

// 缓存后端可用性状态，避免重复检查
let backendAvailableCache: { available: boolean; timestamp: number } | null = null;
const BACKEND_CACHE_TTL = 30000; // 30秒缓存

/**
 * 检查后端服务器是否可用（带缓存）
 */
async function isBackendAvailable(): Promise<boolean> {
  // 检查缓存
  if (backendAvailableCache && Date.now() - backendAvailableCache.timestamp < BACKEND_CACHE_TTL) {
    return backendAvailableCache.available;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(500), // 缩短到 500ms
    });
    const available = response.ok;
    backendAvailableCache = { available, timestamp: Date.now() };
    return available;
  } catch {
    backendAvailableCache = { available: false, timestamp: Date.now() };
    return false;
  }
}

/**
 * 通过后端服务器搜索图片
 */
async function searchViaBackend(bookName: string): Promise<ImageSearchResult[]> {
  console.log('使用后端服务器搜索图片...');
  
  const response = await fetch(
    `${BACKEND_URL}/api/search-images?q=${encodeURIComponent(bookName)}`,
    {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    throw new Error(`后端返回错误: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success || !data.results) {
    throw new Error('后端返回数据格式错误');
  }

  return data.results.map((result: ImageSearchResult) => ({
    ...result,
    thumbnailUrl: result.thumbnailUrl.startsWith('http') 
      ? result.thumbnailUrl 
      : `${BACKEND_URL}${result.thumbnailUrl}`,
    imageUrl: result.imageUrl.startsWith('http') 
      ? result.imageUrl 
      : `${BACKEND_URL}${result.imageUrl}`,
  }));
}

/**
 * CORS代理URL列表（回退方案）
 */
const CORS_PROXIES = [
  { url: 'https://api.allorigins.win/get?url=', isJson: true },
  { url: 'https://corsproxy.io/?', isJson: false },
];

/**
 * 通过CORS代理获取页面内容（回退方案）
 */
async function fetchWithCorsProxy(
  targetUrl: string,
  timeout: number = API_CONSTANTS.SEARCH_TIMEOUT
): Promise<string> {
  let lastError: Error | undefined;
  
  for (const proxy of CORS_PROXIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const proxyUrl = proxy.url + encodeURIComponent(targetUrl);
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': proxy.isJson ? 'application/json' : 'text/html',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (proxy.isJson) {
          const json = await response.json();
          return json.contents || '';
        } else {
          return await response.text();
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw lastError || new Error('All CORS proxies failed');
}

/**
 * 从百度图片搜索页面解析图片（回退方案）
 */
function parseBaiduImageSearchHTML(html: string, bookName: string): ImageSearchResult[] {
  const results: ImageSearchResult[] = [];
  
  try {
    const imgRegex = /"thumbURL":"(https?:[^"]+)"|"middleURL":"(https?:[^"]+)"/gi;
    const thumbUrls: string[] = [];
    const middleUrls: string[] = [];
    
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1]) thumbUrls.push(match[1].replace(/\\\//g, '/'));
      if (match[2]) middleUrls.push(match[2].replace(/\\\//g, '/'));
    }
    
    const maxResults = 5;
    for (let i = 0; i < Math.min(maxResults, Math.max(thumbUrls.length, middleUrls.length)); i++) {
      const thumbnailUrl = thumbUrls[i] || middleUrls[i];
      const imageUrl = middleUrls[i] || thumbUrls[i];
      
      if (thumbnailUrl && imageUrl) {
        results.push({
          id: `baidu-${i}-${Date.now()}`,
          thumbnailUrl,
          imageUrl,
          title: `${bookName} - 图片 ${i + 1}`,
          source: '百度图片',
        });
      }
    }
  } catch (error) {
    console.warn('解析百度图片搜索结果失败:', error);
  }
  
  return results;
}

/**
 * 从百度图片搜索（回退方案）
 */
async function searchFromBaiduImagesFallback(bookName: string): Promise<ImageSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(`${bookName.trim()} 书籍封面`);
    const searchUrl = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodedQuery}`;
    
    const html = await fetchWithCorsProxy(searchUrl);
    return parseBaiduImageSearchHTML(html, bookName);
  } catch (error) {
    console.warn('百度图片搜索（回退）失败:', error);
    return [];
  }
}

/**
 * 通过 CORS 代理搜索（回退方案）
 * 仅使用百度图片搜索
 */
async function searchViaCorsProxy(bookName: string): Promise<ImageSearchResult[]> {
  console.log('使用 CORS 代理搜索图片（回退方案）...');

  const results = await Promise.allSettled([
    searchFromBaiduImagesFallback(bookName),
  ]);

  const allImages: ImageSearchResult[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allImages.push(...result.value);
    }
  });

  return allImages.slice(0, 5);
}

/**
 * 生成模拟图片数据（最终回退）
 */
function generateMockImages(bookName: string): ImageSearchResult[] {
  const colors = ['4A90E2', 'E74C3C', '95A5A6', '9B59B6', '2ECC71'];
  
  return colors.map((color, index) => ({
    id: `mock-${index}-${Date.now()}`,
    thumbnailUrl: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="180"%3E%3Crect fill="%23${color}" width="120" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="14"%3E${encodeURIComponent(bookName)}%3C/text%3E%3C/svg%3E`,
    imageUrl: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23${color}" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white" font-size="40"%3E${encodeURIComponent(bookName)}%3C/text%3E%3C/svg%3E`,
    title: `${bookName} - 封面 ${index + 1}`,
    source: '模拟数据',
  }));
}

/**
 * 搜索书籍封面图片
 * 优先使用后端服务器，失败时回退到 CORS 代理
 */
export async function searchBookCoverImages(bookName: string): Promise<ImageSearchResult[]> {
  if (!bookName || bookName.trim().length === 0) {
    throw new ImageSearchError('Empty book name', '书名不能为空');
  }

  if (API_CONSTANTS.USE_MOCK_DATA) {
    return generateMockImages(bookName);
  }

  console.log(`开始搜索图片: ${bookName}`);

  // 1. 首先尝试后端服务器
  const backendAvailable = await isBackendAvailable();
  
  if (backendAvailable) {
    try {
      const results = await searchViaBackend(bookName);
      if (results.length > 0) {
        console.log(`后端搜索成功，找到 ${results.length} 张图片`);
        return results;
      }
    } catch (error) {
      console.warn('后端搜索失败:', error);
    }
  } else {
    console.log('后端服务器不可用，使用回退方案');
  }

  // 2. 回退到 CORS 代理方案
  try {
    const results = await searchViaCorsProxy(bookName);
    if (results.length > 0) {
      console.log(`CORS 代理搜索成功，找到 ${results.length} 张图片`);
      return results;
    }
  } catch (error) {
    console.warn('CORS 代理搜索失败:', error);
  }

  // 3. 最终回退到模拟数据
  console.warn('所有搜索方式都失败，使用模拟数据');
  return generateMockImages(bookName);
}

/**
 * 图片搜索服务接口
 */
export interface ImageSearchService {
  searchBookCoverImages(bookName: string): Promise<ImageSearchResult[]>;
}

/**
 * 默认图片搜索服务实例
 */
export const imageSearchService: ImageSearchService = {
  searchBookCoverImages,
};
