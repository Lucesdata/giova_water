import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PTAPModule } from '../../../src/remotion/components/PTAPModule.jsx';

vi.mock('remotion', () => ({
  useCurrentFrame: () => 90,
  interpolate: (_frame, _input, output) => output[1],
  Easing: { bezier: () => (t) => t },
}));

describe('PTAPModule', () => {
  it('renders children inside a <g> element', () => {
    const { container } = render(
      <svg>
        <PTAPModule startFrame={15} durationFrames={15}>
          <rect data-testid="child" x="0" y="0" width="10" height="10" />
        </PTAPModule>
      </svg>
    );
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it('applies opacity style to the wrapper <g>', () => {
    const { container } = render(
      <svg>
        <PTAPModule startFrame={15} durationFrames={15}>
          <circle cx="5" cy="5" r="5" />
        </PTAPModule>
      </svg>
    );
    const g = container.querySelector('g');
    expect(g.getAttribute('style')).toContain('opacity');
  });
});
