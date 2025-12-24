/**
 * BookPreview Component
 * 书籍预览组件，显示已选书籍的网格布局
 * 需求: 3.5, 6.3
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBest10 } from '../contexts/Best10Context';
import type { BookEntry } from '../types/models';

/**
 * 单个可排序书籍项组件
 */
interface SortableBookItemProps {
  book: BookEntry;
  onRemove: (index: number) => void;
  onCustomCoverUpload: (index: number, file: File) => void;
}

function SortableBookItem({ book, onRemove, onCustomCoverUpload }: SortableBookItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.rank });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 如果没有选中书籍，不显示
  if (!book.selectedBook) {
    return null;
  }

  /**
   * 处理文件选择
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomCoverUpload(book.rank - 1, file);
    }
    // 重置input以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 触发文件选择
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="book-preview-item bg-slate-700/50 rounded-lg sm:rounded-xl shadow-sm border border-slate-600/50 p-2 sm:p-3 flex items-center gap-2 sm:gap-3 hover:shadow-md hover:border-indigo-500/50 transition-all duration-200 group"
      data-testid={`book-preview-item-${book.rank - 1}`}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 p-0.5 sm:p-1 rounded transition-colors"
        data-testid={`drag-handle-${book.rank - 1}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      {/* 排名徽章 */}
      <div className="rank-badge flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold rounded-full text-xs sm:text-sm shadow-sm">
        {book.rank}
      </div>

      {/* 封面图片 */}
      <div className="book-cover flex-shrink-0 relative group/cover">
        <img
          src={book.customCover || book.selectedBook.coverUrl}
          alt={book.selectedBook.title}
          className="w-9 h-13 sm:w-12 sm:h-18 object-cover rounded-md sm:rounded-lg shadow-sm ring-1 ring-slate-200"
          loading="lazy"
          onError={(e) => {
            // 封面加载失败时显示占位图
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"%3E%3Crect fill="%23e2e8f0" width="100" height="150"/%3E%3Ctext x="50" y="75" text-anchor="middle" fill="%2394a3b8" font-size="12"%3E无封面%3C/text%3E%3C/svg%3E';
          }}
          data-testid={`book-cover-${book.rank - 1}`}
        />
        {/* 自定义封面上传按钮 */}
        <button
          onClick={handleUploadClick}
          className="absolute inset-0 bg-indigo-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-all duration-200 rounded-lg backdrop-blur-sm"
          data-testid={`upload-cover-button-${book.rank - 1}`}
          aria-label="上传自定义封面"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          data-testid={`file-input-${book.rank - 1}`}
        />
      </div>

      {/* 书籍信息 */}
      <div className="book-info flex-1 min-w-0">
        <h3 className="book-title font-semibold text-slate-100 truncate text-xs sm:text-sm" data-testid={`book-title-${book.rank - 1}`}>
          {book.selectedBook.title}
        </h3>
        <p className="book-author text-[10px] sm:text-xs text-slate-400 truncate mt-0.5 hidden xs:block">
          {book.selectedBook.author.join(', ')}
        </p>
        <p className="book-publisher text-[10px] sm:text-xs text-slate-500 truncate hidden sm:block">
          {book.selectedBook.publisher}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={() => onRemove(book.rank - 1)}
        className="remove-button flex-shrink-0 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
        data-testid={`remove-button-${book.rank - 1}`}
        aria-label={`删除 ${book.selectedBook.title}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * BookPreview组件
 * 显示已选书籍的列表，支持拖拽重排和删除
 */
export function BookPreview() {
  const { books, removeBook, reorderBooks, updateCustomCover, setError } = useBest10();

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = books.findIndex((book) => book.rank === active.id);
      const newIndex = books.findIndex((book) => book.rank === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBooks(oldIndex, newIndex);
      }
    }
  };

  /**
   * 处理删除
   */
  const handleRemove = (index: number) => {
    removeBook(index);
  };

  /**
   * 验证图片格式
   */
  const validateImageFormat = (file: File): boolean => {
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    return validFormats.includes(file.type);
  };

  /**
   * 将文件转换为Data URL
   */
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * 处理自定义封面上传
   */
  const handleCustomCoverUpload = async (index: number, file: File) => {
    try {
      // 验证图片格式
      if (!validateImageFormat(file)) {
        setError('不支持的图片格式，请上传 JPG、PNG 或 WEBP 格式的图片');
        return;
      }

      // 转换为Data URL
      const dataUrl = await fileToDataUrl(file);
      
      // 更新自定义封面
      updateCustomCover(index, dataUrl);
      
      // 清除错误
      setError(null);
    } catch (err) {
      console.error('Failed to upload custom cover:', err);
      setError('上传封面失败，请重试');
    }
  };

  // 过滤出已选择的书籍
  const selectedBooks = books.filter((book) => book.selectedBook);

  // 如果没有选中的书籍，显示提示
  if (selectedBooks.length === 0) {
    return (
      <div className="book-preview-empty text-center py-8 sm:py-12">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <p className="text-base sm:text-lg font-medium text-slate-400">还没有选择书籍</p>
        <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-slate-500">输入书名并搜索选择书籍后，将在这里显示</p>
      </div>
    );
  }

  return (
    <div className="book-preview">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-100 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
        <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
        已选书籍
      </h2>
      <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-slate-400">
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span>拖拽调整排名</span>
        <span className="text-slate-600">·</span>
        <span className="px-1.5 sm:px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] sm:text-xs font-medium">{selectedBooks.length}/10</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={books.map((book) => book.rank)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 sm:space-y-3">
            {books.map((book) => (
              <SortableBookItem
                key={book.rank}
                book={book}
                onRemove={handleRemove}
                onCustomCoverUpload={handleCustomCoverUpload}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
