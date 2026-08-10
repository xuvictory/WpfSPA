/* ============================================================
   WPF上位机学习平台 - 应用入口
   boot() 启动流程 · 模块编排 · 路由监听
   ============================================================ */

import { loadMeta, hashToPath, findRouteByPath, onRouteChange, getPrevNext } from './router.js';
import { fetchAndRenderMarkdown, wrapArticle, clearCache } from './markdown.js';
import {
  renderSidebar,
  renderChapterNav,
  renderWelcome,
  initMobileSidebar,
  initBackToTop,
  initSidebarToggle,
  attachCodeBlockListeners,
  showSkeleton,
  hideSkeleton,
  showToast
} from './ui.js';
import { initSearch } from './search.js';
import { markAsRead } from './progress.js';
import { injectQuizIfNeeded } from './quiz.js';

/**
 * 应用启动
 */
async function boot() {
  // 基础 UI 初始化
  initMobileSidebar();
  initSearch();
  initBackToTop();
  initSidebarToggle();
  attachCodeBlockListeners();

  // 加载菜单数据
  await loadMeta();

  // 初始路由渲染
  const path = hashToPath();
  await handleRoute(path);

  // 监听路由变化
  onRouteChange(handleRoute);

  // 暴露调试 API
  exposeDebugAPI();

  console.log('🚀 WPF上位机学习平台已启动');
}

/**
 * 处理路由变化
 * @param {string} path
 * @param {object|null} _route
 */
async function handleRoute(path) {
  const articleEl = document.getElementById('articleContent');
  const welcomeEl = document.getElementById('welcomeHero');
  const quizEl = document.getElementById('quizSection');

  // 首页 → 欢迎页
  if (path === '/') {
    renderWelcome();
    renderSidebar(path);
    return;
  }

  // 查找路由
  const route = findRouteByPath(path);
  if (!route) {
    // 404 - 显示欢迎页
    renderWelcome();
    showToast('未找到该章节，已返回首页', '⚠️', 3000);
    return;
  }

  // 显示骨架屏
  showSkeleton();

  // 渲染侧边栏
  renderSidebar(path);

  try {
    // Fetch 并渲染 Markdown
    const { html, title } = await fetchAndRenderMarkdown(route.file);
    const wrapped = wrapArticle(html, title || route.title);

    // 渲染内容
    hideSkeleton();
    if (welcomeEl) welcomeEl.style.display = 'none';
    if (articleEl) {
      articleEl.innerHTML = wrapped;
      articleEl.style.display = 'block';
    }

    // 渲染章节导航
    const { prev, next } = getPrevNext(path);
    renderChapterNav(prev, next);

    // 标记已读
    markAsRead(path);

    // 注入测验
    await injectQuizIfNeeded(path);

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (err) {
    console.error('加载章节失败:', err);
    hideSkeleton();
    if (articleEl) {
      articleEl.style.display = 'block';
      articleEl.innerHTML = `
        <div style="text-align:center;padding:80px 20px;color:var(--text-muted)">
          <div style="font-size:3rem;margin-bottom:16px">😵</div>
          <h2 style="color:var(--text-primary);margin-bottom:8px">内容加载失败</h2>
          <p>文件可能尚未创建：${route.file}</p>
          <p style="font-size:0.85rem;margin-top:16px">已自动创建占位内容，继续探索其他章节吧~</p>
        </div>`;
    }
  }
}

/**
 * 暴露全局调试 API
 */
function exposeDebugAPI() {
  window.__wpfTutorial = {
    clearCache: () => {
      clearCache();
      showToast('缓存已清除', '🗑️');
    },

    showProgress: async () => {
      const { getTotalProgress } = await import('./progress.js');
      const { getFlatRoutes } = await import('./router.js');
      const routes = getFlatRoutes();
      const progress = getTotalProgress(routes.length);
      showToast(
        `总进度：${progress.read}/${progress.total}（${progress.percent}%）`,
        '📊',
        4000
      );
    },

    resetProgress: async () => {
      const { clearProgress } = await import('./progress.js');
      clearProgress();
      showToast('学习进度已重置', '🔄');
    },

    version: '1.0.0'
  };
}

// 启动
boot();
