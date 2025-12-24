/**
 * App Component
 * 主应用组件，整合所有功能模块
 * 需求: 6.1, 6.2, 6.4
 */

import React, { useState } from 'react';
import { Best10Provider, useBest10 } from './contexts/Best10Context';
import { BookInputList } from './components/BookInputList';
import { BookSearchModal } from './components/BookSearchModal';
import { BookPreview } from './components/BookPreview';
import { ImageGenerator } from './components/ImageGenerator';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

/**
 * 步骤指引组件
 */
function StepGuide({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, title: '输入书名', icon: '📝', desc: '添加你喜欢的书籍' },
    { id: 2, title: '搜索选择', icon: '🔍', desc: '从豆瓣选择书籍信息' },
    { id: 3, title: '生成图片', icon: '🎨', desc: '定制并导出精美图片' },
  ];

  return (
    <div className="step-guide mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="step-indicator relative flex flex-col items-center">
              <div
                className={`
                  step-circle relative z-10
                  w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl
                  transition-all duration-500 ease-out
                  ${currentStep >= step.id
                    ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                    : 'bg-slate-700 text-slate-400'
                  }
                `}
                data-testid={`step-${step.id}`}
              >
                <span className={currentStep >= step.id ? 'animate-float' : ''}>{step.icon}</span>
              </div>
              <div className="mt-3 text-center">
                <span
                  className={`
                    text-sm md:text-base font-semibold block
                    ${currentStep >= step.id ? 'text-indigo-400' : 'text-slate-500'}
                  `}
                >
                  {step.title}
                </span>
                <span className="text-xs text-slate-500 hidden md:block mt-1">
                  {step.desc}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  w-16 md:w-24 h-1 mx-2 md:mx-4 rounded-full transition-all duration-500 -mt-8
                  ${currentStep > step.id 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                    : 'bg-slate-700'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * 加载动画组件
 */
function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" data-testid="loading-spinner">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center animate-fade-in border border-slate-700">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
        </div>
        {message && (
          <p className="mt-5 text-slate-200 font-medium text-lg">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * 成功提示组件
 */
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed top-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center space-x-3 animate-slide-in"
      data-testid="success-toast"
    >
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="font-medium">{message}</span>
    </div>
  );
}

/**
 * 错误提示组件
 */
function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed top-4 right-4 z-50 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-lg shadow-rose-500/30 flex items-center space-x-3 animate-slide-in"
      data-testid="error-toast"
    >
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 w-6 h-6 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
}

/**
 * 主应用内容组件
 */
function AppContent() {
  const { books, currentSearchIndex, setCurrentSearchIndex, error, setError, isLoading, clearAllBooks } = useBest10();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 计算当前步骤
  const hasInput = books.some(book => book.bookName.trim() !== '');
  const hasSelected = books.some(book => book.selectedBook);
  const currentStep = hasSelected ? 3 : hasInput ? 2 : 1;

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: 聚焦到第一个空输入框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstEmptyInput = document.querySelector<HTMLInputElement>('input[data-testid^="book-input-"]:not([value])');
        if (firstEmptyInput) {
          firstEmptyInput.focus();
        }
      }
      
      // Escape: 关闭弹窗
      if (e.key === 'Escape' && currentSearchIndex !== null) {
        setCurrentSearchIndex(null);
      }
      
      // Ctrl/Cmd + S: 保存（实际上已自动保存，显示提示）
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSuccessMessage('数据已自动保存');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSearchIndex, setCurrentSearchIndex]);

  // 处理搜索弹窗关闭
  const handleCloseModal = () => {
    setCurrentSearchIndex(null);
  };

  // 获取当前搜索的书名
  const currentSearchQuery = currentSearchIndex !== null
    ? books[currentSearchIndex]?.bookName || ''
    : '';

  // 处理清空所有
  const handleClearAll = () => {
    if (window.confirm('确定要清空所有书籍吗？此操作不可恢复。')) {
      clearAllBooks();
      setSuccessMessage('已清空所有书籍');
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 sm:w-80 h-60 sm:h-80 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 头部 */}
      <header className="relative bg-slate-800/80 backdrop-blur-md shadow-lg border-b border-slate-700/50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-indigo-500/30 flex-shrink-0">
                📚
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
                  书籍 Best10 生成器
                </h1>
                <p className="hidden sm:block mt-1 text-xs sm:text-sm text-slate-400 truncate">
                  创建你的专属书单图片，分享到社交媒体
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* 快捷键提示 */}
              <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 bg-slate-700/50 px-3 py-2 rounded-lg">
                <span className="px-1.5 py-0.5 bg-slate-600 rounded shadow-sm font-mono">⌘K</span>
                <span>快速输入</span>
                <span className="mx-1">|</span>
                <span className="px-1.5 py-0.5 bg-slate-600 rounded shadow-sm font-mono">ESC</span>
                <span>关闭</span>
              </div>
              <button
                onClick={handleClearAll}
                className="p-2 sm:px-4 sm:py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
                data-testid="clear-all-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">清空所有</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 步骤指引 */}
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex-shrink-0">
        <StepGuide currentStep={currentStep} />
      </div>

      {/* 主内容区域 */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-12">
        {/* 桌面端：左右布局，移动端：垂直布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* 左侧：输入和预览 */}
          <div className="space-y-4 sm:space-y-6">
            {/* 书名输入 */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg shadow-black/20 p-4 sm:p-6 border border-slate-700/50 animate-fade-in">
              <BookInputList />
            </div>

            {/* 书籍预览 */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg shadow-black/20 p-4 sm:p-6 border border-slate-700/50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <BookPreview />
            </div>
          </div>

          {/* 右侧：图片生成 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg shadow-black/20 p-4 sm:p-6 border border-slate-700/50 animate-fade-in lg:sticky lg:top-4" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                生成图片
              </h2>
              <ImageGenerator />
            </div>
          </div>
        </div>
      </main>

      {/* 搜索弹窗 */}
      <BookSearchModal
        isOpen={currentSearchIndex !== null}
        searchQuery={currentSearchQuery}
        onClose={handleCloseModal}
      />

      {/* 加载动画 */}
      {isLoading && <LoadingSpinner message="处理中..." />}

      {/* 成功提示 */}
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* 错误提示 */}
      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* 页脚 */}
      <footer className="relative bg-slate-800/60 backdrop-blur-sm border-t border-slate-700/50 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-xs sm:text-sm">
              <span className="text-base sm:text-lg">📖</span>
              <span className="hidden xs:inline">使用豆瓣API获取书籍信息</span>
              <span className="xs:hidden">豆瓣API</span>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="hidden sm:inline">数据保存在本地浏览器</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs text-slate-500">Made with</span>
              <span className="text-rose-500">❤️</span>
              <span className="text-[10px] sm:text-xs text-slate-500">for book lovers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * App组件（带Provider和ErrorBoundary）
 */
function App() {
  return (
    <ErrorBoundary>
      <Best10Provider>
        <AppContent />
      </Best10Provider>
    </ErrorBoundary>
  );
}

export default App;
