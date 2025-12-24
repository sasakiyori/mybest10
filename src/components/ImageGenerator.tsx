/**
 * ImageGenerator Component
 * 图片生成器组件，集成样式自定义和图片生成功能
 * 需求: 5.1, 5.6, 5.7, 6.5
 */

import React, { useState } from 'react';
import { StyleCustomizer } from './StyleCustomizer';
import { useBest10 } from '../contexts/Best10Context';
import { generateImage, downloadImage } from '../services/renderService';
import type { GeneratorConfig } from '../types/models';

export function ImageGenerator() {
  const { books, config, updateConfig } = useBest10();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpeg'>('png');

  /**
   * 检查是否有足够的书籍可以生成图片
   */
  const hasEnoughBooks = books.some(book => book.selectedBook || book.customCover);

  /**
   * 处理配置变化
   */
  const handleConfigChange = (newConfig: Partial<GeneratorConfig>) => {
    updateConfig(newConfig);
  };

  /**
   * 生成图片
   */
  const handleGenerate = async () => {
    if (!hasEnoughBooks) {
      setError('请至少选择一本书籍');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 生成图片
      const blob = await generateImage(books, config);
      
      // 如果需要转换为JPEG
      let finalBlob = blob;
      if (selectedFormat === 'jpeg') {
        finalBlob = await convertToJpeg(blob);
      }

      // 创建预览URL
      const url = URL.createObjectURL(finalBlob);
      
      // 清理旧的URL
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
      
      setGeneratedImageUrl(url);
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError(err instanceof Error ? err.message : '生成图片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 下载图片
   */
  const handleDownload = () => {
    if (!generatedImageUrl) {
      return;
    }

    // 从URL创建Blob并下载
    fetch(generatedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const extension = selectedFormat === 'jpeg' ? 'jpg' : 'png';
        const filename = `${config.title || 'best10'}.${extension}`;
        downloadImage(blob, filename);
      })
      .catch(err => {
        console.error('Failed to download image:', err);
        setError('下载失败，请重试');
      });
  };

  /**
   * 将PNG Blob转换为JPEG Blob
   */
  const convertToJpeg = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 白色背景（JPEG不支持透明）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (jpegBlob) => {
            URL.revokeObjectURL(url);
            if (jpegBlob) {
              resolve(jpegBlob);
            } else {
              reject(new Error('Failed to convert to JPEG'));
            }
          },
          'image/jpeg',
          0.95
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for conversion'));
      };

      img.src = url;
    });
  };

  /**
   * 清理URL
   */
  React.useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* 样式自定义 */}
      <StyleCustomizer
        config={config}
        onConfigChange={handleConfigChange}
      />

      {/* 格式选择 */}
      <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-200 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          导出格式
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <label className={`relative flex items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedFormat === 'png' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 bg-slate-700 hover:border-slate-500'}`}>
            <input
              type="radio"
              name="format"
              value="png"
              checked={selectedFormat === 'png'}
              onChange={(e) => setSelectedFormat(e.target.value as 'png' | 'jpeg')}
              className="sr-only"
              data-testid="format-png"
            />
            <div className="text-center">
              <span className={`text-xs sm:text-sm font-medium ${selectedFormat === 'png' ? 'text-indigo-400' : 'text-slate-300'}`}>PNG</span>
              <span className={`block text-[10px] sm:text-xs mt-0.5 ${selectedFormat === 'png' ? 'text-indigo-400' : 'text-slate-500'}`}>支持透明</span>
            </div>
            {selectedFormat === 'png' && (
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
          <label className={`relative flex items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedFormat === 'jpeg' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 bg-slate-700 hover:border-slate-500'}`}>
            <input
              type="radio"
              name="format"
              value="jpeg"
              checked={selectedFormat === 'jpeg'}
              onChange={(e) => setSelectedFormat(e.target.value as 'png' | 'jpeg')}
              className="sr-only"
              data-testid="format-jpeg"
            />
            <div className="text-center">
              <span className={`text-xs sm:text-sm font-medium ${selectedFormat === 'jpeg' ? 'text-indigo-400' : 'text-slate-300'}`}>JPG</span>
              <span className={`block text-[10px] sm:text-xs mt-0.5 ${selectedFormat === 'jpeg' ? 'text-indigo-400' : 'text-slate-500'}`}>文件更小</span>
            </div>
            {selectedFormat === 'jpeg' && (
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* 生成按钮 */}
      <div>
        <button
          onClick={handleGenerate}
          disabled={!hasEnoughBooks || isGenerating}
          style={{
            background: hasEnoughBooks && !isGenerating 
              ? 'linear-gradient(to right, #4f46e5, #9333ea, #ec4899)' 
              : '#e2e8f0',
            color: hasEnoughBooks && !isGenerating ? '#ffffff' : '#94a3b8',
          }}
          className={`
            w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2
            ${hasEnoughBooks && !isGenerating
              ? 'hover:brightness-110 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              : 'cursor-not-allowed'
            }
          `}
          data-testid="generate-button"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              生成中...
            </>
          ) : (
            <>
              <span className="text-lg sm:text-xl">🎨</span>
              生成图片
            </>
          )}
        </button>

        {!hasEnoughBooks && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            请至少选择一本书籍后再生成图片
          </p>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          className="bg-rose-50 border border-rose-200 rounded-lg sm:rounded-xl p-3 sm:p-4"
          data-testid="error-message"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-rose-700">生成失败</h4>
              <p className="text-xs sm:text-sm text-rose-600 mt-0.5 sm:mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {generatedImageUrl && (
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-5 animate-fade-in">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            预览
          </h3>
          
          <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-lg ring-1 ring-slate-600">
            <img
              src={generatedImageUrl}
              alt="Generated Best10"
              className="w-full"
              data-testid="preview-image"
            />
          </div>

          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
            data-testid="download-button"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            下载图片 ({selectedFormat.toUpperCase()})
          </button>
        </div>
      )}
    </div>
  );
}
