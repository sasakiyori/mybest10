/**
 * LocalStorage服务
 * 管理Best10列表和配置的本地存储
 */

import type { Best10List, GeneratorConfig } from '../types/models';

// LocalStorage键名常量
const STORAGE_KEYS = {
  BEST10_LIST: 'book-best10-list',
  CONFIG: 'book-best10-config',
} as const;

// LocalStorage容量限制（5MB，保守估计）
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

/**
 * 检查LocalStorage可用容量
 */
function checkStorageCapacity(data: string): boolean {
  try {
    // 估算当前存储使用量
    let totalSize = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    // 检查新数据是否会超出限制
    return totalSize + data.length < MAX_STORAGE_SIZE;
  } catch (error) {
    console.error('Error checking storage capacity:', error);
    return false;
  }
}

/**
 * 保存Best10列表到LocalStorage
 */
export function saveBest10List(list: Best10List): void {
  try {
    const serialized = JSON.stringify(list);
    
    // 检查容量
    if (!checkStorageCapacity(serialized)) {
      throw new Error('LocalStorage容量不足，无法保存数据');
    }
    
    localStorage.setItem(STORAGE_KEYS.BEST10_LIST, serialized);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage容量已满，请清理数据后重试');
      }
      throw error;
    }
    throw new Error('保存数据失败');
  }
}

/**
 * 从LocalStorage加载Best10列表
 */
export function loadBest10List(): Best10List | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.BEST10_LIST);
    
    if (!serialized) {
      return null;
    }
    
    const parsed = JSON.parse(serialized);
    
    // 验证数据结构
    if (!isValidBest10List(parsed)) {
      console.error('Invalid Best10List data structure');
      return null;
    }
    
    // 转换日期字符串为Date对象
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  } catch (error) {
    console.error('Error loading Best10List:', error);
    return null;
  }
}

/**
 * 清空Best10列表
 */
export function clearBest10List(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BEST10_LIST);
  } catch (error) {
    console.error('Error clearing Best10List:', error);
    throw new Error('清空数据失败');
  }
}

/**
 * 保存生成器配置到LocalStorage
 */
export function saveConfig(config: GeneratorConfig): void {
  try {
    const serialized = JSON.stringify(config);
    
    // 检查容量
    if (!checkStorageCapacity(serialized)) {
      throw new Error('LocalStorage容量不足，无法保存配置');
    }
    
    localStorage.setItem(STORAGE_KEYS.CONFIG, serialized);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage容量已满，请清理数据后重试');
      }
      throw error;
    }
    throw new Error('保存配置失败');
  }
}

/**
 * 从LocalStorage加载生成器配置
 */
export function loadConfig(): GeneratorConfig | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.CONFIG);
    
    if (!serialized) {
      return null;
    }
    
    const parsed = JSON.parse(serialized);
    
    // 验证数据结构
    if (!isValidGeneratorConfig(parsed)) {
      console.error('Invalid GeneratorConfig data structure');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}

/**
 * 验证Best10List数据结构
 */
function isValidBest10List(data: unknown): data is Best10List {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.books) &&
    (typeof obj.createdAt === 'string' || obj.createdAt instanceof Date) &&
    (typeof obj.updatedAt === 'string' || obj.updatedAt instanceof Date)
  );
}

/**
 * 验证GeneratorConfig数据结构
 */
function isValidGeneratorConfig(data: unknown): data is GeneratorConfig {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.title === 'string' &&
    typeof obj.backgroundColor === 'string' &&
    typeof obj.textColor === 'string' &&
    typeof obj.accentColor === 'string' &&
    typeof obj.template === 'string' &&
    obj.fontSize != null &&
    typeof obj.fontSize === 'object' &&
    obj.layout != null &&
    typeof obj.layout === 'object'
  );
}
