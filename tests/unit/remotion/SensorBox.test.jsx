import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SensorBox } from '../../../src/remotion/components/SensorBox.jsx';

vi.mock('remotion', () => ({
  useCurrentFrame: () => 160,
  interpolate: (_frame, _input, output) => output[1],
  Easing: { bezier: () => (t) => t },
}));

describe('SensorBox', () => {
  it('renders sensor id and value as text', () => {
    const { container } = render(
      <svg>
        <SensorBox
          startFrame={150}
          lineX={210} lineY1={248} lineY2={330}
          x={168} y={332}
          id="FIT-01" label="Caudal"
          value="42.3" unit="L/s"
        />
      </svg>
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts.some(t => t.includes('FIT-01'))).toBe(true);
    expect(texts.some(t => t.includes('42.3'))).toBe(true);
  });

  it('renders a guide line and a rect', () => {
    const { container } = render(
      <svg>
        <SensorBox
          startFrame={150}
          lineX={210} lineY1={248} lineY2={330}
          x={168} y={332}
          id="FIT-01" label="Caudal"
          value="42.3" unit="L/s"
        />
      </svg>
    );
    expect(container.querySelector('line')).not.toBeNull();
    expect(container.querySelector('rect')).not.toBeNull();
  });
});
