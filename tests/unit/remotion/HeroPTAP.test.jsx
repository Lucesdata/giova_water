import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HeroPTAP } from '../../../src/remotion/HeroPTAP.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 90,
  interpolate: (_frame, _input, output) => output[1],
  Easing: { bezier: () => (t) => t },
}));

vi.mock('../../../src/remotion/components/PTAPModule.jsx', () => ({
  PTAPModule: ({ children }) => React.createElement('g', null, children),
}));

vi.mock('../../../src/remotion/components/SensorBox.jsx', () => ({
  SensorBox: () => React.createElement('g', null),
}));

vi.mock('../../../src/remotion/components/FlowPipes.jsx', () => ({
  FlowPipes: () => React.createElement('g', null),
}));

describe('HeroPTAP', () => {
  it('renders without throwing', () => {
    expect(() => render(<HeroPTAP />)).not.toThrow();
  });

  it('renders an SVG with viewBox 0 0 800 440', () => {
    const { container } = render(<HeroPTAP />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 800 440');
  });
});
