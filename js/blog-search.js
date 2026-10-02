/* Theme search dialog, with a local index and PJAX-safe delegated events. */
(() => {
  function init() {
    const dialog = document.querySelector('#local-search .search-dialog');
    const mask = document.getElementById('search-mask');
    const input = document.querySelector('#local-search-input input');
    const results = document.getElementById('local-search-results');
    const loading = document.getElementById('loading-database');
    const status = document.getElementById('loading-status');
    if (!dialog || !mask || !input || !results) return;
    let entries = null;
    let request = null;
    let opened = false;
    let previousFocus;
    let previousOverflow;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '站内搜索');
    input.setAttribute('aria-label', '搜索关键词、作品简称或角色名');
    input.placeholder = '搜关键词、简称或角色名，例如：骨王';
    dialog.querySelector('.search-close-button').setAttribute('aria-label', '关闭搜索');
    results.setAttribute('aria-live', 'polite');

    const message = text => {
      results.replaceChildren();
      const p = document.createElement('p');
      p.textContent = text;
      results.appendChild(p);
    };
    function render() {
      if (!entries) return;
      const normalize = value => String(value || '').normalize('NFKC').toLowerCase();
      const query = normalize(input.value).trim();
      const terms = query.split(/\s+/).filter(Boolean);
      status.textContent = '';
      if (!terms.length) { message('不用输入完整标题，试试“骨王”“飞鼠”或“异世界”。'); return; }
      const hits = entries.map(entry => {
        const title = normalize(entry.title);
        const aliases = (entry.aliases || []).map(normalize);
        const tags = (entry.tags || []).map(normalize);
        const content = normalize(entry.content);
        let matched = 0;
        let score = 0;
        for (const term of terms) {
          const weight = aliases.includes(term) ? 100 : title.includes(term) ? 60
            : aliases.some(alias => alias.includes(term)) ? 40
            : tags.some(tag => tag.includes(term)) ? 20 : content.includes(term) ? 5 : 0;
          if (weight) matched++;
          score += weight;
        }
        if (matched === terms.length) score += 200;
        return { entry, matched, score };
      }).filter(hit => hit.matched > 0).sort((a, b) => b.score - a.score).map(hit => hit.entry);
      if (!hits.length) { message('暂时没找到相关文章，可以换个关键词；部分简称可能尚未收录。'); return; }
      results.replaceChildren();
      status.textContent = `找到 ${hits.length} 篇`;
      const list = document.createElement('div');
      list.className = 'search-result-list';
      for (const entry of hits) {
        const item = document.createElement('div');
        item.className = 'local-search__hit-item';
        const right = document.createElement('div');
        right.className = 'search-right';
        right.style.width = '100%';
        const link = document.createElement('a');
        link.className = 'search-result-title';
        link.href = entry.url;
        link.textContent = entry.title;
        const excerpt = document.createElement('p');
        excerpt.className = 'search-result';
        const content = entry.content || '';
        const position = content.toLowerCase().indexOf(terms[0]);
        const start = Math.max(0, position - 25);
        excerpt.textContent = (start ? '…' : '') + content.slice(start, start + 150) + (content.length > start + 150 ? '…' : '');
        right.append(link, excerpt);
        item.appendChild(right);
        list.appendChild(item);
      }
      results.appendChild(list);
      if (window.pjax) window.pjax.refresh(results);
    }
    async function load() {
      if (entries) { render(); return; }
      if (!request) {
        loading.style.display = 'block';
        request = fetch(GLOBAL_CONFIG.localSearch.path)
          .then(response => {
            if (!response.ok) throw new Error('Search index unavailable');
            return response.json();
          })
          .then(data => {
            if (!Array.isArray(data)) throw new Error('Invalid search index');
            entries = data;
          });
      }
      try { await request; render(); }
      catch (_) { request = null; message('搜索数据加载失败，请关闭后重新打开搜索重试。'); }
      finally { loading.style.display = 'none'; }
    }
    function close() {
      if (!opened) return;
      opened = false;
      document.body.style.overflow = previousOverflow;
      dialog.style.display = 'none';
      mask.style.display = 'none';
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    }
    document.addEventListener('click', event => {
      if (event.target.closest('#search-button .search, #menu-search')) {
        event.preventDefault();
        if (!opened) {
          previousFocus = document.activeElement;
          previousOverflow = document.body.style.overflow;
          opened = true;
        }
        document.body.style.overflow = 'hidden';
        dialog.style.display = 'block';
        mask.style.display = 'block';
        loading.nextElementSibling.style.display = 'block';
        input.focus();
        load();
      } else if (event.target === mask || event.target.closest('#local-search .search-close-button, #local-search-results a')) {
        close();
      }
    });
    document.addEventListener('keydown', event => {
      if (!opened) return;
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button, input, a[href]')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    input.addEventListener('input', render);
    document.addEventListener('pjax:send', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
