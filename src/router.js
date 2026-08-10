/* ============================================================
   WPF上位机学习平台 - 路由系统
   Hash 路由解析 · meta.json walk 递归 · 查找 · 导航
   ============================================================ */

/** @type {Array<{id:string, title:string, path:string, file:string, sectionIndex:number}>} */
let flatRoutes = [];

/** @type {Array} */
let meta = null;

/**
 * 加载 meta.json 并构建扁平路由表
 */
export async function loadMeta() {
  const res = await fetch('/content/meta.json');
  meta = await res.json();
  flatRoutes = [];
  walkSections(meta.sections);
  return meta;
}

/**
 * 递归遍历 sections，将叶子节点加入 flatRoutes
 * @param {Array} nodes
 * @param {number} depth
 */
function walkSections(nodes, depth = 0) {
  for (const node of nodes) {
    // 叶子节点（有 path 和 file）
    if (node.path && node.file) {
      flatRoutes.push({
        id: node.id,
        title: node.title,
        path: node.path,
        file: node.file,
        depth
      });
    }
    // 分支节点（有 children）
    if (node.children && Array.isArray(node.children)) {
      walkSections(node.children, depth + 1);
    }
  }
}

/**
 * 将 hash 转换为内部路径
 * e.g. #/chapter/01-quickstart/hello-world → /chapter/01-quickstart/hello-world
 */
export function hashToPath() {
  const hash = window.location.hash.slice(1) || '/';
  try {
    return decodeURIComponent(hash);
  } catch (e) {
    return hash;
  }
}

/**
 * 将内部路径转换为 hash
 */
export function pathToHash(path) {
  return '#' + path;
}

/**
 * 按路径查找路由
 * @param {string} path
 */
export function findRouteByPath(path) {
  return flatRoutes.find(r => r.path === path) || null;
}

/**
 * 获取当前路由的上下篇
 * @param {string} path
 * @returns {{ prev: object|null, next: object|null, index: number, total: number }}
 */
export function getPrevNext(path) {
  const idx = flatRoutes.findIndex(r => r.path === path);
  if (idx === -1) {
    return { prev: null, next: null, index: -1, total: flatRoutes.length };
  }
  return {
    prev: idx > 0 ? flatRoutes[idx - 1] : null,
    next: idx < flatRoutes.length - 1 ? flatRoutes[idx + 1] : null,
    index: idx,
    total: flatRoutes.length
  };
}

/**
 * 获取指定 section 的所有叶子路由
 * @param {string} sectionId
 * @returns {Array}
 */
export function getSectionRoutes(sectionId) {
  // 在 meta.sections 中递归收集所有叶子
  const section = meta?.sections?.find(s => s.id === sectionId);
  if (!section) return [];
  return collectLeaves(section);
}

function collectLeaves(node) {
  const result = [];
  if (node.path && node.file) {
    result.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      result.push(...collectLeaves(child));
    }
  }
  return result;
}

/**
 * 导航到指定路径
 * @param {string} path
 */
export function navigate(path) {
  window.location.hash = pathToHash(path);
}

/**
 * 注册路由变化回调
 * @param {(path: string, route: object|null) => void} callback
 */
export function onRouteChange(callback) {
  window.addEventListener('hashchange', () => {
    const path = hashToPath();
    const route = findRouteByPath(path);
    callback(path, route);
  });
}

/**
 * 获取 flatRoutes（供搜索模块使用）
 */
export function getFlatRoutes() {
  return flatRoutes;
}

/**
 * 获取 meta 原始数据（供 UI 渲染侧边栏）
 */
export function getMeta() {
  return meta;
}
