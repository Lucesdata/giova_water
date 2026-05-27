import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AboutScene } from '../../../../src/remotion/scenes/AboutScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('AboutScene', () => {
  it('returns null when frame < 0', () => {
    const { container } = render(<svg><AboutScene frame={-1} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 119', () => {
    const { container } = render(<svg><AboutScene frame={120} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 60', () => {
    const { container } = render(<svg><AboutScene frame={60} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
