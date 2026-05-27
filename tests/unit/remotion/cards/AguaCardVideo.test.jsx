import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AguaCardVideo } from '../../../../src/remotion/cards/AguaCardVideo.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 45,
}));

describe('AguaCardVideo', () => {
  it('renders an SVG without crash', () => {
    const { container } = render(<AguaCardVideo color="#1e3a5f" id="P-001" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the ID label text', () => {
    const { container } = render(<AguaCardVideo color="#1c4a3a" id="P-002" />);
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some(t => t.textContent.includes('P-002'))).toBe(true);
  });
});
