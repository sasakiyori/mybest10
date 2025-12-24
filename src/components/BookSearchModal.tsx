/**
 * BookSearchModal Component
 * 书籍搜索弹窗组件，支持豆瓣搜索和百度图片搜索
 * 需求: 2.2, 2.3, 2.4, 2.5
 */

import React, { useEffect, useState } from 'react';
import type { DoubanBook } from '../types/models';
import { useBest10 } from '../contexts/Best10Context';
import { searchBooks } from '../services/doubanService';
import { searchBookCoverImages, type ImageSearchResult } from '../services/imageSearchService';

/**
 * 搜索方式类型
 */
type SearchMode = 'douban' | 'image';

/**
 * BookSearchModal组件Props
 */
export interface BookSearchModalProps {
  isOpen: boolean;
  searchQuery: string;
  onClose: () => void;
}

/**
 * BookSearchModal组件
 * 显示搜索结果列表，支持书籍选择和图片搜索
 */
export function BookSearchModal({ isOpen, searchQuery, onClose }: BookSearchModalProps) {
  const { 
    books, 
    currentSearchIndex, 
    selectBook, 
    setSearchResults, 
    setSearching,
    setError 
  } = useBest10();

  // 搜索模式状态（默认使用图片搜索）
  const [searchMode, setSearchMode] = useState<SearchMode>('image');
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // 获取当前搜索的书籍条目
  const currentBook = currentSearchIndex !== null ? books[currentSearchIndex] : null;
  const searchResults = currentBook?.searchResults || [];
  const isLoading = currentBook?.isSearching || false;
  const error = null; // 错误信息从context获取或本地管理

  /**
   * 执行豆瓣搜索
   */
  const performDoubanSearch = async () => {
    if (currentSearchIndex === null) return;

    try {
      setSearching(currentSearchIndex, true);
      setError(null);
      
      const results = await searchBooks(searchQuery);
      setSearchResults(currentSearchIndex, results);
      
      setSearching(currentSearchIndex, false);
    } catch (err) {
      setSearching(currentSearchIndex, false);
      
      // 使用用户友好的错误消息
      if (err instanceof Error && 'getUserMessage' in err) {
        setError((err as { getUserMessage: () => string }).getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('搜索失败，请重试');
      }
    }
  };

  /**
   * 执行图片搜索
   */
  const performImageSearch = async () => {
    if (currentSearchIndex === null) return;

    try {
      setIsLoadingImages(true);
      setImageError(null);
      
      const results = await searchBookCoverImages(searchQuery);
      setImageResults(results);
      
      setIsLoadingImages(false);
    } catch (err) {
      setIsLoadingImages(false);
      
      // 使用用户友好的错误消息
      if (err instanceof Error && 'getUserMessage' in err) {
        setImageError((err as { getUserMessage: () => string }).getUserMessage());
      } else if (err instanceof Error) {
        setImageError(err.message);
      } else {
        setImageError('图片搜索失败，请重试');
      }
    }
  };

  /**
   * 执行搜索
   */
  useEffect(() => {
    if (isOpen && searchQuery && currentSearchIndex !== null) {
      if (searchMode === 'douban') {
        performDoubanSearch();
      } else {
        performImageSearch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchQuery, currentSearchIndex, searchMode]);

  /**
   * 处理书籍选择
   */
  const handleSelectBook = (book: DoubanBook) => {
    if (currentSearchIndex !== null) {
      selectBook(currentSearchIndex, book);
      onClose();
    }
  };

  /**
   * 处理图片选择
   */
  const handleSelectImage = (image: ImageSearchResult) => {
    if (currentSearchIndex !== null) {
      // 创建一个临时的DoubanBook对象，使用图片URL作为封面
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
      selectBook(currentSearchIndex, tempBook);
      onClose();
    }
  };

  /**
   * 切换搜索模式
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    // 清除之前的错误信息
    setError(null);
    setImageError(null);
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * 处理背景点击关闭
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 不显示弹窗
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div 
        className="bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
        data-testid="modal-content"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              搜索结果
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">"{searchQuery}"</p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-700 shadow-sm hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-all duration-200 ml-2"
            data-testid="close-button"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索模式切换（暂时隐藏，豆瓣搜索代码保留） */}
        {/* eslint-disable-next-line no-constant-binary-expression */}
        {false && (
        <div className="flex bg-slate-700/50 p-1 sm:p-1.5 mx-3 sm:mx-4 my-3 sm:my-4 rounded-lg sm:rounded-xl">
          <button
            onClick={() => handleModeChange('douban')}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 ${
              searchMode === 'douban'
                ? 'bg-slate-700 text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="douban-tab"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="hidden xs:inline">豆瓣</span>搜索
          </button>
          <button
            onClick={() => handleModeChange('image')}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 ${
              searchMode === 'image'
                ? 'bg-slate-700 text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            data-testid="image-tab"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden xs:inline">图片</span>搜索
          </button>
        </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-4 sm:pb-6">
          {searchMode === 'douban' ? (
            <DoubanSearchResults
              isLoading={isLoading}
              error={error}
              results={searchResults}
              onSelect={handleSelectBook}
            />
          ) : (
            <ImageSearchResults
              isLoading={isLoadingImages}
              error={imageError}
              results={imageResults}
              onSelect={handleSelectImage}
            />
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * 豆瓣搜索结果组件
 */
interface DoubanSearchResultsProps {
  isLoading: boolean;
  error: string | null;
  results: DoubanBook[];
  onSelect: (book: DoubanBook) => void;
}

function DoubanSearchResults({ isLoading, error, results, onSelect }: DoubanSearchResultsProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16" data-testid="loading-state">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
        </div>
        <span className="mt-3 sm:mt-4 text-sm text-slate-400 font-medium">搜索中...</span>
      </div>
    );
  }

  // 错误信息
  if (error) {
    return (
      <div 
        className="bg-rose-50 border border-rose-200 text-rose-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3"
        data-testid="error-message"
      >
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // 无结果
  if (results.length === 0) {
    return (
      <div 
        className="text-center py-12 sm:py-16"
        data-testid="no-results"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm sm:text-base text-slate-400 font-medium">未找到相关书籍</p>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">试试其他关键词</p>
      </div>
    );
  }

  // 搜索结果列表
  return (
    <div className="space-y-2 sm:space-y-3" data-testid="search-results">
      {results.map((book) => (
        <div
          key={book.id}
          className="flex gap-2.5 sm:gap-4 p-2 sm:p-3 border-2 border-slate-600 rounded-lg sm:rounded-xl hover:border-indigo-400 hover:bg-indigo-500/10 cursor-pointer transition-all duration-200 group"
          onClick={() => onSelect(book)}
          data-testid={`book-result-${book.id}`}
        >
          {/* 封面缩略图 */}
          <div className="flex-shrink-0">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-10 h-14 sm:w-14 sm:h-20 object-cover rounded-md sm:rounded-lg shadow-sm ring-1 ring-slate-200 group-hover:shadow-md transition-shadow"
              loading="lazy"
              data-testid={`book-cover-${book.id}`}
            />
          </div>

          {/* 书籍信息 */}
          <div className="flex-1 min-w-0 py-0.5">
            <h4 
              className="font-semibold text-sm sm:text-base text-slate-800 truncate group-hover:text-indigo-600 transition-colors"
              data-testid={`book-title-${book.id}`}
            >
              {book.title}
            </h4>
            <p 
              className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate"
              data-testid={`book-author-${book.id}`}
            >
              {book.author.join(', ')}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-400 flex-wrap">
              <span>{book.publisher}</span>
              <span>·</span>
              <span>{book.pubdate}</span>
              {book.rating > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-500 font-medium flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {book.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 选择指示 */}
          <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-md">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 图片搜索结果组件
 */
interface ImageSearchResultsProps {
  isLoading: boolean;
  error: string | null;
  results: ImageSearchResult[];
  onSelect: (image: ImageSearchResult) => void;
}

function ImageSearchResults({ isLoading, error, results, onSelect }: ImageSearchResultsProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16" data-testid="image-loading-state">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
        </div>
        <span className="mt-3 sm:mt-4 text-sm text-slate-400 font-medium">搜索图片中...</span>
      </div>
    );
  }

  // 错误信息
  if (error) {
    return (
      <div 
        className="bg-rose-50 border border-rose-200 text-rose-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3"
        data-testid="image-error-message"
      >
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // 无结果
  if (results.length === 0) {
    return (
      <div 
        className="text-center py-12 sm:py-16"
        data-testid="image-no-results"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm sm:text-base text-slate-400 font-medium">未找到相关图片</p>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">试试其他关键词</p>
      </div>
    );
  }

  // 图片网格显示
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3" data-testid="image-results">
      {results.map((image) => (
        <div
          key={image.id}
          className="group border-2 border-slate-100 rounded-lg sm:rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-lg cursor-pointer transition-all duration-200"
          onClick={() => onSelect(image)}
          data-testid={`image-result-${image.id}`}
        >
          {/* 图片 */}
          <div className="aspect-[2/3] bg-slate-100 relative overflow-hidden">
            <img
              src={image.thumbnailUrl}
              alt={image.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              data-testid={`image-thumbnail-${image.id}`}
            />
            {/* 选择覆盖层 */}
            <div className="absolute inset-0 bg-indigo-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* 图片信息 */}
          <div className="p-2 sm:p-2.5">
            <p 
              className="text-[10px] sm:text-xs font-medium text-slate-700 truncate"
              data-testid={`image-title-${image.id}`}
            >
              {image.title}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
              {image.source}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
