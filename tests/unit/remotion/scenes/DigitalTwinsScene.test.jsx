import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DigitalTwinsScene } from '../../../../src/remotion/scenes/DigitalTwinsScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('DigitalTwinsScene', () => {
  it('returns null when frame < 240', () => {
    const { container } = render(<svg><DigitalTwinsScene frame={239} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 359', () => {
    const { container } = render(<svg><DigitalTwinsScene frame={360} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 300', () => {
    const { container } = render(<svg><DigitalTwinsScene frame={300} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
