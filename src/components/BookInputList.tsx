/**
 * BookInputList Component
 * 书名输入列表组件，管理10个书籍输入项
 * 需求: 1.1, 1.2, 1.5
 */

import React, { useCallback, useMemo } from 'react';
import { useBest10 } from '../contexts/Best10Context';
import { UI_CONSTANTS } from '../types/constants';
import type { BookEntry } from '../types/models';

/**
 * 单个书籍输入项组件
 */
interface BookInputItemProps {
  book: BookEntry;
  index: number;
  onInputCommit: (index: number, value: string) => void;
  onSearchClick: (index: number, value: string) => void;
}

const BookInputItem = React.memo(({ book, index, onInputCommit, onSearchClick }: BookInputItemProps) => {
  const [inputValue, setInputValue] = React.useState(book.bookName);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = React.useRef(false);

  const flushCommit = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onInputCommit(index, value);
  }, [index, onInputCommit]);

  React.useEffect(() => {
    setInputValue(book.bookName);
  }, [book.bookName]);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (isComposingRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onInputCommit(index, value);
      debounceTimerRef.current = null;
    }, UI_CONSTANTS.SEARCH_DEBOUNCE_MS);
  }, [index, onInputCommit]);

  const handleBlur = useCallback(() => {
    flushCommit(inputValue);
  }, [flushCommit, inputValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      flushCommit(inputValue);
    }
  }, [flushCommit, inputValue]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const value = e.currentTarget.value;
    setInputValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onInputCommit(index, value);
      debounceTimerRef.current = null;
    }, UI_CONSTANTS.SEARCH_DEBOUNCE_MS);
  }, [index, onInputCommit]);

  const handleSearch = useCallback(() => {
    flushCommit(inputValue);
    onSearchClick(index, inputValue);
  }, [flushCommit, index, inputValue, onSearchClick]);

  const hasInput = inputValue.trim().length > 0;

  return (
    <div 
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
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={`输入第${book.rank}名书籍...`}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700 border-2 border-slate-600 rounded-lg sm:rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 sm:focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 text-sm sm:text-base text-slate-100 placeholder-slate-400"
          data-testid={`book-input-${index}`}
        />
        {hasInput && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
      </div>

      {/* 搜索按钮 */}
      <button
        onClick={handleSearch}
        disabled={!hasInput}
        style={{
          backgroundColor: hasInput ? '#6366f1' : '#334155',
          color: hasInput ? '#ffffff' : '#64748b',
        }}
        className={`search-button flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
          hasInput
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
  );
});
BookInputItem.displayName = 'BookInputItem';

/**
 * BookInputList组件
 * 渲染10个输入框，每个对应一个排名
 */
export function BookInputList() {
  const { books, updateBookName, setCurrentSearchIndex } = useBest10();

  /**
   * 处理输入提交
   */
  const handleInputCommit = useCallback((index: number, value: string) => {
    updateBookName(index, value);
  }, [updateBookName]);

  /**
   * 处理搜索按钮点击 - 使用 useCallback 优化
   */
  const handleSearchClick = useCallback((index: number, value: string) => {
    updateBookName(index, value);
    setCurrentSearchIndex(index);
  }, [setCurrentSearchIndex, updateBookName]);

  // 使用 useMemo 缓存渲染项
  const bookItems = useMemo(() => 
    books.map((book, index) => (
      <BookInputItem
        key={book.rank}
        book={book}
        index={index}
        onInputCommit={handleInputCommit}
        onSearchClick={handleSearchClick}
      />
    )), 
    [books, handleInputCommit, handleSearchClick]
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
