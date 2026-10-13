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

function playOpeningChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const context = new AudioContext();
    const start = context.currentTime;
    function note(frequency, time, duration, volume, attack) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(volume, time + attack);
      gain.gain.exponentialRampToValueAtTime(.001, time + duration);
      oscillator.start(time);
      oscillator.stop(time + duration);
    }
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      note(frequency, start + .1 * index, 1.8, .035 - .005 * index, .01);
    });
    [1567.98, 2093].forEach((frequency, index) => {
      note(frequency, start + .35 + .1 * index, 1.2, .015, .02);
    });
    const bass = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    bass.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    bass.type = 'sine';
    bass.frequency.setValueAtTime(261.63, start);
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.025, start + .4);
    gain.gain.setValueAtTime(.02, start + 1);
    gain.gain.exponentialRampToValueAtTime(.001, start + 2.5);
    bass.start(start);
    bass.stop(start + 2.5);
    setTimeout(() => {
      [783.99, 987.77, 1174.66, 1567.98].forEach((frequency, index) => {
        note(frequency, context.currentTime + .06 * index, .6, .025, .01);
      });
    }, 1200);
    setTimeout(() => { context.close().catch(() => {}); }, 2700);
  } catch {
    // The invitation still opens when Web Audio is unavailable.
  }
}

function startEnvelopeEffects() {
  const ring = document.createElement('div');
  ring.className = 'envelope-seal-ring';
  ring.setAttribute('aria-hidden', 'true');
  $('#envelope-card').append(ring);
  const glow = document.createElement('div');
  glow.className = 'envelope-glow';
  $('#envelope-surface').append(glow);
  for (const decoration of $('#envelope-surface').querySelectorAll('img')) {
    const flight = document.createElement('div');
    flight.className = decoration.className;
    const flower = decoration.cloneNode(false);
    flower.className = 'envelope-flight';
    flight.append(flower);
    $('#envelope-card').append(flight);
  }
  envelope.classList.add('opening');
}

function burstEnvelopeLeaves() {
  const colors = ['#8bc34a', '#6B8040', '#a5c862', '#c8dfa0'];
  const burst = document.createElement('div');
  burst.className = 'envelope-burst';
  burst.setAttribute('aria-hidden', 'true');
  const leafSvg = envelope.querySelector('svg');
  for (let index = 0; index < 32; index++) {
    const angle = 2 * Math.PI * index / 32 + (Math.random() - .5) * .4;
    const radius = 25 + 60 * Math.random();
    const color = colors[Math.floor(Math.random() * colors.length)];
    const leaf = document.createElement('div');
    leaf.className = 'envelope-leaf';
    leaf.style.color = color;
    leaf.style.fontSize = `${10 + 16 * Math.random()}px`;
    leaf.style.textShadow = `0 0 10px ${color}`;
    leaf.style.setProperty('--dx', `${Math.cos(angle) * radius * 5}px`);
    leaf.style.setProperty('--dy', `${Math.sin(angle) * radius * 5}px`);
    leaf.style.setProperty('--rot-start', `${(Math.random() - .5) * 30}deg`);
    leaf.style.setProperty('--rot-end', `${(Math.random() - .5) * 360}deg`);
    leaf.style.setProperty('--delay', `${.15 * Math.random()}s`);
    leaf.append(leafSvg.cloneNode(true));
    burst.append(leaf);
  }
  envelope.append(burst);
}
async function openInvitation(animate = true) {
  if (opened) return;
  opened = true;
  startAutoScroll();
  autoAdvanceAt = Infinity;
  window.scrollTo({ top: 0, behavior: 'instant' });
  music.volume = .5;
  music.play().catch(syncMusic);
  if (animate && !reducedMotion.matches) {
    $('#open-invitation').setAttribute('aria-busy', 'true');
    playOpeningChime();
    startEnvelopeEffects();
    setTimeout(() => {
      burstEnvelopeLeaves();
      envelope.classList.add('away');
    }, 500);
    await new Promise(resolve => setTimeout(resolve, 1300));
  }
  envelope.hidden = true;
  invitation.hidden = false;
  autoAdvanceAt = Date.now() + 4500;
  renderGallery();
}
$('#open-invitation').addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  openInvitation();
});
$('#open-invitation').addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault();
    event.currentTarget.click();
  }
});

const scrollSpeed = 50;
const interactiveTarget = 'img, button, a, input, textarea, select, video, audio, dialog, [role="menu"], [role="menuitem"], [role="listbox"], [role="option"], [role="dialog"], [role="alertdialog"], .modal, .dropdown-menu, [data-dropdown], [data-modal]';
let autoScrollFrame;
let autoScrollOrigin;
let autoScrollPaused = false;
let autoScrollStopped = false;
let autoScrollTimer;
let gestureWasPaused = false;
let ignoreToggleUntil = 0;
let wheelDistance = 0;
function pageScroll() {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
}
function movePage(top) {
  window.scrollTo(0, top);
  if (Math.abs(pageScroll() - top) > 2) {
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }
}
function stopAutoScroll() {
  autoScrollStopped = true;
  if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = undefined;
}
function pauseAutoScroll() {
  if (autoScrollPaused || autoScrollStopped) return;
  autoScrollPaused = true;
}
function resumeAutoScroll() {
  if (!autoScrollPaused || autoScrollStopped) return;
  autoScrollOrigin = performance.now() - pageScroll() / scrollSpeed * 1000;
  autoScrollPaused = false;
}
function autoScrollTick(now) {
  if (autoScrollStopped) return;
  if (autoScrollPaused) {
    autoScrollFrame = requestAnimationFrame(autoScrollTick);
    return;
  }
  if (autoScrollOrigin === undefined) autoScrollOrigin = now;
  movePage((now - autoScrollOrigin) / 1000 * scrollSpeed);
  if (pageScroll() + innerHeight >= document.documentElement.scrollHeight - 10) {
    stopAutoScroll();
    return;
  }
  autoScrollFrame = requestAnimationFrame(autoScrollTick);
}
function startAutoScroll() {
  if (reducedMotion.matches || autoScrollFrame || autoScrollTimer) return;
  autoScrollTimer = setTimeout(() => {
    if (!autoScrollStopped) autoScrollFrame = requestAnimationFrame(autoScrollTick);
  }, 2000);
}
window.addEventListener('pointerdown', event => {
  if (!opened) return;
  gestureWasPaused = autoScrollPaused;
  if (event.pointerType === 'touch') pauseAutoScroll();
}, { passive: true });
window.addEventListener('wheel', event => {
  if (!opened || autoScrollPaused || autoScrollStopped) return;
  wheelDistance += Math.abs(event.deltaY);
  if (wheelDistance >= 50) pauseAutoScroll();
}, { passive: true });
window.addEventListener('focusin', event => {
  if (event.target.matches?.('input, textarea, select, [contenteditable="true"]')) pauseAutoScroll();
});
invitation.addEventListener('focusout', () => { ignoreToggleUntil = Date.now() + 400; });
invitation.addEventListener('click', event => {
  if (!opened || Date.now() < ignoreToggleUntil) return;
  const target = event.target;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    pauseAutoScroll();
    return;
  }
  if (target.closest(interactiveTarget)) {
    if (!gestureWasPaused) pauseAutoScroll();
    return;
  }
  if (gestureWasPaused) resumeAutoScroll();
  else pauseAutoScroll();
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
  if (opened && !document.hidden && !lightbox.open && !$('#gift-dialog').open && $('#wish-dialog').hidden && $('#rsvp-dialog').hidden && !reducedMotion.matches && Date.now() >= autoAdvanceAt) changePhoto(1);
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
giftDialog.addEventListener('click', event => {
  const button = event.target.closest('[data-qr-download]');
  if (!button) return;
  const link = document.createElement('a');
  link.href = button.dataset.qrDownload;
  link.download = button.dataset.qrFilename;
  link.click();
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
  if (!$('#rsvp-dialog').hidden) {
    if (event.key === 'Escape') closeRsvp();
    return;
  }
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
const rsvpDialog = $('#rsvp-dialog');
const rsvpForm = $('#rsvp-form');
const rsvpSuccess = $('#rsvp-success');
const rsvpCountWrap = $('#rsvp-count-wrap');
const rsvpMessageWrap = $('#rsvp-message-wrap');
const rsvpError = $('#rsvp-error');
const rsvpSubmit = $('#rsvp-submit');
const rsvpMinus = $('#rsvp-minus');
const rsvpPlus = $('#rsvp-plus');
let guestCount = 1;

function setGuestCount(next) {
  guestCount = Math.min(30, Math.max(1, next));
  $('#rsvp-count').textContent = String(guestCount);
  rsvpMinus.disabled = guestCount <= 1;
  rsvpPlus.disabled = guestCount >= 30;
}
function syncRsvpFields() {
  const attending = rsvpForm.elements.attending.value;
  rsvpCountWrap.hidden = attending !== 'yes';
  rsvpMessageWrap.hidden = attending !== 'yes' && attending !== 'no';
  rsvpSubmit.disabled = attending !== 'yes' && attending !== 'no';
}
function closeRsvp() {
  rsvpDialog.hidden = true;
  rsvpForm.hidden = false;
  rsvpSuccess.hidden = true;
  rsvpError.hidden = true;
  rsvpForm.reset();
  setGuestCount(1);
  syncRsvpFields();
  rsvpSubmit.disabled = true;
  rsvpSubmit.textContent = 'Gửi xác nhận';
  $('#rsvp-open').focus({ preventScroll: true });
}
$('#rsvp-open').addEventListener('click', () => {
  rsvpDialog.hidden = false;
  rsvpForm.elements.name.focus();
});
$('#rsvp-close').addEventListener('click', closeRsvp);
$('#rsvp-done').addEventListener('click', closeRsvp);
rsvpDialog.addEventListener('click', event => {
  if (event.target === rsvpDialog) closeRsvp();
});
rsvpForm.elements.attending.forEach(input => input.addEventListener('change', syncRsvpFields));
rsvpMinus.addEventListener('click', () => setGuestCount(guestCount - 1));
rsvpPlus.addEventListener('click', () => setGuestCount(guestCount + 1));
setGuestCount(1);
rsvpForm.addEventListener('submit', async event => {
  event.preventDefault();
  const attending = rsvpForm.elements.attending.value;
  if (attending !== 'yes' && attending !== 'no') return;
  if (rsvpSubmit.disabled) return;
  rsvpSubmit.disabled = true;
  rsvpError.hidden = true;
  rsvpSubmit.textContent = 'Đang gửi...';
  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: rsvpForm.elements.name.value,
        attending: attending === 'yes',
        guestCount: attending === 'yes' ? guestCount : undefined,
        message: rsvpForm.elements.message.value
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    $('#rsvp-followup').textContent = attending === 'no'
      ? 'Cảm ơn bạn đã hồi âm. Chúc bạn thật nhiều niềm vui và sức khỏe!'
      : 'Rất mong được gặp bạn trong ngày trọng đại!';
    rsvpForm.hidden = true;
    rsvpSuccess.hidden = false;
    $('#rsvp-done').focus();
  } catch (error) {
    rsvpError.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
    rsvpError.hidden = false;
    rsvpSubmit.disabled = false;
    rsvpSubmit.textContent = 'Gửi xác nhận';
  }
});
if (new URLSearchParams(location.search).get('open') === '1') openInvitation(false);
