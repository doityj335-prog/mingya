// 作业本（#）和一批作业的详情（#b3）。数据来自 data/homework.json（人工批改后写进去）。
(() => {
  const app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tick: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#3f8f4e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  let DATA = null;
  const count = b => b.groups.reduce((n, g) => n + g.items.length, 0);
  const lessonLink = (id, label, from, cls = '') => `<a class="chalk-btn ${cls}" href="lesson.html?l=${esc(id)}${from ? '#' + esc(from) : ''}">${ICON.play}${esc(label)}</a>`;

  function home() {
    document.title = '作业本';
    app.innerHTML = `
      <header class="page-head"><h1>作业本</h1><span class="who">${esc(DATA.child)}的数学</span></header>
      <section class="board" aria-labelledby="focusTitle">
        <h2 id="focusTitle">这几次最常卡住的地方</h2>
        <ul class="focus">${DATA.focus.map(f => `
          <li><p class="cause">${esc(f.cause)}<span class="times">${f.count} 次</span></p>
          ${lessonLink(f.lesson, '看讲解：' + f.lessonTitle)}</li>`).join('')}
        </ul>
      </section>
      <h2 class="rows-title">每一次作业</h2>
      <ul class="rows">${DATA.batches.map(b => `
        <li><a class="row" href="#${esc(b.id)}">
          <span class="date">${esc(b.date)}</span>
          <span><span class="name">${esc(b.title)}</span><span class="sub">有 ${count(b)} 处可以再想想</span></span>
          <span class="chev">${ICON.chev}</span>
        </a></li>`).join('')}
      </ul>`;
  }

  function batch(b) {
    document.title = b.title;
    app.innerHTML = `
      <a class="backlink" href="#">${ICON.back}作业本</a>
      <h1 class="paper-title">${esc(b.title)}</h1>
      <p class="meta">${esc(b.date)}，${esc(b.source)}</p>
      <section class="good"><h2>做得好的地方</h2><ul>${b.good.map(g => `<li>${ICON.tick}${esc(g)}</li>`).join('')}</ul></section>
      <p class="count-note">下面 ${count(b)} 处可以再想想，按原因分了组：</p>
      ${b.groups.map(g => `
        <section class="group">
          <h2>${esc(g.cause)}</h2>
          ${g.why ? `<p class="why">${esc(g.why)}</p>` : ''}
          ${g.lesson ? lessonLink(g.lesson, '看讲解', b.id, 'btn-board') : ''}
          ${g.items.map(it => `
            <div class="item">
              <p class="qtext">${esc(it.q)}</p>
              <div class="answers">
                <span class="ans kid">孩子写的<b>${esc(it.kid)}</b></span>
                <span class="ans right">订正<b>${esc(it.right)}</b></span>
              </div>
              ${it.ask ? `<p class="ask"><span>可以问问孩子：</span>${esc(it.ask)}</p>` : ''}
            </div>`).join('')}
        </section>`).join('')}`;
  }

  function route() {
    if (!DATA) return;
    const id = location.hash.slice(1), b = DATA.batches.find(x => x.id === id);
    b ? batch(b) : home();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  fetch('data/homework.json').then(r => r.json()).then(d => { DATA = d; route(); })
    .catch(() => { app.innerHTML = '<p>作业本没能打开，请检查网络后刷新。</p>'; });
})();
