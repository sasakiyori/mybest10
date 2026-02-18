/**
 * Best10 Context
 * 全局状态管理，管理书籍列表、配置和UI状态
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { BookEntry, GeneratorConfig, Best10List, DoubanBook } from '../types/models';
import { DEFAULT_GENERATOR_CONFIG, VALIDATION_CONSTANTS } from '../types/constants';
import { saveBest10List, loadBest10List, saveConfig, loadConfig } from '../services/storageService';

/**
 * Context状态接口
 */
interface Best10State {
  books: BookEntry[];
  config: GeneratorConfig;
  isLoading: boolean;
  error: string | null;
  currentSearchIndex: number | null;
}

/**
 * Context操作接口
 */
interface Best10Actions {
  updateBookName: (index: number, name: string) => void;
  selectBook: (index: number, book: DoubanBook) => void;
  removeBook: (index: number) => void;
  reorderBooks: (fromIndex: number, toIndex: number) => void;
  updateConfig: (config: Partial<GeneratorConfig>) => void;
  setSearchResults: (index: number, results: DoubanBook[]) => void;
  setSearching: (index: number, isSearching: boolean) => void;
  setCurrentSearchIndex: (index: number | null) => void;
  clearAllBooks: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  updateCustomCover: (index: number, coverDataUrl: string | undefined) => void;
}

/**
 * Context类型
 */
type Best10ContextType = Best10State & Best10Actions;

/**
 * 创建Context
 */
const Best10Context = createContext<Best10ContextType | undefined>(undefined);

/**
 * 初始化空的书籍列表
 */
function createInitialBooks(): BookEntry[] {
  return Array.from({ length: VALIDATION_CONSTANTS.BOOK_COUNT }, (_, index) => ({
    rank: index + 1,
    bookName: '',
    isSearching: false,
  }));
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Provider Props
 */
interface Best10ProviderProps {
  children: ReactNode;
}

/**
 * Best10 Provider组件
 */
export function Best10Provider({ children }: Best10ProviderProps) {
  // 初始化状态
  const [books, setBooks] = useState<BookEntry[]>(createInitialBooks());
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_GENERATOR_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null);
  
  // 使用 ref 来防止保存操作过于频繁
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 从LocalStorage加载数据
  useEffect(() => {
    try {
      const savedList = loadBest10List();
      if (savedList && savedList.books.length === VALIDATION_CONSTANTS.BOOK_COUNT) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBooks(savedList.books);
      }

      const savedConfig = loadConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (err) {
      console.error('Failed to load data from storage:', err);
      setError('加载保存的数据失败');
    }
  }, []);

  // 自动保存到LocalStorage - 添加防抖优化
  const saveToStorage = useCallback(() => {
    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 设置新的定时器，延迟保存
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const list: Best10List = {
          id: generateId(),
          name: config.title || '我的书籍BEST10',
          books,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        saveBest10List(list);
        saveConfig(config);
      } catch (err) {
        console.error('Failed to save data to storage:', err);
        // 不设置error状态，避免干扰用户操作
      }
    }, 500); // 500ms 防抖延迟
  }, [books, config]);

  // 当books或config变化时自动保存
  useEffect(() => {
    saveToStorage();
    
    // 清理函数：组件卸载时清除定时器
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveToStorage]);

  /**
   * 更新书名
   */
  const updateBookName = useCallback((index: number, name: string) => {
    if (index < 0 || index >= VALIDATION_CONSTANTS.BOOK_COUNT) {
      console.error('Invalid book index:', index);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[index] = {
        ...newBooks[index],
        bookName: name,
      };
      return newBooks;
    });
  }, []);

  /**
   * 选择书籍
   */
  const selectBook = useCallback((index: number, book: DoubanBook) => {
    if (index < 0 || index >= VALIDATION_CONSTANTS.BOOK_COUNT) {
      console.error('Invalid book index:', index);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[index] = {
        ...newBooks[index],
        selectedBook: book,
        bookName: book.title,
        isSearching: false,
        searchResults: undefined,
      };
      return newBooks;
    });
  }, []);

  /**
   * 移除书籍
   */
  const removeBook = useCallback((index: number) => {
    if (index < 0 || index >= VALIDATION_CONSTANTS.BOOK_COUNT) {
      console.error('Invalid book index:', index);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[index] = {
        rank: index + 1,
        bookName: '',
        isSearching: false,
      };
      return newBooks;
    });
  }, []);

  /**
   * 重新排序书籍
   * 交换两个位置的书籍，并更新rank以保持唯一性和连续性
   */
  const reorderBooks = useCallback((fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 || fromIndex >= VALIDATION_CONSTANTS.BOOK_COUNT ||
      toIndex < 0 || toIndex >= VALIDATION_CONSTANTS.BOOK_COUNT ||
      fromIndex === toIndex
    ) {
      console.error('Invalid reorder indices:', fromIndex, toIndex);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      
      // 交换两个位置的书籍
      const temp = newBooks[fromIndex];
      newBooks[fromIndex] = newBooks[toIndex];
      newBooks[toIndex] = temp;
      
      // 更新rank以保持连续性（rank = index + 1）
      newBooks[fromIndex] = { ...newBooks[fromIndex], rank: fromIndex + 1 };
      newBooks[toIndex] = { ...newBooks[toIndex], rank: toIndex + 1 };
      
      return newBooks;
    });
  }, []);

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: Partial<GeneratorConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  /**
   * 设置搜索结果
   */
  const setSearchResults = useCallback((index: number, results: DoubanBook[]) => {
    if (index < 0 || index >= VALIDATION_CONSTANTS.BOOK_COUNT) {
      console.error('Invalid book index:', index);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[index] = {
        ...newBooks[index],
        searchResults: results,
      };
      return newBooks;
    });
  }, []);

  /**
   * 设置搜索状态
   */
  const setSearching = useCallback((index: number, isSearching: boolean) => {
    if (index < 0 || index >= VALIDATION_CONSTANTS.BOOK_COUNT) {
      console.error('Invalid book index:', index);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[index] = {
        ...newBooks[index],
        isSearching,
      };
      return newBooks;
    });
  }, []);

  /**
   * 清空所有书籍
   */
  const clearAllBooks = useCallback(() => {
    setBooks(createInitialBooks());
    setError(null);
  }, []);

  /**
   * 设置错误信息
   */
  const handleSetError = useCallback((error: string | null) => {
    setError(error);
  }, []);

  /**
   * 设置加载状态
   */
  const handleSetLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  /**
   * 更新自定义封面
   */
  const updateCustomCover = useCallback((index: number, coverDataUrl: string | undefined) => {
    if (index < 0 || index >= VALIDATION_CONSTANTS.BOOK_COUNT) {
      console.error('Invalid book index:', index);
      return;
    }

    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[index] = {
        ...newBooks[index],
        customCover: coverDataUrl,
      };
      return newBooks;
    });
  }, []);

  // Context值 - 使用 useMemo 优化，防止不必要的重渲染
  const value: Best10ContextType = useMemo(() => ({
    // State
    books,
    config,
    isLoading,
    error,
    currentSearchIndex,
    // Actions
    updateBookName,
    selectBook,
    removeBook,
    reorderBooks,
    updateConfig,
    setSearchResults,
    setSearching,
    setCurrentSearchIndex,
    clearAllBooks,
    setError: handleSetError,
    setLoading: handleSetLoading,
    updateCustomCover,
  }), [
    books,
    config,
    isLoading,
    error,
    currentSearchIndex,
    updateBookName,
    selectBook,
    removeBook,
    reorderBooks,
    updateConfig,
    setSearchResults,
    setSearching,
    clearAllBooks,
    handleSetError,
    handleSetLoading,
    updateCustomCover,
  ]);

  return (
    <Best10Context.Provider value={value}>
      {children}
    </Best10Context.Provider>
  );
}

/**
 * 使用Best10 Context的Hook
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useBest10() {
  const context = useContext(Best10Context);
  if (context === undefined) {
    throw new Error('useBest10 must be used within a Best10Provider');
  }
  return context;
}
