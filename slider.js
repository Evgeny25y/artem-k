// Слайдер «Наши работы»: сдвиг на одно фото каждые 2 секунды (data-interval), пауза при наведении, касании и фокусе,
// стрелки, возврат к началу в конце ленты. При prefers-reduced-motion автопрокрутки нет.
(() => {
  const root = document.querySelector("[data-slider]");
  if (!root) return;
  const track = root.querySelector(".x-slider__track");
  const slides = [...track.children];
  if (slides.length < 2) return;
  const interval = +root.dataset.interval || 2000;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = null, hold = 0;

  const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
  const atEnd = () => track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
  // свой плавный сдвиг: на время анимации выключаем scroll-snap, иначе браузер спорит с ним и лента стоит
  let anim = 0;
  const go = (to) => {
    clearInterval(anim);
    const from = track.scrollLeft, dist = to - from, t0 = performance.now(), dur = reduce ? 1 : 550;
    track.style.scrollSnapType = "none";
    anim = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      track.scrollLeft = from + dist * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      if (k >= 1) { clearInterval(anim); track.style.scrollSnapType = ""; }
    }, 16);
  };
  const max = () => track.scrollWidth - track.clientWidth;
  const next = () => go(atEnd() ? 0 : Math.min(max(), track.scrollLeft + step()));
  const prev = () => go(track.scrollLeft <= 4 ? max() : Math.max(0, track.scrollLeft - step()));

  // листаем только пока слайдер на экране: проверка при каждом тике, без IntersectionObserver
  const inView = () => { const r = root.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => { if (reduce || timer || hold) return; timer = setInterval(() => { if (!document.hidden && inView()) next(); }, interval); };
  const pause = () => { hold++; stop(); };
  const resume = () => { hold = Math.max(0, hold - 1); play(); };

  root.querySelector(".x-slider__btn--next").addEventListener("click", () => { stop(); next(); play(); });
  root.querySelector(".x-slider__btn--prev").addEventListener("click", () => { stop(); prev(); play(); });
  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);
  // касание: останавливаем на время пальца и ещё 4 секунды, чтобы успеть рассмотреть
  let touchWait = null;
  root.addEventListener("touchstart", () => { clearTimeout(touchWait); stop(); hold++; }, { passive: true });
  root.addEventListener("touchend", () => { touchWait = setTimeout(() => { hold = Math.max(0, hold - 1); play(); }, 4000); }, { passive: true });
  play();
})();
