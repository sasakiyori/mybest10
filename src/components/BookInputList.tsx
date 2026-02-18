/**
 * BookInputList Component
 * 书名输入列表组件，管理10个书籍输入项
 * 需求: 1.1, 1.2, 1.5
 */

import React, { useCallback, useRef, useMemo } from 'react';
import { useBest10 } from '../contexts/Best10Context';
import { UI_CONSTANTS } from '../types/constants';
import type { BookEntry } from '../types/models';

/**
 * 单个书籍输入项组件
 */
interface BookInputItemProps {
  book: BookEntry;
  index: number;
  onInputChange: (index: number, value: string) => void;
  onSearchClick: (index: number) => void;
}

const BookInputItem = React.memo(({ book, index, onInputChange, onSearchClick }: BookInputItemProps) => (
  <div 
    key={book.rank} 
    className="book-input-item group flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-700/50 transition-all duration-200"
  >
    {/* 排名显示 */}
    <div className="rank-badge flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-full text-xs sm:text-sm shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-200">
      {book.rank}
    </div>

    {/* 输入框 */}
    <div className="flex-1 relative min-w-0">
      <input
        type="text"
        value={book.bookName}
        onChange={(e) => onInputChange(index, e.target.value)}
        placeholder={`输入第 ${book.rank} 名书籍...`}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700 border-2 border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 sm:focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 text-sm sm:text-base text-slate-100 placeholder-slate-400"
        data-testid={`book-input-${index}`}
      />
      {book.bookName && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      )}
    </div>

    {/* 搜索按钮 */}
    <button
      onClick={() => onSearchClick(index)}
      disabled={!book.bookName.trim()}
      style={{
        backgroundColor: book.bookName.trim() ? '#6366f1' : '#334155',
        color: book.bookName.trim() ? '#ffffff' : '#64748b',
      }}
      className={`search-button flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
        book.bookName.trim()
          ? 'hover:brightness-110 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
          : 'cursor-not-allowed'
      }`}
      data-testid={`search-button-${index}`}
    >
      <span className="flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        搜索
      </span>
    </button>

    {/* 封面预览 */}
    {book.selectedBook && (
      <div className="cover-preview flex-shrink-0 relative group/cover hidden xs:block">
        <img
          src={book.selectedBook.coverUrl}
          alt={book.selectedBook.title}
          className="w-8 h-11 sm:w-10 sm:h-14 object-cover rounded-md sm:rounded-lg shadow-md ring-2 ring-slate-700"
          data-testid={`cover-preview-${index}`}
        />
        <div className="absolute inset-0 bg-emerald-500 rounded-lg flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    )}
  </div>
));
BookInputItem.displayName = 'BookInputItem';

/**
 * BookInputList组件
 * 渲染10个输入框，每个对应一个排名
 */
export function BookInputList() {
  const { books, updateBookName, setCurrentSearchIndex } = useBest10();
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * 处理输入变化（带防抖）
   */
  const handleInputChange = useCallback((index: number, value: string) => {
    // 清除之前的定时器
    const existingTimer = debounceTimers.current.get(index);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 立即更新UI显示
    updateBookName(index, value);

    // 设置新的防抖定时器（用于可能的自动搜索等功能）
    const timer = setTimeout(() => {
      debounceTimers.current.delete(index);
    }, UI_CONSTANTS.SEARCH_DEBOUNCE_MS);

    debounceTimers.current.set(index, timer);
  }, [updateBookName]);

  /**
   * 清理定时器
   */
  React.useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  /**
   * 处理搜索按钮点击 - 使用 useCallback 优化
   */
  const handleSearchClick = useCallback((index: number) => {
    setCurrentSearchIndex(index);
  }, [setCurrentSearchIndex]);

  // 使用 useMemo 缓存渲染项
  const bookItems = useMemo(() => 
    books.map((book, index) => (
      <BookInputItem
        key={book.rank}
        book={book}
        index={index}
        onInputChange={handleInputChange}
        onSearchClick={handleSearchClick}
      />
    )), 
    [books, handleInputChange, handleSearchClick]
  );

  return (
    <div className="book-input-list">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-100 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
        输入书名
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {bookItems}
      </div>
    </div>
  );
}
