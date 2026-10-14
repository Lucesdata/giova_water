import '@testing-library/jest-dom/vitest';

// jsdom does not implement media playback; the hero video only needs the calls to exist.
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function pause() {};
}
