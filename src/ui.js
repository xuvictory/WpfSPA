/* ============================================================
   WPF上位机学习平台 - UI 渲染
   三级侧边栏 · 章节导航 · 欢迎页 · Toast · 骨架屏 · 回到顶部
   ============================================================ */

import { getMeta } from './router.js';

/* --- 17 个一级菜单图标（工控意象 SVG） --- */
const SECTION_ICONS = [
  /* 00 编程先导课 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>`,
  /* 01 WPF快速入门 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  /* 02 XAML详解 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  /* 03 布局系统 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  /* 04 控件体系 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
  /* 05 WPF核心概念 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`,
  /* 06 图形与多媒体 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  /* 07 MVVM设计模式 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  /* 08 线程与异步 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
  /* 09 上位机通信协议 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  /* 10 数据采集与处理 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  /* 11 WPF高级UI */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>`,
  /* 12 系统架构与设计模式 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="8" y="17" width="8" height="4" rx="1"/></svg>`,
  /* 13 性能优化与调试 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  /* 14 工业级实战项目 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
  /* 15 部署与发布 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  /* 16 学习资源 */
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
];

/**
 * 渲染侧边栏
 * @param {string} currentPath - 当前路径
 */
export function renderSidebar(currentPath) {
  const meta = getMeta();
  if (!meta || !meta.sections) return;

  const nav = document.getElementById('sidebarNav');
  if (!nav) return;

  let html = '';
  meta.sections.forEach((section, idx) => {
    html += renderSection(section, currentPath, idx, 0);
  });

  nav.innerHTML = html;

  // 自动展开包含 active 项的 section
  setTimeout(() => scrollSidebarToActive(), 100);
}

/**
 * 递归渲染一个菜单节点
 * @param {object} node
 * @param {string} currentPath
 * @param {number} sectionIndex - 顶级 section 的索引（用于图标）
 * @param {number} depth - 0=顶级, 1=二级分组, 2=叶子
 * @returns {string}
 */
function renderSection(node, currentPath, sectionIndex, depth) {
  // 叶子节点
  if (node.path && node.file) {
    const isActive = currentPath === node.path;
    const activeClass = isActive ? ' active' : '';
    if (depth <= 1) {
      return `<a href="#${node.path}" class="sidebar-direct-leaf${activeClass}" data-path="${node.path}">${node.title}</a>`;
    }
    return `<a href="#${node.path}" class="sidebar-leaf${activeClass}" data-path="${node.path}">${node.title}</a>`;
  }

  // 分支节点 - 判断是否有后代节点处于激活状态
  const hasActiveDescendant = node.children ? hasActive(node.children, currentPath) : false;
  const isOpen = depth === 0 ? (sectionIndex < 2 || hasActiveDescendant) : (hasActiveDescendant);

  if (depth === 0) {
    // 一级菜单（section）
    const icon = SECTION_ICONS[sectionIndex] || SECTION_ICONS[0];
    const openClass = isOpen ? ' open' : '';
    const activeClass = hasActiveDescendant ? ' active' : '';

    let childrenHtml = '';
    if (node.children) {
      childrenHtml = '<div class="sidebar-children">';
      node.children.forEach(child => {
        childrenHtml += renderSection(child, currentPath, sectionIndex, depth + 1);
      });
      childrenHtml += '</div>';
    }

    return `<div class="sidebar-section${openClass}${activeClass}">
      <button class="sidebar-section-header" data-section-id="${node.id}">
        <span class="section-icon">${icon}</span>
        <span class="section-title">${node.title}</span>
        <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      ${childrenHtml}
    </div>`;
  }

  // 二级分组（subgroup）
  if (depth === 1) {
    const openClass = isOpen ? ' open' : '';
    let childrenHtml = '';
    if (node.children) {
      childrenHtml = '<div class="sidebar-subgroup-children">';
      node.children.forEach(child => {
        childrenHtml += renderSection(child, currentPath, sectionIndex, depth + 1);
      });
      childrenHtml += '</div>';
    }

    return `<div class="sidebar-subgroup${openClass}">
      <button class="sidebar-subgroup-header">
        <svg class="subgroup-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        <span>${node.title}</span>
      </button>
      ${childrenHtml}
    </div>`;
  }

  // depth >= 2 继续递归
  let html = '';
  if (node.children) {
    node.children.forEach(child => {
      html += renderSection(child, currentPath, sectionIndex, depth + 1);
    });
  }
  return html;
}

/**
 * 检查节点的后代中是否有当前激活路径
 */
function hasActive(nodes, currentPath) {
  for (const node of nodes) {
    if (node.path === currentPath) return true;
    if (node.children && hasActive(node.children, currentPath)) return true;
  }
  return false;
}

/**
 * 滚动侧边栏到激活项
 */
function scrollSidebarToActive() {
  const activeEl = document.querySelector('.sidebar-leaf.active, .sidebar-direct-leaf.active');
  if (activeEl) {
    activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

/**
 * 渲染章节导航（顶部 + 底部）
 * @param {object} prev
 * @param {object} next
 */
export function renderChapterNav(prev, next) {
  const wrapper = document.getElementById('contentWrapper');
  if (!wrapper) return;

  const hasPrev = prev && prev.title;
  const hasNext = next && next.title;

  // 移除旧的 nav
  wrapper.querySelectorAll('.chapter-nav').forEach(el => el.remove());

  const article = document.getElementById('articleContent');
  const quizSection = document.getElementById('quizSection');

  const buildNav = (extraClass = '') => `
    <div class="chapter-nav ${extraClass}">
      <a href="#${hasPrev ? prev.path : ''}" class="chapter-nav-btn prev${hasPrev ? '' : ' disabled'}" ${!hasPrev ? 'aria-disabled="true"' : ''}>
        <span class="chapter-nav-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </span>
        <span class="chapter-nav-info">
          <span class="chapter-nav-label">上一节</span>
          <span class="chapter-nav-title">${hasPrev ? prev.title : '已到第一章'}</span>
        </span>
      </a>
      <span class="chapter-nav-divider"></span>
      <a href="#${hasNext ? next.path : ''}" class="chapter-nav-btn next${hasNext ? '' : ' disabled'}" ${!hasNext ? 'aria-disabled="true"' : ''}>
        <span class="chapter-nav-info">
          <span class="chapter-nav-label">下一节</span>
          <span class="chapter-nav-title">${hasNext ? next.title : '恭喜完成全部课程!'}</span>
        </span>
        <span class="chapter-nav-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </span>
      </a>
    </div>
  `;

  // 顶部 nav（文章前）
  if (article) {
    article.insertAdjacentHTML('beforebegin', buildNav('chapter-nav-top'));
  }

  // 底部 nav（测验后）
  if (quizSection) {
    quizSection.insertAdjacentHTML('afterend', buildNav('chapter-nav-bottom'));
  }
}

/**
 * 渲染欢迎页
 */
export function renderWelcome() {
  const skeleton = document.getElementById('articleSkeleton');
  const article = document.getElementById('articleContent');
  const welcome = document.getElementById('welcomeHero');
  const quiz = document.getElementById('quizSection');

  if (skeleton) skeleton.style.display = 'none';
  if (article) article.style.display = 'none';
  if (welcome) welcome.style.display = 'flex';
  if (quiz) quiz.innerHTML = '';

  // 清除章节导航
  document.querySelectorAll('.chapter-nav').forEach(el => el.remove());
}

/**
 * 移动端侧边栏
 */
export function initMobileSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const mask = document.getElementById('sidebarMask');

  if (!hamburger || !sidebar || !mask) return;

  function openSidebar() {
    sidebar.classList.add('open');
    mask.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    mask.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  mask.addEventListener('click', closeSidebar);

  // 点击侧边栏链接后关闭
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('a') && window.innerWidth <= 900) {
      setTimeout(closeSidebar, 200);
    }
  });
}

/**
 * 显示骨架屏
 */
export function showSkeleton() {
  const skeleton = document.getElementById('articleSkeleton');
  const article = document.getElementById('articleContent');
  const welcome = document.getElementById('welcomeHero');
  const quiz = document.getElementById('quizSection');

  if (skeleton) skeleton.style.display = 'block';
  if (article) {
    article.style.display = 'none';
    article.innerHTML = '';
  }
  if (welcome) welcome.style.display = 'none';
  if (quiz) quiz.innerHTML = '';

  document.querySelectorAll('.chapter-nav').forEach(el => el.remove());
}

/**
 * 隐藏骨架屏，显示文章
 */
export function hideSkeleton() {
  const skeleton = document.getElementById('articleSkeleton');
  if (skeleton) skeleton.style.display = 'none';
}

/**
 * Toast 通知
 * @param {string} message
 * @param {string} icon
 * @param {number} duration
 */
export function showToast(message, icon = '✅', duration = 2500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 回到顶部按钮
 */
export function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (scrollY > 400) {
          btn.classList.add('visible');
        } else {
          btn.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * 侧边栏折叠/展开交互（事件委托）
 */
export function initSidebarToggle() {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    // 一级菜单折叠
    const sectionHeader = e.target.closest('.sidebar-section-header');
    if (sectionHeader) {
      e.preventDefault();
      const section = sectionHeader.closest('.sidebar-section');
      if (section) {
        section.classList.toggle('open');
      }
      return;
    }

    // 二级分组折叠
    const subgroupHeader = e.target.closest('.sidebar-subgroup-header');
    if (subgroupHeader) {
      e.preventDefault();
      const subgroup = subgroupHeader.closest('.sidebar-subgroup');
      if (subgroup) {
        subgroup.classList.toggle('open');
      }
    }
  });
}

/**
 * 代码复制事件委托
 */
export function attachCodeBlockListeners() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.code-copy-btn');
    if (!btn) return;

    const code = btn.getAttribute('data-code');
    if (!code) return;

    // 解码 HTML 实体
    const decoded = code
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    navigator.clipboard.writeText(decoded).then(() => {
      btn.textContent = '✅ 已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 复制';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      showToast('复制失败，请手动选择', '❌');
    });
  });
}
