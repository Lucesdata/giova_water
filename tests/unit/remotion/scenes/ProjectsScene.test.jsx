import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProjectsScene } from '../../../../src/remotion/scenes/ProjectsScene.jsx';

vi.mock('remotion', () => ({ interpolate: () => 0.5 }));

describe('ProjectsScene', () => {
  it('returns null when frame < 120', () => {
    const { container } = render(<svg><ProjectsScene frame={119} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('returns null when frame > 239', () => {
    const { container } = render(<svg><ProjectsScene frame={240} /></svg>);
    expect(container.querySelector('g')).toBeNull();
  });

  it('renders a <g> at frame 180', () => {
    const { container } = render(<svg><ProjectsScene frame={180} /></svg>);
    expect(container.querySelector('g')).not.toBeNull();
  });
});
