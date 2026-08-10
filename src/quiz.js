/* ============================================================
   WPF上位机学习平台 - 章节测验
   板块末章自动注入单选测验
   ============================================================ */

import { saveQuizScore, getQuizScore } from './progress.js';
import { showToast } from './ui.js';

/** @type {Array|null} */
let quizzesData = null;
let quizLoaded = false;
let currentQuiz = null;

/**
 * 加载测验数据
 */
async function loadQuizzes() {
  if (quizLoaded) return;
  try {
    const res = await fetch('/content/quizzes.json');
    if (res.ok) {
      quizzesData = await res.json();
    }
  } catch { /* ignore */ }
  quizLoaded = true;
}

/**
 * 检查并在当前章节注入测验
 * @param {string} path - 当前路径
 */
export async function injectQuizIfNeeded(path) {
  await loadQuizzes();
  if (!quizzesData) return;

  const quizSection = document.getElementById('quizSection');
  if (!quizSection) return;

  // 查找匹配的测验
  const quiz = quizzesData.find(q => q.path === path);
  if (!quiz) {
    quizSection.innerHTML = '';
    return;
  }

  currentQuiz = quiz;
  const prevScore = getQuizScore(quiz.id);

  quizSection.innerHTML = renderQuizCard(quiz, prevScore);

  // 通过 textContent 二次赋值防止 XSS
  sanitizeQuizContent(quiz);

  // 绑定交互
  bindQuizInteractions(quiz);
}

/**
 * 渲染测验卡片
 */
function renderQuizCard(quiz, prevScore) {
  let questionsHtml = '';
  quiz.questions.forEach((q, qi) => {
    questionsHtml += `
    <div class="quiz-question" data-question-index="${qi}">
      <div class="quiz-question-text">${qi + 1}. ${q.question}</div>
      <div class="quiz-options" data-question="${qi}">
        ${q.options.map((opt, oi) => `
          <button class="quiz-option" data-option="${oi}" data-question="${qi}">
            <span class="quiz-option-letter">${String.fromCharCode(65 + oi)}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-explanation" data-explanation="${qi}" style="display:none"></div>
    </div>`;
  });

  let scoreHtml = '';
  if (prevScore) {
    const emoji = getScoreEmoji(prevScore.score, prevScore.total);
    scoreHtml = `
    <div class="quiz-score">
      <div class="quiz-score-emoji">${emoji}</div>
      <div class="quiz-score-value">上次成绩: ${prevScore.score}/${prevScore.total}</div>
      <div class="quiz-score-comment">${getScoreComment(prevScore.score, prevScore.total)}</div>
    </div>`;
  }

  return `
  <div class="quiz-card">
    <div class="quiz-card-header">
      <div class="quiz-card-title">📝 ${quiz.title || '章节测验'}</div>
      <div class="quiz-card-subtitle">共 ${quiz.questions.length} 题 · 选择你的答案后提交</div>
    </div>
    ${scoreHtml}
    ${questionsHtml}
    <div class="quiz-actions">
      <button class="quiz-submit" id="quizSubmit">提交答案</button>
      <button class="quiz-retry" id="quizRetry" style="display:none">重新作答</button>
    </div>
  </div>`;
}

/**
 * 绑定测验交互
 */
function bindQuizInteractions(quiz) {
  const card = document.querySelector('.quiz-card');
  if (!card) return;

  const answers = new Array(quiz.questions.length).fill(null);
  let submitted = false;

  // 选项点击
  card.addEventListener('click', (e) => {
    if (submitted) return;
    const option = e.target.closest('.quiz-option');
    if (!option) return;

    const qi = parseInt(option.dataset.question);
    const oi = parseInt(option.dataset.option);

    // 取消其他选项
    card.querySelectorAll(`.quiz-option[data-question="${qi}"]`).forEach(el => {
      el.classList.remove('selected');
    });

    option.classList.add('selected');
    answers[qi] = oi;
  });

  // 提交按钮
  const submitBtn = card.querySelector('#quizSubmit');
  const retryBtn = card.querySelector('#quizRetry');

  submitBtn.addEventListener('click', () => {
    if (submitted) return;
    // 检查是否所有题都作答
    if (answers.includes(null)) {
      alert('请先回答所有题目');
      return;
    }

    submitted = true;
    submitBtn.disabled = true;
    submitBtn.textContent = '已提交';

    let correct = 0;

    quiz.questions.forEach((q, qi) => {
      const userAnswer = answers[qi];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) correct++;

      // 标记选项
      card.querySelectorAll(`.quiz-option[data-question="${qi}"]`).forEach(el => {
        const oi = parseInt(el.dataset.option);
        if (oi === q.answer) el.classList.add('correct');
        if (oi === userAnswer && !isCorrect) el.classList.add('incorrect');
      });

      // 显示解析
      const explanationEl = card.querySelector(`.quiz-explanation[data-explanation="${qi}"]`);
      if (explanationEl && q.explanation) {
        explanationEl.textContent = (isCorrect ? '✅ ' : '❌ ') + q.explanation;
        explanationEl.classList.add(isCorrect ? 'correct' : 'incorrect');
        explanationEl.style.display = 'block';
      }
    });

    // 保存成绩
    saveQuizScore(quiz.id, correct, quiz.questions.length);

    // 显示成绩汇总
    const emoji = getScoreEmoji(correct, quiz.questions.length);
    const comment = getScoreComment(correct, quiz.questions.length);
    const header = card.querySelector('.quiz-card-header');
    header.insertAdjacentHTML('afterend', `
      <div class="quiz-score">
        <div class="quiz-score-emoji">${emoji}</div>
        <div class="quiz-score-value">${correct}/${quiz.questions.length}</div>
        <div class="quiz-score-comment">${comment}</div>
      </div>
    `);

    retryBtn.style.display = 'inline-flex';
  });

  // 重新作答
  retryBtn.addEventListener('click', () => {
    // 重新渲染
    const quizSection = document.getElementById('quizSection');
    quizSection.innerHTML = renderQuizCard(quiz, getQuizScore(quiz.id));
    answers.fill(null);
    submitted = false;
    bindQuizInteractions(quiz);
  });
}

/**
 * 通过 textContent 覆盖渲染后的文本，防止 XSS
 * @param {object} quiz
 */
function sanitizeQuizContent(quiz) {
  document.querySelectorAll('.quiz-question-text').forEach((el, i) => {
    if (quiz.questions[i]) {
      el.textContent = `${i + 1}. ${quiz.questions[i].question}`;
    }
  });
  document.querySelectorAll('.quiz-option span:last-child').forEach((el) => {
    const optionEl = el.parentElement;
    if (!optionEl) return;
    const qi = parseInt(optionEl.dataset.question);
    const oi = parseInt(optionEl.dataset.option);
    if (quiz.questions[qi] && quiz.questions[qi].options[oi] !== undefined) {
      el.textContent = quiz.questions[qi].options[oi];
    }
  });
}

function getScoreEmoji(score, total) {
  const rate = score / total;
  if (rate >= 1) return '🏆';
  if (rate >= 0.8) return '🎉';
  if (rate >= 0.6) return '👍';
  if (rate >= 0.4) return '📚';
  return '💪';
}

function getScoreComment(score, total) {
  const rate = score / total;
  if (rate >= 1) return '满分通过！你对这个章节已经了如指掌！';
  if (rate >= 0.8) return '掌握得很好，继续加油！';
  if (rate >= 0.6) return '基础掌握了，建议回顾一下错题。';
  if (rate >= 0.4) return '还需要多加练习，重新看看相关知识点吧。';
  return '别灰心！回顾章节内容后再来挑战一次！';
}
