/* ============================================================
   WPF上位机学习平台 - 全文搜索
   懒加载索引 · 权重评分 · Ctrl+K 快捷键
   ============================================================ */

import { getFlatRoutes, navigate } from './router.js';
import { getRawContent } from './markdown.js';

/** @type {Array<{route, title, content, snippet}>} */
let searchIndex = null;
let built = false;
let activeIdx = -1;
let lastQuery = '';

/**
 * 初始化搜索
 */
export function initSearch() {
  const input = document.getElementById('searchInput');
  const overlay = document.getElementById('searchOverlay');
  const panel = document.getElementById('searchPanel');
  const resultsEl = document.getElementById('searchResults');
  const countEl = document.getElementById('searchResultCount');

  if (!input || !overlay || !resultsEl) return;

  let debounceTimer;

  // 输入事件
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();

    if (query.length < 2) {
      closeSearch();
      return;
    }

    debounceTimer = setTimeout(() => {
      if (!built) buildIndex();
      performSearch(query);
    }, 150);
  });

  // 快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }

    // 搜索结果键盘导航
    if (overlay.classList.contains('open')) {
      const items = resultsEl.querySelectorAll('.search-result-item');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        updateActiveItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        updateActiveItem(items);
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        const item = items[activeIdx];
        if (item) {
          const path = item.getAttribute('data-path');
          navigate(path);
          closeSearch();
        }
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    }
  });

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  // 点击结果跳转
  resultsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) {
      const path = item.getAttribute('data-path');
      navigate(path);
      closeSearch();
    }
  });

  // hash 变化时关闭
  window.addEventListener('hashchange', closeSearch);

  function closeSearch() {
    overlay.classList.remove('open');
    resultsEl.innerHTML = '';
    countEl.textContent = '';
    activeIdx = -1;
    document.body.style.overflow = '';
  }

  function openSearch() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateActiveItem(items) {
    items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
    if (items[activeIdx]) {
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  async function performSearch(query) {
    lastQuery = query;
    if (!searchIndex) return;

    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = [];

    for (const item of searchIndex) {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();

      for (const kw of keywords) {
        // 标题匹配权重
        const titleIdx = titleLower.indexOf(kw);
        if (titleIdx !== -1) {
          score += 12;
          if (titleIdx === 0) score += 4; // 前缀匹配加成
        }

        // 内容匹配权重
        const contentIdx = contentLower.indexOf(kw);
        if (contentIdx !== -1) {
          score += 3;
        }
      }

      if (score > 0) {
        scored.push({ ...item, score });
      }
    }

    // 按分数排序
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 30);

    openSearch();
    countEl.textContent = top.length > 0 ? `共 ${top.length} 条结果` : '';

    if (top.length === 0) {
      resultsEl.innerHTML = '<div class="search-empty">未找到相关知识点，请尝试其他关键词</div>';
      return;
    }

    resultsEl.innerHTML = top.map((item, idx) => {
      const snippet = generateSnippet(item.content, keywords);
      return `<div class="search-result-item" data-path="${item.route.path}" data-idx="${idx}">
        <div class="search-result-title">${highlightText(item.title, keywords)}</div>
        ${snippet ? `<div class="search-result-snippet">${snippet}</div>` : ''}
      </div>`;
    }).join('');

    activeIdx = 0;
    const items = resultsEl.querySelectorAll('.search-result-item');
    if (items.length > 0) items[0].classList.add('active');
  }
}

/**
 * 构建搜索索引（懒加载）
 */
async function buildIndex() {
  if (built) return;
  built = true;

  const routes = getFlatRoutes();
  searchIndex = [];

  for (const route of routes) {
    try {
      const raw = await getRawContent(route.file);
      const content = stripMarkdown(raw);
      searchIndex.push({
        route,
        title: route.title,
        content
      });
    } catch (e) {
      // 文件加载失败则跳过
    }
  }
}

/**
 * 去除 Markdown 标记，提取纯文本
 */
function stripMarkdown(md) {
  let text = md;

  // 移除 Frontmatter
  text = text.replace(/^---[\s\S]*?---\n*/g, '');

  // 移除代码块
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 移除行内代码
  text = text.replace(/`[^`]+`/g, ' ');

  // 移除图片
  text = text.replace(/!\[.*?\]\(.*?\)/g, ' ');

  // 移除链接，保留文字
  text = text.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');

  // 移除标题标记
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 移除引用标记
  text = text.replace(/^>\s?/gm, '');

  // 移除列表标记
  text = text.replace(/^[-*+]\s/gm, '');
  text = text.replace(/^\d+[.)]\s/gm, '');

  // 移除加粗/斜体
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // 移除水平线
  text = text.replace(/^-{3,}/gm, '');
  text = text.replace(/^\*{3,}/gm, '');

  // 移除 HTML 标签
  text = text.replace(/<[^>]+>/g, ' ');

  // 合并多余空白
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * 生成带关键词高亮的摘要
 */
function generateSnippet(content, keywords) {
  const maxLen = 120;
  const lower = content.toLowerCase();

  // 找到第一个关键词位置
  let firstPos = Infinity;
  let firstKw = keywords[0];
  for (const kw of keywords) {
    const pos = lower.indexOf(kw);
    if (pos !== -1 && pos < firstPos) {
      firstPos = pos;
      firstKw = kw;
    }
  }

  if (firstPos === Infinity) return '';

  const start = Math.max(0, firstPos - 40);
  let snippet = content.slice(start, start + maxLen);

  if (start > 0) snippet = '...' + snippet;
  if (start + maxLen < content.length) snippet = snippet + '...';

  return highlightText(snippet, keywords);
}

/**
 * 高亮关键词
 */
function highlightText(text, keywords) {
  let result = text;
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  }
  return result;
}
