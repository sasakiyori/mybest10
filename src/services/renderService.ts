/**
 * 图片渲染服务
 * 使用Canvas API生成Best10图片
 */

import type { BookEntry, GeneratorConfig } from '../types/models';
import { IMAGE_CONSTANTS } from '../types/constants';

/**
 * 图片缓存
 */
const imageCache = new Map<string, HTMLImageElement>();

/**
 * 预加载图片（带缓存）
 * @param urls 图片URL数组
 * @returns Promise<HTMLImageElement[]> 加载完成的图片元素数组
 */
export async function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  const loadPromises = urls.map((url) => {
    // 检查缓存
    if (imageCache.has(url)) {
      return Promise.resolve(imageCache.get(url)!);
    }

    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 允许跨域
      
      img.onload = () => {
        // 缓存成功加载的图片
        imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        // 加载失败时返回空图片对象，但标记为失败
        const fallbackImg = new Image();
        fallbackImg.src = IMAGE_CONSTANTS.DEFAULT_COVER_PLACEHOLDER;
        fallbackImg.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        fallbackImg.onload = () => resolve(fallbackImg);
      };
      
      img.src = url;
    });
  });

  return Promise.all(loadPromises);
}

/**
 * 清除图片缓存
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * 生成Best10图片（优化版）
 * @param books 书籍列表
 * @param config 生成器配置
 * @returns Promise<Blob> 生成的图片Blob
 */
export async function generateImage(
  books: BookEntry[],
  config: GeneratorConfig
): Promise<Blob> {
  // 创建Canvas元素
  const canvas = document.createElement('canvas');
  canvas.width = config.layout.width;
  canvas.height = config.layout.height;
  
  const ctx = canvas.getContext('2d', {
    alpha: false, // 不需要透明度，提升性能
    willReadFrequently: false, // 优化渲染性能
  });
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 预加载所有封面图片
  const coverUrls = books
    .filter(book => book.selectedBook || book.customCover)
    .map(book => book.customCover || book.selectedBook?.coverLargeUrl || book.selectedBook?.coverUrl || '');
  
  // 如果有背景图片，也预加载
  if (config.backgroundImage) {
    coverUrls.push(config.backgroundImage);
  }
  
  const loadedImages = await preloadImages(coverUrls);
  const imageMap = new Map<number, HTMLImageElement>();
  
  // 提取背景图片（如果有）
  let backgroundImageElement: HTMLImageElement | undefined;
  if (config.backgroundImage) {
    backgroundImageElement = loadedImages.pop(); // 取出最后一个作为背景图
  }
  
  let imageIndex = 0;
  books.forEach(book => {
    if (book.selectedBook || book.customCover) {
      imageMap.set(book.rank, loadedImages[imageIndex]);
      imageIndex++;
    }
  });

  // 使用 requestAnimationFrame 确保渲染在浏览器空闲时执行
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      // 绘制背景
      drawBackground(ctx, config, backgroundImageElement);

      // 绘制标题
      drawTitle(ctx, config);

      // 绘制书籍
      drawBooks(ctx, books, imageMap, config);
      
      resolve();
    });
  });

  // 转换为Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      },
      'image/png',
      IMAGE_CONSTANTS.EXPORT_QUALITY
    );
  });
}

/**
 * 绘制背景
 */
function drawBackground(
  ctx: CanvasRenderingContext2D, 
  config: GeneratorConfig, 
  backgroundImage?: HTMLImageElement
): void {
  // 先绘制背景颜色
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, config.layout.width, config.layout.height);
  
  // 如果有背景图片，绘制背景图片
  if (backgroundImage) {
    const canvasWidth = config.layout.width;
    const canvasHeight = config.layout.height;
    const imgWidth = backgroundImage.width;
    const imgHeight = backgroundImage.height;
    
    // 计算缩放比例，使图片覆盖整个画布（cover模式）
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    
    // 居中绘制
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;
    
    // 绘制背景图片，带有一定的透明度
    ctx.globalAlpha = 0.7;
    ctx.drawImage(backgroundImage, x, y, scaledWidth, scaledHeight);
    ctx.globalAlpha = 1.0;
    
    // 添加一层半透明遮罩，增强文字可读性
    ctx.fillStyle = config.backgroundColor;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.globalAlpha = 1.0;
  }
}

/**
 * 绘制标题
 */
function drawTitle(ctx: CanvasRenderingContext2D, config: GeneratorConfig): void {
  const { title, subtitle } = config;
  const { width, padding } = config.layout;
  const { title: titleFontSize } = config.fontSize;

  ctx.fillStyle = config.textColor;
  ctx.font = `bold ${titleFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // 绘制主标题
  const titleY = padding + 20;
  ctx.fillText(title, width / 2, titleY);

  // 绘制副标题（如果有）
  if (subtitle) {
    ctx.font = `${titleFontSize * 0.6}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(subtitle, width / 2, titleY + titleFontSize + 10);
  }
}

/**
 * 绘制书籍列表
 */
function drawBooks(
  ctx: CanvasRenderingContext2D,
  books: BookEntry[],
  imageMap: Map<number, HTMLImageElement>,
  config: GeneratorConfig
): void {
  const layoutMode = config.layout.mode || 'list';
  
  if (layoutMode === 'grid') {
    drawBooksGrid(ctx, books, imageMap, config);
  } else {
    drawBooksList(ctx, books, imageMap, config);
  }
}

/**
 * 绘制书籍列表（列表模式）
 */
function drawBooksList(
  ctx: CanvasRenderingContext2D,
  books: BookEntry[],
  imageMap: Map<number, HTMLImageElement>,
  config: GeneratorConfig
): void {
  const { width, height, padding, spacing } = config.layout;
  const { rank: rankFontSize, bookName: bookNameFontSize } = config.fontSize;

  // 计算标题区域高度
  const titleAreaHeight = padding + 20 + config.fontSize.title + (config.subtitle ? config.fontSize.title * 0.6 + 10 : 0) + 40;

  // 计算可用区域
  const availableHeight = height - titleAreaHeight - padding;
  const booksWithContent = books.filter(book => book.selectedBook || book.customCover);
  
  if (booksWithContent.length === 0) {
    return;
  }

  // 计算每本书的高度
  const bookHeight = (availableHeight - spacing * (booksWithContent.length - 1)) / booksWithContent.length;
  
  // 封面宽度（保持宽高比约为2:3）
  const coverWidth = bookHeight * 0.6;
  const coverHeight = bookHeight * 0.9;

  let currentY = titleAreaHeight;

  booksWithContent.forEach((book) => {
    const image = imageMap.get(book.rank);
    
    if (image) {
      // 绘制排名
      ctx.fillStyle = config.accentColor;
      ctx.font = `bold ${rankFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const rankX = padding;
      const rankY = currentY + bookHeight / 2;
      ctx.fillText(`${book.rank}`, rankX, rankY);

      // 绘制封面（紧凑模式使用等比缩放，保持图片完整）
      const coverX = rankX + rankFontSize * 2;
      const coverY = currentY + (bookHeight - coverHeight) / 2;
      
      drawCoverImage(ctx, image, coverX, coverY, coverWidth, coverHeight, 'contain');

      // 绘制书名
      ctx.fillStyle = config.textColor;
      ctx.font = `${bookNameFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const bookNameX = coverX + coverWidth + 20;
      const bookNameY = currentY + bookHeight / 2;
      const maxBookNameWidth = width - bookNameX - padding;
      
      const displayName = book.selectedBook?.title || book.bookName;
      drawWrappedText(ctx, displayName, bookNameX, bookNameY, maxBookNameWidth, bookNameFontSize * 1.5);
    }

    currentY += bookHeight + spacing;
  });
}

/**
 * 绘制书籍列表（网格模式）
 * 布局: 
 * - 第一行: #2 (左), #1 (中间,大), #3 (右)
 * - 第二行: #4, #5, #6
 * - 第三行: #7, #8, #9, #10
 */
function drawBooksGrid(
  ctx: CanvasRenderingContext2D,
  books: BookEntry[],
  imageMap: Map<number, HTMLImageElement>,
  config: GeneratorConfig
): void {
  const { width, height, padding, spacing } = config.layout;

  // 计算标题区域高度
  const titleAreaHeight = padding + 20 + config.fontSize.title + (config.subtitle ? config.fontSize.title * 0.6 + 10 : 0) + 40;

  // 计算可用区域
  const availableHeight = height - titleAreaHeight - padding;
  const availableWidth = width - padding * 2;
  
  const booksWithContent = books.filter(book => book.selectedBook || book.customCover);
  
  if (booksWithContent.length === 0) {
    return;
  }

  // 分配行高比例: 第一行45%, 第二行30%, 第三行25%
  const row1Height = availableHeight * 0.42;
  const row2Height = availableHeight * 0.30;
  const row3Height = availableHeight * 0.28;

  // 分组书籍
  const row1Books = booksWithContent.filter(b => b.rank >= 1 && b.rank <= 3);
  const row2Books = booksWithContent.filter(b => b.rank >= 4 && b.rank <= 6);
  const row3Books = booksWithContent.filter(b => b.rank >= 7 && b.rank <= 10);

  let currentY = titleAreaHeight;

  // === 第一行: #1中间大, #2左, #3右 ===
  if (row1Books.length > 0) {
    const book1 = row1Books.find(b => b.rank === 1);
    const book2 = row1Books.find(b => b.rank === 2);
    const book3 = row1Books.find(b => b.rank === 3);

    // #1 的封面更大 (占中间40%宽度)
    const cover1Width = availableWidth * 0.35;
    const cover1Height = row1Height * 0.85;
    const cover1X = width / 2 - cover1Width / 2;
    const cover1Y = currentY + (row1Height - cover1Height) / 2 - 10;

    // #2 和 #3 的封面较小
    const sideWidth = (availableWidth - cover1Width - spacing * 2) / 2;
    const sideCoverWidth = sideWidth * 0.75;
    const sideCoverHeight = row1Height * 0.65;

    // 绘制 #2 (左边)
    if (book2) {
      const image = imageMap.get(book2.rank);
      if (image) {
        const x = padding + (sideWidth - sideCoverWidth) / 2;
        const y = currentY + (row1Height - sideCoverHeight) / 2 + 20;
        drawGridBookItem(ctx, image, book2, x, y, sideCoverWidth, sideCoverHeight, config, 'small');
      }
    }

    // 绘制 #1 (中间，大)
    if (book1) {
      const image = imageMap.get(book1.rank);
      if (image) {
        drawGridBookItem(ctx, image, book1, cover1X, cover1Y, cover1Width, cover1Height, config, 'large');
      }
    }

    // 绘制 #3 (右边)
    if (book3) {
      const image = imageMap.get(book3.rank);
      if (image) {
        const x = width - padding - sideWidth + (sideWidth - sideCoverWidth) / 2;
        const y = currentY + (row1Height - sideCoverHeight) / 2 + 20;
        drawGridBookItem(ctx, image, book3, x, y, sideCoverWidth, sideCoverHeight, config, 'small');
      }
    }

    currentY += row1Height + spacing;
  }

  // === 第二行: #4, #5, #6 ===
  if (row2Books.length > 0) {
    const itemWidth = availableWidth / 3;
    const coverWidth = itemWidth * 0.7;
    const coverHeight = row2Height * 0.65;

    row2Books.forEach((book, index) => {
      const image = imageMap.get(book.rank);
      if (image) {
        const x = padding + index * itemWidth + (itemWidth - coverWidth) / 2;
        const y = currentY + 10;
        drawGridBookItem(ctx, image, book, x, y, coverWidth, coverHeight, config, 'medium');
      }
    });

    currentY += row2Height + spacing;
  }

  // === 第三行: #7, #8, #9, #10 ===
  if (row3Books.length > 0) {
    const itemWidth = availableWidth / 4;
    const coverWidth = itemWidth * 0.75;
    const coverHeight = row3Height * 0.6;

    row3Books.forEach((book, index) => {
      const image = imageMap.get(book.rank);
      if (image) {
        const x = padding + index * itemWidth + (itemWidth - coverWidth) / 2;
        const y = currentY + 5;
        drawGridBookItem(ctx, image, book, x, y, coverWidth, coverHeight, config, 'small');
      }
    });
  }
}

/**
 * 绘制单个网格书籍项
 */
function drawGridBookItem(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  book: BookEntry,
  x: number,
  y: number,
  coverWidth: number,
  coverHeight: number,
  config: GeneratorConfig,
  size: 'large' | 'medium' | 'small'
): void {
  const { rank: rankFontSize, bookName: bookNameFontSize } = config.fontSize;
  
  // 根据尺寸调整字体
  const sizeMultiplier = size === 'large' ? 1.2 : (size === 'medium' ? 1.0 : 0.85);
  const adjustedRankSize = Math.round(rankFontSize * sizeMultiplier);
  const adjustedNameSize = Math.round(bookNameFontSize * sizeMultiplier * 0.9);

  // 绘制封面（使用等比缩放，保持图片完整）
  drawCoverImage(ctx, image, x, y, coverWidth, coverHeight, 'contain');

  // 绘制排名徽章 (左上角)
  const badgeSize = adjustedRankSize * 1.2;
  ctx.fillStyle = config.accentColor;
  ctx.beginPath();
  ctx.arc(x + badgeSize / 2 + 5, y + badgeSize / 2 + 5, badgeSize / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = config.backgroundColor;
  ctx.font = `bold ${adjustedRankSize * 0.7}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${book.rank}`, x + badgeSize / 2 + 5, y + badgeSize / 2 + 5);

  // 绘制书名 (封面下方)
  const titleY = y + coverHeight + 15;
  ctx.fillStyle = config.textColor;
  ctx.font = `${adjustedNameSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const displayName = book.selectedBook?.title || book.bookName;
  const maxTextWidth = coverWidth * 1.1;
  
  // 截断过长的标题
  let truncatedName = displayName;
  while (ctx.measureText(truncatedName).width > maxTextWidth && truncatedName.length > 0) {
    truncatedName = truncatedName.slice(0, -1);
  }
  if (truncatedName !== displayName) {
    truncatedName = truncatedName.slice(0, -2) + '...';
  }
  
  ctx.fillText(truncatedName, x + coverWidth / 2, titleY);

  // 绘制作者 (如果有空间且是大/中尺寸)
  if ((size === 'large' || size === 'medium') && book.selectedBook?.author?.[0]) {
    const authorY = titleY + adjustedNameSize + 8;
    ctx.fillStyle = config.textColor;
    ctx.globalAlpha = 0.7;
    ctx.font = `${adjustedNameSize * 0.75}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    
    let author = book.selectedBook.author[0];
    while (ctx.measureText(author).width > maxTextWidth && author.length > 0) {
      author = author.slice(0, -1);
    }
    if (author !== book.selectedBook.author[0]) {
      author = author.slice(0, -2) + '...';
    }
    
    ctx.fillText(author, x + coverWidth / 2, authorY);
    ctx.globalAlpha = 1.0;
  }
}

/**
 * 绘制封面图片（保持宽高比）
 * @param fitMode 
 *   - 'cover': 居中裁剪，填满整个区域（默认）
 *   - 'contain': 等比缩放，完整显示图片
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  fitMode: 'cover' | 'contain' = 'cover'
): void {
  const imgRatio = image.width / image.height;
  const boxRatio = maxWidth / maxHeight;

  let drawWidth = maxWidth;
  let drawHeight = maxHeight;
  let drawX = x;
  let drawY = y;

  if (fitMode === 'contain') {
    // 等比缩放，完整显示图片，居中对齐
    if (imgRatio > boxRatio) {
      // 图片更宽，以宽度为准
      drawWidth = maxWidth;
      drawHeight = maxWidth / imgRatio;
      drawY = y + (maxHeight - drawHeight) / 2;
    } else {
      // 图片更高，以高度为准
      drawHeight = maxHeight;
      drawWidth = maxHeight * imgRatio;
      drawX = x + (maxWidth - drawWidth) / 2;
    }
    // 直接绘制，无需裁剪
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  } else {
    // 居中裁剪模式（cover）
    if (imgRatio > boxRatio) {
      // 图片更宽，以高度为准
      drawWidth = maxHeight * imgRatio;
      drawX = x - (drawWidth - maxWidth) / 2;
    } else {
      // 图片更高，以宽度为准
      drawHeight = maxWidth / imgRatio;
      drawY = y - (drawHeight - maxHeight) / 2;
    }

    // 裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, maxWidth, maxHeight);
    ctx.clip();

    // 绘制图片
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    ctx.restore();
  }
}

/**
 * 绘制自动换行文本
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split('');
  let line = '';
  const lines: string[] = [];

  // 将文本分行
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line.length > 0) {
      lines.push(line);
      line = words[i];
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // 限制最多显示2行
  const displayLines = lines.slice(0, 2);
  if (lines.length > 2) {
    displayLines[1] = displayLines[1].slice(0, -3) + '...';
  }

  // 绘制文本（垂直居中）
  const totalHeight = displayLines.length * lineHeight;
  let currentY = y - totalHeight / 2 + lineHeight / 2;

  displayLines.forEach((line) => {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  });
}

/**
 * 下载图片
 * @param blob 图片Blob
 * @param filename 文件名
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成并下载图片
 * @param books 书籍列表
 * @param config 生成器配置
 * @param filename 文件名
 * @param format 图片格式 ('png' | 'jpeg')
 */
export async function generateAndDownload(
  books: BookEntry[],
  config: GeneratorConfig,
  filename: string = 'best10.png',
  format: 'png' | 'jpeg' = 'png'
): Promise<void> {
  const blob = await generateImage(books, config);
  
  // 如果需要转换为JPEG
  if (format === 'jpeg') {
    const jpegBlob = await convertToJpeg(blob);
    downloadImage(jpegBlob, filename.replace(/\.png$/, '.jpg'));
  } else {
    downloadImage(blob, filename);
  }
}

/**
 * 将PNG Blob转换为JPEG Blob
 */
async function convertToJpeg(blob: Blob): Promise<Blob> {
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
        IMAGE_CONSTANTS.JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}
