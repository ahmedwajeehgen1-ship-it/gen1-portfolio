document.querySelectorAll('.video-frame').forEach(frame => {
  const video = frame.querySelector('video');
  const button = frame.querySelector('.video-play');
  button.addEventListener('click', () => {
    button.hidden = true;
    video.play().catch(() => { button.hidden = false; });
  });
  video.addEventListener('play', () => { button.hidden = true; });
  video.addEventListener('ended', () => { button.hidden = false; });
});
