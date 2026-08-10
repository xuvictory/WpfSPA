/* ============================================================
   WPF上位机学习平台 - 学习进度追踪
   localStorage 持久化已读章节
   ============================================================ */

const STORAGE_KEY_READ = 'wpf-tutorial-read-chapters';
const STORAGE_KEY_SCORES = 'wpf-tutorial-quiz-scores';

/**
 * 标记章节为已读
 * @param {string} path - 章节路径
 */
export function markAsRead(path) {
  if (!path || path === '/') return;
  const readSet = getReadSet();
  readSet.add(path);
  localStorage.setItem(STORAGE_KEY_READ, JSON.stringify([...readSet]));
}

/**
 * 获取已读章节集合
 * @returns {Set<string>}
 */
function getReadSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/**
 * 检查某章节是否已读
 * @param {string} path
 * @returns {boolean}
 */
export function isRead(path) {
  return getReadSet().has(path);
}

/**
 * 获取某板块的阅读进度
 * @param {Array} leaves - 该板块所有叶子节点（含 path）
 * @returns {{ read: number, total: number, percent: number }}
 */
export function getSectionProgress(leaves) {
  if (!leaves || leaves.length === 0) return { read: 0, total: 0, percent: 0 };
  const readSet = getReadSet();
  let read = 0;
  for (const leaf of leaves) {
    if (readSet.has(leaf.path)) read++;
  }
  return {
    read,
    total: leaves.length,
    percent: Math.round((read / leaves.length) * 100)
  };
}

/**
 * 获取总学习进度
 * @param {number} totalChapters
 * @returns {{ read: number, total: number, percent: number }}
 */
export function getTotalProgress(totalChapters) {
  const readSet = getReadSet();
  return {
    read: readSet.size,
    total: totalChapters,
    percent: totalChapters > 0 ? Math.round((readSet.size / totalChapters) * 100) : 0
  };
}

/**
 * 保存测验成绩
 * @param {string} quizId
 * @param {number} score
 * @param {number} total
 */
export function saveQuizScore(quizId, score, total) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORES);
    const scores = raw ? JSON.parse(raw) : {};
    scores[quizId] = { score, total, time: Date.now() };
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scores));
  } catch (e) { console.error('保存测验成绩失败:', e); }
}

/**
 * 获取测验成绩
 * @param {string} quizId
 * @returns {{ score: number, total: number }|null}
 */
export function getQuizScore(quizId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCORES);
    const scores = raw ? JSON.parse(raw) : {};
    return scores[quizId] || null;
  } catch {
    return null;
  }
}

/**
 * 清除所有进度数据
 */
export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY_READ);
  localStorage.removeItem(STORAGE_KEY_SCORES);
}
