import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ContactScene } from '../../../../src/remotion/scenes/ContactScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('ContactScene', () => {
  it('returns null when frame < 360', () => {
    const { container } = render(<svg><ContactScene frame={359} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 479', () => {
    const { container } = render(<svg><ContactScene frame={480} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 420', () => {
    const { container } = render(<svg><ContactScene frame={420} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
