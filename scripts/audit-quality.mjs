/**
 * audit-quality.mjs —— WpfSPA 全站文章高质量输出审计脚本(一次性,只读)
 *
 * 判定基准:public/content/05-core-concepts/什么是依赖属性.md
 * 规范来源:章节内容更新经验归档.md 第 8 节「高质量文章写作规范」
 *
 * 检查维度:
 *  1. frontmatter 完整性(title/section/parent)与一级标题
 *  2. 10 种 Callout 齐全度与卡片正文深度(plain/def/origin/essentials/example/scene/pitfall/best/practice/related)
 *  3. 正文/代码篇幅深度
 *  4. 占位符与废话模板残留
 *  5. 示例代码质量(HmiDemo 命名空间、暗色工控主题、xml/csharp 代码块、x:Name 与 Click 事件对应)
 *  6. related 站内链接有效性
 *  7. 全文重复检测(归一化哈希)与同章节行级 Jaccard 相似度
 *  8. 菜单-文件一致性(幽灵条目 / 孤立文件)
 *
 * 输出:scripts/audit-output.json + 控制台汇总。不修改任何文章。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'public', 'content');
const META_FILE = path.join(CONTENT_DIR, 'meta.json');
const OUTPUT_FILE = path.join(__dirname, 'audit-output.json');

const CALL_TYPES = ['plain', 'def', 'origin', 'essentials', 'example', 'scene', 'pitfall', 'best', 'practice', 'related'];

// ---------- 工具 ----------
// 归一化:仅保留小写字母/数字/中文,用于站内匹配
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
const readUtf8 = (p) => fs.readFileSync(p, 'utf8');

// 真正的占位符/未完成信号(排除"占位符/占位元素/布局占位"等正常语境)
const PLACEHOLDER_PATTERNS = [
  '待补充实际示例代码', '待补充', '待完善', '待加入', '待写', '待更新',
  'TODO:', 'TODO(', 'TODO（', 'TBD', 'FIXME', '敬请期待',
  '此处插入', '此处填写', '此处补充', '内容待补', '示例待补',
  '占位TODO', '占位，待', '占位,待',
];
// 兜底:特征词"待完成"单独处理(避免误报"等待完成")
const PLACEHOLDER_REGEX = [
  /待(补充|完善|加入|编写|重写|更新|补全)([^（(]|$)/,
  /（待(补充|完善|更新|加入|编写)|\(待(补充|完善|更新|加入|编写)/,
  /TODO\s*[:：]/,
  /此处(插入|填写|补充)/,
  /内容待(补|完善)/,
  /示例待/,
  /敬请期待/,
];
// 纯属"撑字数"的废话特征(短卡片才判定)
const FLUFF_PATTERNS = [
  '学习本章内容需要掌握', '本章节将介绍', '本章节主要讲解', '通过本篇文章',
];

// ---------- 1. 解析 meta.json 菜单树 ----------
const meta = JSON.parse(readUtf8(META_FILE));
const leaves = []; // 所有叶子(菜单文章)
(function walk(node) {
  if (Array.isArray(node)) { node.forEach(walk); return; }
  if (!node) return;
  if (node.children && Array.isArray(node.children)) node.children.forEach(walk);
  else if (node.file) leaves.push(node);
})(meta.sections || []);

const menuFiles = new Set(leaves.map((l) => l.file));
const menuTitles = new Set(leaves.map((l) => norm(l.title)));

// ---------- 2. 扫描全部 md 文件 ----------
const mdFiles = [];
(function walkDir(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p);
    else if (e.name.endsWith('.md')) mdFiles.push(path.relative(CONTENT_DIR, p).replace(/\\/g, '/'));
  }
})(CONTENT_DIR);
mdFiles.sort();

const fileBaseSet = new Set(mdFiles.map((f) => norm(path.basename(f).replace(/\.md$/, ''))));

// ---------- 3. 逐篇检查 ----------
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

const results = [];
for (const file of mdFiles) {
  const fullPath = path.join(CONTENT_DIR, file);
  // 统一行尾为 LF 并去除 BOM:CRLF 会让 `.` 不匹配 `\r` 导致正则解析失败
  const raw = readUtf8(fullPath).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');

  // --- frontmatter ---
  const fm = { title: null, section: null, parent: null };
  const fmMatch = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m && m[1] in fm) fm[m[1]] = m[2].trim();
    }
  }

  // --- 一级标题 ---
  const h1 = (raw.match(/^#\s+(.+)$/m) || [])[1] || null;

  // --- Callout 卡片解析 ---
  const callouts = {}; // type -> [{text, lines}]
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^\s*>\s*\[!(plain|def|origin|essentials|example|scene|pitfall|best|practice|related)\]\s*(.*)$/i);
    if (m) {
      cur = { type: m[1].toLowerCase(), text: m[2].trim(), lines: 1 };
      (callouts[cur.type] ||= []).push(cur);
    } else if (cur && /^\s*>\s?/.test(line)) {
      cur.lines++;
      cur.text = cur.text ? `${cur.text}\n${line.replace(/^\s*>\s?/, '')}` : line.replace(/^\s*>\s?/, '');
    } else {
      cur = null;
    }
  }

  // --- 代码块 ---
  const codeBlocks = [];
  const cbRe = /```(\w*)\r?\n([\s\S]*?)```/g;
  let cb;
  while ((cb = cbRe.exec(raw))) codeBlocks.push({ lang: cb[1], code: cb[2] });
  const codeChars = codeBlocks.reduce((a, c) => a + c.code.length, 0);
  const body = raw.replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[#>*`~|[\]{}()!]/g, '')
    .replace(/\s+/g, '');
  const bodyLen = body.length;

  // --- 占位符 / 废话 ---
  const placeholders = [];
  for (const p of PLACEHOLDER_PATTERNS) if (raw.includes(p)) placeholders.push(p);
  for (const re of PLACEHOLDER_REGEX) {
    const m = raw.match(re);
    if (m) placeholders.push(m[0].trim());
  }
  const fluffHits = [];
  for (const p of FLUFF_PATTERNS) {
    const idx = raw.indexOf(p);
    if (idx >= 0) {
      // 仅当命中处上下文确实缺乏实质内容时才算(此处只记录特征串本身)
      fluffHits.push(p);
    }
  }
  const shortCards = [];
  const formatBroken = [];
  for (const t of CALL_TYPES) {
    for (const c of callouts[t] || []) {
      if (c.text.replace(/\s/g, '').length < 40 && c.lines <= 2) {
        // 区分"真内容缺失"与"格式断裂":(A) 标题行后空行+内容以 > 开头(内容在卡片外);
        // (B) 标题行后直接是内容但未以 > 开头(内容脱离卡片)
        const idx = lines.findIndex((l) => l.includes(`> [!${t}]`));
        let broken = false;
        if (idx >= 0) {
          const n1 = lines[idx + 1];
          const n2 = lines[idx + 2];
          if ((n1 === undefined || n1.trim() === '') && n2 && /^\s*>\s?/.test(n2)) {
            broken = true;
            formatBroken.push(`${t}(L${idx + 1})`);
          } else if (n1 && n1.trim() !== '' && !/^\s*>\s?/.test(n1)) {
            broken = true;
            formatBroken.push(`${t}(L${idx + 1})`);
          }
        }
        shortCards.push(`${t}(${c.text.slice(0, 20)})`);
      }
    }
  }

  // --- 示例代码质量 ---
  const hasHmiDemo = /namespace\s+HmiDemo/.test(raw);
  const hasDarkTheme = /#0D1117|#161B22|#0D1117|#21262D|#3FB950|#58A6FF/.test(raw);
  const hasXmlBlock = codeBlocks.some((c) => c.lang === 'xml' || c.lang === 'xaml');
  const hasCsharpBlock = codeBlocks.some((c) => c.lang === 'csharp' || c.lang === 'cs');
  const xmlCode = codeBlocks.filter((c) => c.lang === 'xml' || c.lang === 'xaml').map((c) => c.code).join('\n');
  const csCode = codeBlocks.filter((c) => c.lang === 'csharp' || c.lang === 'cs').map((c) => c.code).join('\n');
  const xNames = [...xmlCode.matchAll(/x:Name="([\w.]+)"/g)].map((m) => m[1]);
  const clickEvents = [...xmlCode.matchAll(/Click="([\w.]+)"/g)].map((m) => m[1]);
  const csNames = new Set([
    ...csCode.matchAll(/^\s*(?:public|private|protected|internal|static|async|void|int|bool|string|double|float|decimal|long|object|var|Task|ObservableCollection<[^>]*>|SolidColorBrush|Brush|ICommand|void|string|double|int)\s+[\w<>,.?\[\] ]+\s+(\w+)\s*\([^)]*\)/gm).map((m) => m[1]),
    ...csCode.matchAll(/\b(?:void|bool|int|string|double|Task|object|ObservableCollection<[^>]*>|SolidColorBrush|Brush)\s+(\w+)\s*\([^)]*\)\s*{/g).map((m) => m[1]),
    ...csCode.matchAll(/\b(\w+)\s*\([^)]*\)\s*{/g).map((m) => m[1]),
  ]);
  const unmatchedClick = clickEvents.filter((ev) => !csNames.has(ev) && !csCode.includes(ev));

  // --- related 链接有效性 ---
  const relatedText = (callouts.related || []).map((c) => c.text).join('\n');
  const relatedRefs = [];
  // 《标题》引用
  for (const m of relatedText.matchAll(/《([^》]{2,40})》/g)) relatedRefs.push({ raw: m[1], kind: 'book' });
  // [text](url) 链接
  for (const m of relatedText.matchAll(/\[([^\]]{1,60})\]\(([^)]+)\)/g)) {
    if (/^https?:\/\//.test(m[2])) relatedRefs.push({ raw: m[1], kind: 'ext', url: m[2] });
    else relatedRefs.push({ raw: m[1] || m[2], kind: 'link', url: m[2] });
  }
  // 反引号文件名:仅当内容像文件名(含中文或连字符)才检查,排除纯代码/运算符/API 片段
  for (const m of relatedText.matchAll(/`([^`]{2,60})`/g)) {
    const c = m[1];
    const looksLikeName = /[\u4e00-\u9fa5]/.test(c) || /^[a-z][a-z0-9]+(?:-[a-z0-9]+)+$/i.test(c) || /[a-z]+[\u4e00-\u9fa5]/.test(c);
    if (looksLikeName) relatedRefs.push({ raw: c, kind: 'backtick' });
  }
  // 「直角引号」引用(如「什么是-mvvm」、「第 5 章·数据模板」)也计入站内引用
  for (const m of relatedText.matchAll(/「([^」]{2,40})」/g)) {
    // 拆分章节导航:「第 N 章·xxx」-> 实际目标为 xxx(章节内文章标题)
    const nav = m[1].match(/第\s*\d+\s*章\s*[·.、]?\s*(.+)/);
    relatedRefs.push({ raw: nav ? nav[1] : m[1], kind: 'book' });
  }
  // 章节级引用:如 "12.架构设计"、"网络基础概念（IP/端口/TCP vs UDP）" 等导航说明
  for (const m of relatedText.matchAll(/→\s*([^\n>\-]{2,50}?)(?=\n|$|📖)/g)) {
    const t = m[1].trim().replace(/^[：:]\s*/, '');
    if (t && /[\u4e00-\u9fa5]/.test(t)) relatedRefs.push({ raw: t, kind: 'nav' });
  }
  const related = { total: relatedRefs.length, ext: 0, invalid: [], navOk: 0 };
  const seenRefs = new Set();
  // 提取英文 token 集(用于顺序无关的中英混排匹配)
  const enTokens = (s) => [...String(s || '').matchAll(/[a-z][a-z0-9]*/gi)].map((m) => m[0].toLowerCase()).filter((t) => t.length >= 2);
  const cnPart = (s) => norm(String(s || '').replace(/[a-z0-9]/gi, ''));
  const matchCandidate = (refRaw, cand) => {
    const key = norm(refRaw);
    const c = norm(cand);
    if (!key || !c) return false;
    if (key === c) return true;
    if (key.includes(c) || c.includes(key)) return true; // 顺序一致的全串包含
    const kt = enTokens(refRaw), ct = enTokens(cand);
    if (kt.length && ct.length && kt.join(',') === ct.join(',')) return true; // 英文 token 集一致
    const kcn = cnPart(refRaw), ccn = cnPart(cand);
    if (kcn.length >= 2 && ccn.length >= 2 && (kcn.includes(ccn) || ccn.includes(kcn))) return true; // 中文部分包含
    return false;
  };
  const chapterTitles = (function flatten(nodes, acc = []) {
    for (const n of nodes) { if (n.title) acc.push(n.title); if (n.children) flatten(n.children, acc); }
    return acc;
  })(meta.sections || []);
  const allCandidates = [
    ...mdFiles.map((f) => path.basename(f).replace(/\.md$/, '')),
    ...leaves.map((l) => l.title),
    ...chapterTitles,
  ];
  for (const r of relatedRefs) {
    const key = norm(r.raw);
    if (seenRefs.has(key)) continue;
    seenRefs.add(key);
    if (r.kind === 'ext') { related.ext++; continue; }
    if (!key) continue;
    if (r.kind === 'link' && r.url && !/^https?:/.test(r.url)) {
      // 站内 markdown 链接:[xxx](yyy) -> yyy 可能是文件名
      if (allCandidates.some((cand) => matchCandidate(r.url.replace(/^\.?\//, '').replace(/\.md$/, ''), cand))) continue;
      related.invalid.push({ ref: r.raw, url: r.url, why: '站内链接目标不存在' });
      continue;
    }
    // 纯英文无中文的引用(如外文书名 "GUI Architectures")视为外链,不判失效
    if (!/[\u4e00-\u9fa5]/.test(r.raw) && enTokens(r.raw).length) { related.ext++; continue; }
    const ok = allCandidates.some((cand) => matchCandidate(r.raw, cand));
    if (ok) { if (r.kind === 'nav') related.navOk++; continue; }
    if (r.kind === 'nav') continue; // 章节/概念导航说明找不到具体文章不计为硬失效
    if (r.kind === 'backtick') {
      // 反引号中的代码/API 概念(如 IEnumerable<T>)找不到对应文章也不计为硬失效
      continue;
    }
    related.invalid.push({ ref: r.raw, why: '站内引用目标未找到' });
  }

  // --- 归一化正文(去代码块/空白/引用符号)用于重复检测 ---
  const normBody = raw.replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[\s\r\n#>*`~|-]/g, '')
    .replace(/[（(].{0,12}?(此处|待|略)[^)）]*[)）]/g, '')
    .toLowerCase();
  // 行级归一化(保留行结构)用于 Jaccard 相似度
  const normLines = raw.replace(/```[\s\S]*?```/g, '[CODE]')
    .replace(/^\s*>\s?/gm, '')
    .split(/\r?\n/)
    .map((l) => l.replace(/[^\u4e00-\u9fa5a-z0-9]/gi, '').toLowerCase())
    .filter((l) => l.length >= 8);

  results.push({
    file,
    size: fs.statSync(fullPath).size,
    fm,
    hasFm: Boolean(fmMatch),
    h1,
    bodyLen,
    codeBlocks: codeBlocks.length,
    codeChars,
    callouts: Object.fromEntries(CALL_TYPES.map((t) => [t, (callouts[t] || []).length])),
    calloutTotal: Object.values(callouts).reduce((a, c) => a + c.length, 0),
    shortCards: shortCards.filter((s) => !formatBroken.some((b) => b.startsWith(s.split('(')[0] + '('))),
    formatBroken,
    placeholders,
    fluffHits,
    example: { hasHmiDemo, hasDarkTheme, hasXmlBlock, hasCsharpBlock, xNames, clickEvents, unmatchedClick, eventCount: clickEvents.length },
    related,
    sha: sha1(normBody),
    normBody,
    normLines,
    });
}

// ---------- 4. 重复检测 ----------
const dupGroups = {};
for (const r of results) {
  if (!r.normBody) continue;
  (dupGroups[r.sha] ||= []).push(r.file);
}
const exactDupes = Object.values(dupGroups).filter((g) => g.length > 1);

// 两两 Jaccard(行级):同章节全部比较 + 跨章节抽样比较(按 sha 前缀分组后组内比较)
const jaccardPairs = [];
const seenPairs = new Set();
const calcJac = (a, b) => {
  const sa = a.normLines, sb = b.normLines;
  if (!sa.length || !sb.length) return 0;
  const setB = new Set(sb);
  let inter = 0;
  for (const l of sa) if (setB.has(l)) inter++;
  const union = sa.length + sb.length - inter;
  return inter / union;
};
// 同章节
const byDir = {};
for (const r of results) {
  const dir = path.posix.dirname(r.file);
  (byDir[dir] ||= []).push(r);
}
for (const arr of Object.values(byDir)) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (a.normLines.length < 5 || b.normLines.length < 5) continue;
      const jac = calcJac(a, b);
      if (jac >= 0.45) jaccardPairs.push({ a: a.file, b: b.file, jac: +jac.toFixed(3), dir: '同章节' });
    }
  }
}
// 跨章节:按 8 字符 sha 前缀分组,组内比较(模板雷同通常同前缀)
const shaGroups = {};
for (const r of results) {
  if (!r.normLines.length) continue;
  const p = r.sha.slice(0, 8);
  (shaGroups[p] ||= []).push(r);
}
for (const arr of Object.values(shaGroups)) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (path.posix.dirname(a.file) === path.posix.dirname(b.file)) continue;
      const jac = calcJac(a, b);
      if (jac >= 0.45) jaccardPairs.push({ a: a.file, b: b.file, jac: +jac.toFixed(3), dir: '跨章节' });
    }
  }
}
jaccardPairs.sort((x, y) => y.jac - x.jac);

// ---------- 5. 幽灵条目 / 孤立文件 ----------
const ghostEntries = leaves.filter((l) => !mdFiles.includes(l.file)).map((l) => ({ file: l.file, title: l.title }));
const orphanFiles = mdFiles.filter((f) => !menuFiles.has(f) && path.basename(f) !== 'meta.json');

// ---------- 6. 自动分级(脚本级,后续人工复核校准) ----------
const C_SHARP_ONLY_DIRS = new Set(['00-prelude', '01-quickstart', '16-resources']);
const INSTALL_ARTICLES = new Set([
  '00-prelude/visual-studio-2022-安装与配置.md',
  '00-prelude/net-sdk-安装.md',
]);
function grade(r, file) {
  const missing = CALL_TYPES.filter((t) => !(r.callouts[t] > 0));
  const reasons = [];
  if (r.placeholders.length) reasons.push(`占位/废话模板: ${r.placeholders.join(',')}`);
  if (missing.length >= 3) reasons.push(`缺失 ${missing.length} 种 Callout(${missing.join(',')})`);
  if (missing.length === 1) reasons.push(`缺 Callout: ${missing[0]}`);
  if (missing.length === 2) reasons.push(`缺 Callout: ${missing.join(',')}`);
  if (r.bodyLen < 700) reasons.push(`正文过短(${r.bodyLen} 字)`);
  // 无 C#/XML 代码块仅作提示(说明性/纯声明式主题合理),不降级
  const notes = [];
  if (!r.example.hasXmlBlock) notes.push('无 XML 代码块');
  if (!r.example.hasCsharpBlock) notes.push('无 C# 代码块');
  if (r.example.unmatchedClick.length) reasons.push(`Click 无对应实现: ${r.example.unmatchedClick.join(',')}`);
  if (r.related.invalid.length >= 2) reasons.push(`related 失效 ${r.related.invalid.length} 条`);
  if (r.shortCards.length) reasons.push(`短卡片 ${r.shortCards.length} 条`);
  if (r.fluffHits.length) reasons.push(`废话模板: ${r.fluffHits.join(',')}`);
  const formatNote = r.formatBroken.length ? `格式断裂 ${r.formatBroken.length} 处(卡片标题后空行)` : '';
  const hasHardFail = r.placeholders.length > 0 || missing.length >= 3;
  const hasSoftIssue = reasons.length > 0;
  let level = 'pass';
  if (hasHardFail) level = 'fail';
  else if (hasSoftIssue) level = 'borderline';
  return { level, reasons, missing, formatNote, notes };
}

const graded = results.map((r) => ({ ...r, grade: grade(r, r.file) }));

const summary = {
  totalFiles: mdFiles.length,
  menuLeaves: leaves.length,
  byLevel: { pass: 0, borderline: 0, fail: 0 },
  byCalloutMissing: {},
  ghostEntries,
  orphanFiles,
  exactDupes,
  jaccardPairs: jaccardPairs.slice(0, 40),
};
for (const r of graded) summary.byLevel[r.grade.level]++;

// 按章节统计
const chapterStats = {};
for (const r of graded) {
  const dir = path.posix.dirname(r.file);
  (chapterStats[dir] ||= { total: 0, pass: 0, borderline: 0, fail: 0, minBody: Infinity });
  const s = chapterStats[dir];
  s.total++;
  s[r.grade.level]++;
  s.minBody = Math.min(s.minBody, r.bodyLen);
}

// 汇总数据(供报告使用)
const reportData = {
  generatedAt: new Date().toISOString(),
  summary,
  chapterStats,
  borderline: graded.filter((r) => r.grade.level === 'borderline').map((r) => ({ file: r.file, size: r.size, bodyLen: r.bodyLen, missing: r.grade.missing, reasons: r.grade.reasons })),
  fail: graded.filter((r) => r.grade.level === 'fail').map((r) => ({ file: r.file, size: r.size, bodyLen: r.bodyLen, placeholders: r.placeholders, missing: r.grade.missing, reasons: r.grade.reasons, shortCards: r.shortCards.slice(0, 5) })),
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ reportData, details: graded }, null, 2), 'utf8');

// ---------- 控制台汇总 ----------
console.log('=== WpfSPA 全站文章质量审计汇总 ===');
console.log(`文章总数: ${mdFiles.length}  菜单叶子: ${leaves.length}`);
console.log(`达标: ${summary.byLevel.pass}  边缘: ${summary.byLevel.borderline}  未达标: ${summary.byLevel.fail}`);
console.log(`幽灵条目: ${ghostEntries.length}  孤立文件: ${orphanFiles.length}  完全重复组: ${exactDupes.length}`);
console.log(`高相似对(>=0.5): ${jaccardPairs.length}`);
console.log('--- 按章节 ---');
for (const [d, s] of Object.entries(chapterStats).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${d}: 总${s.total} 达标${s.pass} 边缘${s.borderline} 未达标${s.fail} 最小正文${s.minBody}`);
}
if (ghostEntries.length) {
  console.log('--- 幽灵条目 ---');
  ghostEntries.forEach((g) => console.log(`  ${g.file}`));
}
if (orphanFiles.length) {
  console.log('--- 孤立文件(前20) ---');
  orphanFiles.slice(0, 20).forEach((f) => console.log(`  ${f}`));
}
console.log(`明细已写入: ${OUTPUT_FILE}`);
