const API = 'https://querylchjjxqgmcitqtz.supabase.co';
const KEY = 'sb_publishable_iT5qKZb0ZApvBuyH6-epWQ_Vh_CjG4S';
const options = { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' };
let inventory = [];
let hidden = new Set();

function status(message) {
  const element = document.querySelector('#manage-status');
  if (element) element.textContent = message;
}

async function changeHidden(method, hash) {
  const url = method === 'POST' ? `${API}/rest/v1/hidden_pictures` : `${API}/rest/v1/hidden_pictures?image_hash=eq.${encodeURIComponent(hash)}`;
  const response = await fetch(url, { method, headers: { ...options.headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, ...(method === 'POST' ? { body: JSON.stringify({ image_hash: hash }) } : {}) });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
}

async function loadData() {
  const [listResponse, hiddenResponse] = await Promise.all([
    fetch('/portfolio-data.json', { cache: 'no-store' }),
    fetch(`${API}/rest/v1/hidden_pictures?select=image_hash`, options)
  ]);
  if (!listResponse.ok || !hiddenResponse.ok) throw new Error('Could not load the portfolio. Please try again.');
  inventory = await listResponse.json();
  hidden = new Set((await hiddenResponse.json()).map(row => row.image_hash));
}

function renderGallery() {
  const byImage = new Map(inventory.map(item => [item.image, item]));
  document.querySelectorAll('.art-card').forEach(card => {
    const item = byImage.get(card.dataset.image);
    if (!item) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'art-item';
    card.replaceWith(wrapper);
    wrapper.append(card);
    wrapper.hidden = hidden.has(item.hash);
    {
      const button = document.createElement('button');
      button.className = 'manage-button';
      button.type = 'button';
      button.textContent = 'Hide picture';
      button.addEventListener('click', async () => {
        if (!confirm('Hide this picture from the portfolio? You can restore it later.')) return;
        button.disabled = true;
        try { await changeHidden('POST', item.hash); }
        catch (error) { alert('Could not hide picture: ' + error.message); button.disabled = false; return; }
        location.reload();
      });
      wrapper.append(button);
    }
  });
  document.querySelectorAll('.category-card').forEach(card => {
    const slug = new URL(card.href).pathname.split('/').filter(Boolean)[0];
    const items = inventory.filter(item => item.image.split('/')[2] === slug && !hidden.has(item.hash));
    card.querySelector('small').textContent = `${items.length} pieces`;
    if (items.length) card.querySelector('img').src = items[0].thumb;
    else card.hidden = true;
  });
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    const count = [...gallery.querySelectorAll('.art-item')].filter(item => !item.hidden).length;
    const countLabel = document.querySelector('.category-actions > span');
    if (countLabel) countLabel.textContent = `${count} pieces in this collection`;
    const eyebrow = document.querySelector('.category-hero .eyebrow');
    if (eyebrow) eyebrow.lastChild.textContent = ` SELECTED WORK / ${count} PIECES`;
  }
}

async function renderAdmin() {
  const list = document.querySelector('#hidden-list');
  list.replaceChildren();
  const unique = new Map(inventory.filter(item => hidden.has(item.hash)).map(item => [item.hash, item]));
  document.querySelector('#hidden-count').textContent = `${unique.size} hidden pictures`;
  for (const item of unique.values()) {
    const panel = document.createElement('article');
    panel.className = 'hidden-item';
    const image = document.createElement('img'); image.src = item.thumb; image.alt = `${item.company} — ${item.type}`;
    const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = item.company;
    const detail = document.createElement('p'); detail.textContent = `${item.category} · ${item.type}`;
    const button = document.createElement('button'); button.className = 'manage-button'; button.type = 'button'; button.textContent = 'Restore picture';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { await changeHidden('DELETE', item.hash); }
      catch (error) { status('Could not restore picture: ' + error.message); button.disabled = false; return; }
      hidden.delete(item.hash); await renderAdmin(); status('Picture restored.');
    });
    info.append(title, detail, button); panel.append(image, info); list.append(panel);
  }
}

async function start() {
  try {
    await loadData();
    renderGallery();
    if (document.querySelector('#manage-page')) await renderAdmin();
    document.documentElement.classList.add('portfolio-ready');
  } catch (error) {
    console.error(error);
    document.documentElement.classList.add('portfolio-error');
    status(error.message);
    if (!document.querySelector('#manage-page')) {
      const message = document.createElement('p');
      message.className = 'shell portfolio-error-message';
      message.textContent = 'The portfolio is temporarily unavailable. Please refresh this page.';
      document.querySelector('main')?.prepend(message);
    }
  }
}
start();
