import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DigitalCardVideo } from '../../../../src/remotion/cards/DigitalCardVideo.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 45,
}));

describe('DigitalCardVideo', () => {
  it('renders an SVG without crash', () => {
    const { container } = render(<DigitalCardVideo color="#3a2660" id="P-003" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the ID label text', () => {
    const { container } = render(<DigitalCardVideo color="#2c2a10" id="P-004" />);
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts.some(t => t.textContent.includes('P-004'))).toBe(true);
  });
});
