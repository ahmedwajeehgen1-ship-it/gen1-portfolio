const API = 'https://querylchjjxqgmcitqtz.supabase.co';
const KEY = 'sb_publishable_iT5qKZb0ZApvBuyH6-epWQ_Vh_CjG4S';
const OWNER = 'ahmedwajeeh.gen1@gmail.com';
const options = { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' };
let client;
let inventory = [];
let hidden = new Set();

function status(message) {
  const element = document.querySelector('#manage-status');
  if (element) element.textContent = message;
}

async function loadClient() {
  if (!client) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm');
    client = createClient(API, KEY);
  }
  return client;
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

function renderGallery(isOwner) {
  const byImage = new Map(inventory.map(item => [item.image, item]));
  document.querySelectorAll('.art-card').forEach(card => {
    const item = byImage.get(card.dataset.image);
    if (!item) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'art-item';
    card.replaceWith(wrapper);
    wrapper.append(card);
    wrapper.hidden = hidden.has(item.hash);
    if (isOwner) {
      const button = document.createElement('button');
      button.className = 'manage-button';
      button.type = 'button';
      button.textContent = 'Hide picture';
      button.addEventListener('click', async () => {
        if (!confirm('Hide this picture from the portfolio? You can restore it later.')) return;
        button.disabled = true;
        const { error } = await client.from('hidden_pictures').insert({ image_hash: item.hash });
        if (error) { alert('Could not hide picture: ' + error.message); button.disabled = false; return; }
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
  const supabase = await loadClient();
  const { data: { session } } = await supabase.auth.getSession();
  const signedIn = session?.user?.email?.toLowerCase() === OWNER;
  const signIn = document.querySelector('#sign-in');
  const signedInArea = document.querySelector('#signed-in');
  signIn.hidden = !!signedIn;
  signedInArea.hidden = !signedIn;
  if (!signedIn) return;
  document.querySelector('#owner-email').textContent = OWNER;
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
      const { error } = await supabase.from('hidden_pictures').delete().eq('image_hash', item.hash);
      if (error) { status('Could not restore picture: ' + error.message); button.disabled = false; return; }
      hidden.delete(item.hash); await renderAdmin(); status('Picture restored.');
    });
    info.append(title, detail, button); panel.append(image, info); list.append(panel);
  }
}

async function start() {
  try {
    await loadData();
    let isOwner = false;
    try {
      const supabase = await loadClient();
      const { data: { session } } = await supabase.auth.getSession();
      isOwner = session?.user?.email?.toLowerCase() === OWNER;
    } catch (error) { console.error('Admin sign-in unavailable:', error); }
    renderGallery(isOwner);
    if (document.querySelector('#manage-page')) {
      await renderAdmin();
      document.querySelector('#login-button').addEventListener('click', async event => {
        event.currentTarget.disabled = true;
        const { error } = await client.auth.signInWithOtp({ email: OWNER, options: { emailRedirectTo: `${location.origin}/admin/` } });
        status(error ? `Sign-in failed: ${error.message}` : `Check ${OWNER} for your sign-in link.`);
        event.currentTarget.disabled = false;
      });
      document.querySelector('#logout-button').addEventListener('click', async () => { await client.auth.signOut(); location.reload(); });
    }
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
