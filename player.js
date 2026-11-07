// 讲解播放：声音带着画面走（每一帧画 audio.currentTime 那一刻）。小测试：到点停下，孩子点答案再继续。
(() => {
  const $ = id => document.getElementById(id);
  const id = window.LESSON_ID, audio = $('audio'), seek = $('seek'), pp = $('pp');
  let L = null, quizDone = false, raf = 0, tries = 0;

  // 画面按可用空间等比缩放（9:16），屏幕转动、地址栏收起时重算
  const cv = $('c'), stage = cv.parentElement;
  const fit = () => { const w = stage.clientWidth - 16, h = stage.clientHeight - 8; if (w <= 0 || h <= 0) return; const k = Math.min(w / 1080, h / 1920);
    cv.style.width = Math.floor(1080 * k) + 'px'; cv.style.height = Math.floor(1920 * k) + 'px'; };
  fit(); window.addEventListener('resize', fit); window.addEventListener('orientationchange', () => setTimeout(fit, 200));
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const draw = () => { if (window.__ready) window.renderFrame(Math.min(audio.currentTime, window.__total - 0.001)); seek.value = audio.currentTime; $('time').textContent = fmt(audio.currentTime); };
  const loop = () => { draw(); maybeQuiz(); if (!audio.paused) raf = requestAnimationFrame(loop); };
  const setPlaying = on => { $('icoPause').hidden = !on; $('icoPlay').hidden = on; pp.setAttribute('aria-label', on ? '暂停' : '继续播放'); };
  const play = () => { $('end').hidden = true; audio.play().catch(() => {}); };
  audio.addEventListener('play', () => { setPlaying(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
  audio.addEventListener('pause', () => { setPlaying(false); draw(); });
  audio.addEventListener('ended', () => { setPlaying(false); draw(); showEnd(); });
  pp.addEventListener('click', () => { if (!$('quiz').hidden) return; audio.paused ? play() : audio.pause(); });
  seek.addEventListener('input', () => { audio.currentTime = +seek.value; if (L && L.quiz && +seek.value < L.quiz.at) quizDone = false; $('quiz').hidden = true; draw(); });

  // ---------- 小测试 ----------
  function maybeQuiz() {
    const q = L && L.quiz; if (!q || quizDone || audio.currentTime < q.at || audio.currentTime > q.at + 1.5) return;
    audio.pause(); audio.currentTime = q.at; showQuiz(q);
  }
  function showQuiz(q) {
    tries = 0; $('quizQ').textContent = q.q; $('quizFb').textContent = ''; $('quizFb').className = 'fb';
    const box = $('quizOpts'); box.innerHTML = '';
    q.options.forEach(v => { const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = `<b>${v}</b> ${q.unit}`; b.onclick = () => answer(q, v, b); box.appendChild(b); });
    $('quiz').hidden = false; box.firstChild.focus({ preventScroll: true });
  }
  function answer(q, v, btn) {
    if (v === q.answer) {
      btn.classList.add('ok'); $('quizFb').textContent = q.praise; $('quizFb').className = 'fb ok';
      [...$('quizOpts').children].forEach(b => b.disabled = true);
      setTimeout(resumeAfterQuiz, 1400); return;
    }
    tries++; btn.disabled = true; btn.classList.add('tried');
    if (tries === 1) { $('quizFb').textContent = q.hint; $('quizFb').className = 'fb hint'; }
    else { $('quizFb').textContent = q.together; $('quizFb').className = 'fb hint'; [...$('quizOpts').children].forEach(b => b.disabled = true); setTimeout(resumeAfterQuiz, 1400); }
  }
  function resumeAfterQuiz() { quizDone = true; $('quiz').hidden = true; if (L.quiz.resume) audio.currentTime = L.quiz.resume; play(); }   // 跳过片子里的「3、2、1」，直接揭晓

  // ---------- 播完 ----------
  function showEnd() {
    const nb = $('nextBtn');
    if (L.next) { nb.hidden = false; nb.textContent = L.nextLabel || '接着看'; nb.onclick = () => { location.href = `lesson.html?l=${L.next}${location.hash}`; }; }
    $('end').hidden = false;
  }
  $('againBtn').addEventListener('click', () => { audio.currentTime = 0; quizDone = false; play(); });

  // 返回：从哪一批作业点进来的，就回到那一批
  const from = location.hash.slice(1); if (/^[\w-]+$/.test(from)) { $('back').href = `./#${from}`; $('homeBtn').href = `./#${from}`; }

  // ---------- 启动 ----------
  fetch('data/lessons.json').then(r => r.json()).then(all => {
    L = all[id];
    if (!L || window.__missing) { $('startNote').textContent = '找不到这段讲解，回到作业本重新选一段。'; $('startBtn').hidden = true; return; }
    document.title = L.title; $('title').textContent = L.title;
    audio.src = `media/${id}.mp3`; seek.max = L.dur;
    const wait = () => {
      if (window.__bootFailed) { $('startNote').textContent = '讲解没能加载，请刷新再试。'; console.error(window.__bootFailed); return; }
      if (!window.__ready) return setTimeout(wait, 60);
      draw(); $('startNote').textContent = `${Math.round(L.dur)} 秒，有声音`; $('startBtn').disabled = false;
    };
    $('startBtn').disabled = true; wait();
  });
  $('startBtn').addEventListener('click', () => { $('start').hidden = true; play(); });
  // 键盘：空格暂停/继续（焦点在按钮或进度条上时交给它们自己）
  document.addEventListener('keydown', e => { if (e.key !== ' ' || /^(BUTTON|INPUT|A)$/.test(document.activeElement.tagName) || !$('start').hidden || !$('quiz').hidden) return; e.preventDefault(); audio.paused ? play() : audio.pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !audio.paused) audio.pause(); });
})();
