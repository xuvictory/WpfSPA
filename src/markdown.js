/* ============================================================
   WPF上位机学习平台 - Markdown 渲染引擎
   10 种 Callout · C#/XAML 高亮 · 渲染缓存
   ============================================================ */

import { marked } from 'marked';
import hljs from 'highlight.js';
import csharp from 'highlight.js/lib/languages/csharp';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import powershell from 'highlight.js/lib/languages/powershell';

// 注册语言
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('xaml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('ps', powershell);
hljs.registerLanguage('ps1', powershell);

/** @type {Map<string, string>} 渲染缓存 */
const renderCache = new Map();

/** @type {Map<string, string>} 原始内容缓存（供搜索使用） */
const rawContentCache = new Map();

/** Callout 正则：匹配 > [!type] title（兼容 CRLF） */
const CALLOUT_RE = /^>\s*\[!(plain|def|origin|essentials|example|scene|pitfall|best|practice|related)\]\s*(.*?)\r?$/;

/** 十段式 Callout 的标题和图标映射 */
const CALLOUT_META = {
  plain:    { title: '白话理解', icon: '🎯', cls: 'callout-plain' },
  def:      { title: '官方定义', icon: '📖', cls: 'callout-def' },
  origin:   { title: '由来背景', icon: '📜', cls: 'callout-origin' },
  essentials: { title: '核心要点', icon: '🔧', cls: 'callout-essentials' },
  example:  { title: '完整示例', icon: '💻', cls: 'callout-example' },
  scene:    { title: '适用场景', icon: '✅', cls: 'callout-scene' },
  pitfall:  { title: '常见踩坑', icon: '⚠️', cls: 'callout-pitfall' },
  best:     { title: '最佳实践', icon: '🏆', cls: 'callout-best' },
  practice: { title: '上手练习', icon: '✋', cls: 'callout-practice' },
  related:  { title: '相关知识链接', icon: '🔗', cls: 'callout-related' }
};

/**
 * 解析 YAML Frontmatter（位于 --- 包裹块内）
 * @param {string} raw
 * @returns {{ frontmatter: object, body: string }}
 */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return { frontmatter: {}, body: raw };

  const fmStr = match[1];
  const body = raw.slice(match[0].length);
  const frontmatter = {};

  fmStr.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[key] = val;
    }
  });

  return { frontmatter, body };
}

/**
 * 预处理 Callout：将 > [!type] 块替换为占位符
 * 实际的 Callout HTML 渲染推迟到 marked.parse 之后，避免 marked 重新解析 HTML 导致结构破坏
 * @param {string} md
 * @param {string[]} callouts - 输出数组，收集渲染后的 Callout HTML
 * @returns {string}
 */
export function preprocessCallouts(md, callouts = []) {
  const lines = md.split('\n');
  const result = [];
  let inCallout = false;
  let inCalloutCode = false;
  let calloutType = '';
  let calloutContent = [];
  let currentTitle = '';

  function flushCallout() {
    if (!inCallout || calloutContent.length === 0) return;
    const idx = callouts.length;
    callouts.push(renderCalloutBlock(calloutType, currentTitle, calloutContent.join('\n')));
    result.push(`<!--CALLOUT:${idx}-->`);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(CALLOUT_RE);

    if (match) {
      flushCallout();
      inCallout = true;
      calloutType = match[1];
      currentTitle = match[2].trim();
      calloutContent = [];
      inCalloutCode = false;
    } else if (inCallout) {
      const trimmed = line.trim();
      const strippedLine = line.startsWith('>') ? line.replace(/^>\s?/, '') : line;
      const strippedTrim = strippedLine.trim();

      // 跟踪 callout 内的代码块状态
      if (/^```/.test(strippedTrim)) {
        inCalloutCode = !inCalloutCode;
      }

      // 在代码块内或当前行有 > 前缀 → 继续收集
      if (inCalloutCode || trimmed.startsWith('>')) {
        calloutContent.push(strippedLine);
      } else if (trimmed === '') {
        // 不在代码块内，且是空行 → 检查是否真的该断开
        // 下一行是 > 开头或新的 [!] 则继续，否则断开
        if (i + 1 < lines.length) {
          const nextTrimmed = lines[i + 1].trim();
          if (nextTrimmed.startsWith('>') || nextTrimmed === '') {
            calloutContent.push(strippedLine);
          } else {
            // 真的结束了
            flushCallout();
            inCallout = false;
            inCalloutCode = false;
            calloutContent = [];
            result.push(line);
          }
        } else {
          calloutContent.push(strippedLine);
        }
      } else {
        // 非空非 > 行，仍然收集（可能是列表或缩进内容）
        calloutContent.push(strippedLine);
      }
    } else {
      result.push(line);
    }
  }

  // 处理文件末尾的 callout
  flushCallout();

  return result.join('\n');
}

/**
 * 渲染单个 Callout 块（支持代码块 + inline markdown）
 */
function renderCalloutBlock(type, customTitle, content) {
  const meta = CALLOUT_META[type] || { title: '', icon: '', cls: 'callout-plain' };
  const title = customTitle || meta.title;
  const icon = meta.icon;
  const cls = meta.cls;

  const lines = content.replace(/\r/g, '').trim().split('\n');
  let bodyHtml = '';
  let inList = false;
  let inCode = false;
  let codeLines = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // 代码块起止
    if (/^```/.test(trimmed)) {
      if (inCode) {
        if (inList) { bodyHtml += '</ul>\n'; inList = false; }
        bodyHtml += renderCodeBlock(codeLines.join('\n'), codeLang);
        codeLines = [];
        inCode = false;
        codeLang = '';
      } else {
        if (inList) { bodyHtml += '</ul>\n'; inList = false; }
        inCode = true;
        codeLang = trimmed.replace(/^```\s*/, '');
      }
      continue;
    }

    if (inCode) {
      codeLines.push(lines[i]);
      continue;
    }

    // 空行
    if (trimmed === '') {
      if (inList) { bodyHtml += '</ul>\n'; inList = false; }
      continue;
    }

    // h5 / h6 标题（##### / ######）
    if (/^#{5,6}\s/.test(trimmed)) {
      if (inList) { bodyHtml += '</ul>\n'; inList = false; }
      const level = trimmed.startsWith('###### ') ? 6 : 5;
      const headingText = trimmed.replace(/^#{5,6}\s*/, '');
      bodyHtml += `<h${level} class="callout-heading">${marked.parseInline(headingText)}</h${level}>\n`;
      continue;
    }

    // 无序列表
    if (/^[-*+]\s/.test(trimmed)) {
      if (!inList) { bodyHtml += '<ul>\n'; inList = true; }
      const itemText = trimmed.replace(/^[-*+]\s*/, '');
      bodyHtml += `<li>${marked.parseInline(itemText)}</li>\n`;
      continue;
    }

    // 有序列表
    if (/^\d+[.)]\s/.test(trimmed) && !trimmed.startsWith('```')) {
      if (inList) { bodyHtml += '</ul>\n'; inList = false; }
      bodyHtml += `<p>${marked.parseInline(trimmed)}</p>\n`;
      continue;
    }

    // 三级练习（marked.parseInline 会自动处理其中的 **加粗**）
    if (/^(Lv\.\d|★)/.test(trimmed)) {
      if (inList) { bodyHtml += '</ul>\n'; inList = false; }
      bodyHtml += `<p>${marked.parseInline(trimmed)}</p>\n`;
      continue;
    }

    // 普通段落
    if (inList) { bodyHtml += '</ul>\n'; inList = false; }
    bodyHtml += `<p>${marked.parseInline(formatProse(trimmed))}</p>\n`;
  }

  if (inList) { bodyHtml += '</ul>\n'; }

  return `<div class="callout ${cls}">
<div class="callout-header"><span class="callout-icon">${icon}</span> ${title}</div>
<div class="callout-body">${bodyHtml}</div>
</div>`;
}

/** HTML 转义 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 将段落中以 "。" 结尾的句子换行显示（代码块/URL 不受影响）
 */
function formatProse(text) {
  // 保护 inline code（反引号内容），避免替换其中的句号
  const codes = [];
  const safe = text.replace(/`[^`]*`/g, (m) => {
    codes.push(m);
    return `\x00CODE\x00${codes.length - 1}\x00`;
  });

  // "。" 后插入 <br>
  let result = safe.replace(/。/g, '。<br>');

  // 还原 inline code
  result = result.replace(/\x00CODE\x00(\d+)\x00/g, (_, i) => codes[+i]);

  return result;
}

/**
 * 渲染带语法高亮、头部和复制按钮的代码块（Callout 内部复用）
 */
function renderCodeBlock(codeText, lang) {
  let highlighted;
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(codeText, { language: lang }).value;
    } catch (e) {
      highlighted = escapeHtml(codeText);
    }
  } else {
    try {
      const result = hljs.highlightAuto(codeText);
      highlighted = result.relevance > 3 ? result.value : escapeHtml(codeText);
    } catch (e) {
      highlighted = escapeHtml(codeText);
    }
  }

  const langName = lang || 'plaintext';
  const escapedCode = codeText
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;');

  return `<div class="code-block-wrapper">\n`
    + `<div class="code-block-header"><span class="code-lang">${escapeHtml(langName)}</span>`
    + `<button class="code-copy-btn" data-code="${escapedCode}">📋 复制</button></div>\n`
    + `<pre><code class="language-${escapeHtml(langName)}">${highlighted}</code></pre>\n`
    + `</div>\n`;
}

/**
 * 渲染 Markdown 内容
 * @param {string} raw - 原始 Markdown 文本
 * @returns {string} HTML
 */
export function renderMarkdown(raw) {
  // Frontmatter 解析
  const { body } = parseFrontmatter(raw);

  // Callout 预处理：收集渲染后的 HTML 并用占位符替换
  const callouts = [];
  const preprocessed = preprocessCallouts(body, callouts);

  // marked 渲染（此时不会触碰 Callout HTML）
  let html = marked.parse(preprocessed, {
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (e) { /* fall through */ }
      }
      // 自动检测
      try {
        const result = hljs.highlightAuto(code);
        if (result.relevance > 3) return result.value;
      } catch (e) { /* fall through */ }
      return code;
    }
  });

  // 将占位符替换为预先渲染好的 Callout HTML
  if (callouts.length) {
    html = html.replace(/<!--CALLOUT:(\d+)-->/g, (_, i) => callouts[+i] || '');
  }

  return html;
}

/**
 * 自定义 marked renderer（代码块包装 + 复制按钮）
 */
function setupMarkedRenderer() {
  const renderer = new marked.Renderer();

  renderer.code = function({ text, lang }) {
    return renderCodeBlock(text, lang);
  };

  // 全文段落按句号换行
  renderer.paragraph = function({ text }) {
    return `<p>${formatProse(text)}</p>\n`;
  };

  marked.setOptions({ renderer });
}

// 初始化 marked 渲染器
setupMarkedRenderer();

/**
 * Fetch 并渲染 Markdown 文件
 * @param {string} file - 文件路径，如 "00-prelude/intro.md"
 * @returns {Promise<{html: string, title: string}>}
 */
export async function fetchAndRenderMarkdown(file) {
  // 检查缓存
  if (renderCache.has(file)) {
    const cached = renderCache.get(file);
    return { html: cached.html, title: cached.title };
  }

  const res = await fetch(`/content/${file}`);
  if (!res.ok) throw new Error(`无法加载文件: ${file}`);

  const raw = await res.text();
  rawContentCache.set(file, raw);

  const { frontmatter } = parseFrontmatter(raw);
  const html = renderMarkdown(raw);

  // 提取标题
  let title = frontmatter.title || '';
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
    if (h1Match) title = h1Match[1];
  }

  const cached = { html, title };
  renderCache.set(file, cached);

  // 限制缓存大小
  if (renderCache.size > 30) {
    const firstKey = renderCache.keys().next().value;
    renderCache.delete(firstKey);
  }

  return cached;
}

/**
 * 包装文章：如果没有 h1，自动添加标题
 * @param {string} html
 * @param {string} title
 * @returns {string}
 */
export function wrapArticle(html, title) {
  if (!html.match(/<h1[^>]*>/) && title) {
    html = `<h1>${title}</h1>\n${html}`;
  }
  return html;
}

/**
 * 获取原始 Markdown 内容（供搜索使用）
 * @param {string} file
 * @returns {Promise<string>}
 */
export async function getRawContent(file) {
  if (rawContentCache.has(file)) {
    return rawContentCache.get(file);
  }
  try {
    const res = await fetch(`/content/${file}`);
    const text = await res.text();
    rawContentCache.set(file, text);
    return text;
  } catch (e) {
    return '';
  }
}

/**
 * 清除缓存
 */
export function clearCache() {
  renderCache.clear();
  rawContentCache.clear();
}
