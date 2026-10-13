const $ = (selector) => document.querySelector(selector);
const envelope = $('#envelope');
const invitation = $('#invitation');
const music = $('#wedding-music');
const musicButton = $('#music-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let opened = false;
let statusTimer;
function notify(message) {
  clearTimeout(statusTimer);
  $('#status').textContent = message;
  $('#status').hidden = false;
  statusTimer = setTimeout(() => { $('#status').hidden = true; }, 4000);
}
function syncMusic() {
  musicButton.classList.toggle('paused', music.paused);
  musicButton.setAttribute('aria-label', music.paused ? 'Phát nhạc' : 'Tạm dừng nhạc');
  musicButton.setAttribute('aria-pressed', String(!music.paused));
}
music.addEventListener('play', syncMusic);
music.addEventListener('pause', syncMusic);
musicButton.addEventListener('click', async () => {
  if (!music.paused) music.pause();
  else {
    try { await music.play(); }
    catch { notify('Không thể phát nhạc. Vui lòng thử lại.'); }
  }
});
syncMusic();
async function openInvitation(animate = true) {
  if (opened) return;
  opened = true;
  invitation.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  music.play().catch(syncMusic);
  if (animate && !reducedMotion.matches) {
    $('#open-invitation').setAttribute('aria-busy', 'true');
    envelope.classList.add('opening');
    await new Promise(resolve => setTimeout(resolve, 1100));
    envelope.classList.add('fading');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  envelope.hidden = true;
  $('#wedding').setAttribute('tabindex', '-1');
  $('#wedding').focus({ preventScroll: true });
  renderGallery();
}
$('#open-invitation').addEventListener('click', event => {
  event.preventDefault();
  openInvitation();
});

const parallax = [...document.querySelectorAll('[data-parallax]')];
let scrollFrame;
window.addEventListener('scroll', () => {
  if (scrollFrame || reducedMotion.matches) return;
  scrollFrame = requestAnimationFrame(() => {
    for (const flower of parallax) {
      flower.style.transform = flower.dataset.transform.replace('SCROLL', String(scrollY * Number(flower.dataset.parallax)));
    }
    scrollFrame = null;
  });
}, { passive: true });
const weddingDate = new Date('2026-11-28T10:30:00+07:00').getTime();
function updateCountdown() {
  let seconds = Math.max(0, Math.floor((weddingDate - Date.now()) / 1000));
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  $('#countdown').textContent = `${days} ngày ${hours} giờ ${Math.floor(seconds / 60)} phút ${seconds % 60} giây`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

const gallery = $('#gallery');
const photos = [...gallery.children];
const lightbox = $('#lightbox');
const lightboxImage = $('#lightbox-image');
const thumbnails = [...lightbox.querySelectorAll('[aria-label^="View image"]')];
let currentPhoto = 0;
let autoAdvanceAt = Date.now() + 4500;
function renderGallery() {
  photos.forEach((photo, index) => {
    let distance = (index - currentPhoto + photos.length) % photos.length;
    if (distance > photos.length / 2) distance -= photos.length;
    const absolute = Math.abs(distance);
    photo.style.transform = `translateX(${distance * 60}%) translateZ(${-absolute * 150}px) rotateY(${distance * 45}deg) scale(${absolute === 0 ? 1 : absolute === 1 ? .85 : .7})`;
    photo.style.opacity = absolute === 0 ? 1 : absolute === 1 ? .75 : absolute === 2 ? .5 : .3;
    photo.style.zIndex = 100 - absolute;
    photo.classList.toggle('ring-2', distance === 0);
    photo.classList.toggle('ring-white/30', distance === 0);
    photo.setAttribute('aria-current', String(distance === 0));
  });
  $('#gallery-counter').textContent = `${currentPhoto + 1} / ${photos.length}`;
}
function changePhoto(delta) {
  currentPhoto = (currentPhoto + delta + photos.length) % photos.length;
  renderGallery();
  if (lightbox.open) renderLightbox();
  autoAdvanceAt = Date.now() + 4500;
}
$('[aria-label="Previous photo"]').addEventListener('click', () => changePhoto(-1));
$('[aria-label="Next photo"]').addEventListener('click', () => changePhoto(1));
photos.forEach((photo, index) => {
  photo.querySelector('img').draggable = false;
  function selectPhoto() {
    if (index !== currentPhoto) {
      currentPhoto = index;
      renderGallery();
    } else {
      renderLightbox();
      lightbox.showModal();
    }
    autoAdvanceAt = Date.now() + 4500;
  }
  photo.addEventListener('click', selectPhoto);
  photo.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPhoto(); }
  });
});
let swipeStart;
let suppressGalleryClick = false;
gallery.parentElement.addEventListener('pointerdown', event => { swipeStart = event.clientX; });
gallery.parentElement.addEventListener('pointerup', event => {
  if (swipeStart !== undefined && Math.abs(event.clientX - swipeStart) > 40) {
    changePhoto(event.clientX < swipeStart ? 1 : -1);
    suppressGalleryClick = true;
  }
  swipeStart = undefined;
});
gallery.addEventListener('click', event => {
  if (suppressGalleryClick) { event.stopImmediatePropagation(); suppressGalleryClick = false; }
}, true);
renderGallery();
setInterval(() => {
  if (opened && !document.hidden && !lightbox.open && !$('#gift-dialog').open && $('#wish-dialog').hidden && !reducedMotion.matches && Date.now() >= autoAdvanceAt) changePhoto(1);
}, 500);

let zoom = 1;
let translateX = 0;
let translateY = 0;
function transformImage() {
  lightboxImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoom})`;
}
function renderLightbox() {
  const image = photos[currentPhoto].querySelector('img');
  lightboxImage.src = image.src;
  lightboxImage.alt = `Ảnh cưới ${currentPhoto + 1}`;
  $('#lightbox-counter').textContent = `${currentPhoto + 1} / ${photos.length}`;
  thumbnails.forEach((button, index) => {
    button.setAttribute('aria-current', String(index === currentPhoto));
    button.style.opacity = index === currentPhoto ? 1 : .6;
    button.style.outline = index === currentPhoto ? '2px solid #30530f' : '';
    button.style.outlineOffset = '2px';
    button.classList.toggle('scale-105', index === currentPhoto);
  });
  zoom = 1; translateX = 0; translateY = 0;
  transformImage();
}
$('[aria-label="Previous image"]').addEventListener('click', () => changePhoto(-1));
$('[aria-label="Next image"]').addEventListener('click', () => changePhoto(1));
thumbnails.forEach((button, index) => button.addEventListener('click', () => {
  currentPhoto = index; renderGallery(); renderLightbox();
}));
lightboxImage.addEventListener('dblclick', () => {
  zoom = zoom === 1 ? 2 : 1; translateX = 0; translateY = 0; transformImage();
});
lightboxImage.addEventListener('wheel', event => {
  event.preventDefault();
  zoom = Math.min(4, Math.max(1, zoom - event.deltaY * .002));
  if (zoom === 1) { translateX = 0; translateY = 0; }
  transformImage();
}, { passive: false });
const pointers = new Map();
let pinchDistance;
let gestureStart;
lightboxImage.addEventListener('pointerdown', event => {
  lightboxImage.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  gestureStart = { x: event.clientX, y: event.clientY };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
lightboxImage.addEventListener('pointermove', event => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDistance > 0) zoom = Math.min(4, Math.max(1, zoom * distance / pinchDistance));
    pinchDistance = distance;
  } else if (zoom > 1) {
    translateX += event.clientX - previous.x;
    translateY += event.clientY - previous.y;
  }
  transformImage();
});
function endGesture(event) {
  if (event.type !== 'pointercancel' && pointers.size === 1 && zoom === 1 && gestureStart && Math.abs(event.clientX - gestureStart.x) > 40) {
    changePhoto(event.clientX < gestureStart.x ? 1 : -1);
  }
  pointers.delete(event.pointerId);
  pinchDistance = undefined;
  gestureStart = undefined;
}
lightboxImage.addEventListener('pointerup', endGesture);
lightboxImage.addEventListener('pointercancel', endGesture);
lightbox.addEventListener('close', () => { pointers.clear(); autoAdvanceAt = Date.now() + 4500; });

const giftDialog = $('#gift-dialog');
$('[aria-label="Mở hộp mừng cưới"]').addEventListener('click', () => giftDialog.showModal());
$('[aria-label="Đóng hộp quà mừng"]').addEventListener('click', () => giftDialog.close());
giftDialog.querySelector('.mt-2').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = '/images/wedding-qr.png'; link.download = 'mung-cuoi-dinh-duy.png'; link.click();
});

const wishDialog = $('#wish-dialog');
const originalWishes = [...$('#wish-options').querySelectorAll('p')].map(x => x.textContent);
const extraWishes = [
  'Chúc Đình Duy và Hồng Nhung trăm năm hạnh phúc, cùng nhau đi qua mọi mùa yêu thương.',
  'Chúc hai bạn một cuộc sống hôn nhân ngọt ngào, luôn đồng hành và sẻ chia cùng nhau.',
  'Mong mỗi ngày bên nhau đều là một ngày vui. Chúc hai bạn mãi mãi hạnh phúc!',
  'Chúc mừng ngày trọng đại của hai bạn. Chúc mái ấm nhỏ luôn đầy ắp yêu thương.',
  'Chúc hai bạn đầu bạc răng long, một đời bình an và hạnh phúc bên nhau.'
];
let wishPage = 0;
function closeWishes() {
  wishDialog.hidden = true;
  $('#suggest-wishes').focus({ preventScroll: true });
}
$('#suggest-wishes').title = 'Gợi ý lời chúc';
$('#suggest-wishes').addEventListener('click', () => {
  wishDialog.hidden = false;
  wishDialog.querySelector('button').focus();
});
wishDialog.addEventListener('click', event => {
  if (event.target === wishDialog || event.target.closest('[aria-label="Đóng"]') || event.target.closest('.flex.gap-2 button:last-child')) closeWishes();
  const option = event.target.closest('#wish-options button');
  if (option) { $('#guestbook-form textarea').value = option.textContent.trim(); closeWishes(); $('#guestbook-form textarea').focus(); }
});
$('#more-wishes').addEventListener('click', () => {
  wishPage++;
  const choices = wishPage % 2 ? extraWishes : originalWishes;
  $('#wish-options').querySelectorAll('p').forEach((p, index) => { p.textContent = choices[(index + Math.floor(wishPage / 2)) % choices.length]; });
});
document.addEventListener('keydown', event => {
  if (!wishDialog.hidden) {
    if (event.key === 'Escape') closeWishes();
    if (event.key === 'Tab') {
      const buttons = [...wishDialog.querySelectorAll('button')];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  } else if (lightbox.open && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault(); changePhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

function renderComments(comments) {
  const list = $('#comments');
  if (!comments.length) return;
  list.replaceChildren(...comments.map(comment => {
    const article = document.createElement('article'); article.className = 'comment';
    const name = document.createElement('strong'); name.textContent = comment.name;
    const message = document.createElement('p'); message.textContent = comment.message;
    const time = document.createElement('time'); time.dateTime = comment.createdAt;
    time.textContent = new Date(comment.createdAt).toLocaleString('vi-VN');
    article.append(name, message, time); return article;
  }));
}
async function loadComments() {
  const response = await fetch('/api/comments');
  if (!response.ok) throw new Error('Không thể tải sổ lưu bút.');
  renderComments(await response.json());
}
loadComments().catch(error => notify(error.message));
$('#guestbook-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  if (button.disabled) return;
  button.disabled = true;
  try {
    const response = await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.elements.name.value, message: form.elements.message.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    form.reset();
    await loadComments();
    notify('Cảm ơn bạn đã gửi lời chúc!');
  } catch (error) { notify(error.message || 'Không thể gửi lời chúc. Vui lòng thử lại.'); }
  finally { button.disabled = false; }
});
if (new URLSearchParams(location.search).get('open') === '1') openInvitation(false);
