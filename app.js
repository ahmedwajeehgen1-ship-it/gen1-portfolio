const dialog = document.querySelector('.lightbox');
const cards = [...document.querySelectorAll('.art-card')];
let activeIndex = 0;
const visibleCards = () => cards.filter(card => !card.closest('.art-item')?.hidden);
function showImage(index) {
  const visible = visibleCards();
  if (!visible.length) return;
  activeIndex = (index + visible.length) % visible.length;
  const card = visible[activeIndex];
  dialog.querySelector('img').src = card.dataset.image;
  dialog.querySelector('img').alt = card.dataset.caption;
  dialog.querySelector('.lightbox-caption').textContent = card.dataset.caption;
}
cards.forEach(card => card.addEventListener('click', () => { showImage(visibleCards().indexOf(card)); dialog.showModal(); }));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.querySelector('.lightbox-prev').addEventListener('click', () => showImage(activeIndex - 1));
dialog.querySelector('.lightbox-next').addEventListener('click', () => showImage(activeIndex + 1));
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('keydown', event => { if (event.key === 'ArrowRight') showImage(activeIndex + 1); if (event.key === 'ArrowLeft') showImage(activeIndex - 1); });
document.querySelector('.copy-link')?.addEventListener('click', async event => {
  const button = event.currentTarget;
  try { await navigator.clipboard.writeText(location.href); button.textContent = 'Link copied ✓'; }
  catch { button.textContent = 'Copy the URL from your browser'; }
  setTimeout(() => { button.textContent = 'Copy category link ↗'; }, 2500);
});
