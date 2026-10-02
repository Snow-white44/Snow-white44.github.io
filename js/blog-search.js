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
    input.setAttribute('aria-label', '搜索文章标题、正文或标签');
    input.placeholder = '输入作品名、正文关键词或标签';
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
      const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      status.textContent = '';
      if (!terms.length) { message('输入关键词，搜索全部文章。'); return; }
      const hits = entries.filter(entry => {
        const text = [entry.title, entry.content, ...(entry.tags || [])].join(' ').toLowerCase();
        return terms.every(term => text.includes(term));
      });
      if (!hits.length) { message('没有找到相关文章，试试作品名或更短的关键词。'); return; }
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
