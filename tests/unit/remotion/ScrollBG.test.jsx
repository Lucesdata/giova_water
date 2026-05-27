import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ScrollBG } from '../../../src/remotion/ScrollBG.jsx';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }) => React.createElement('div', { style }, children),
  useCurrentFrame: () => 60,
}));

vi.mock('../../../src/remotion/scenes/AboutScene.jsx', () => ({
  AboutScene: () => React.createElement('g', { 'data-testid': 'about-scene' }),
}));
vi.mock('../../../src/remotion/scenes/ProjectsScene.jsx', () => ({
  ProjectsScene: () => React.createElement('g', { 'data-testid': 'projects-scene' }),
}));
vi.mock('../../../src/remotion/scenes/DigitalTwinsScene.jsx', () => ({
  DigitalTwinsScene: () => React.createElement('g', { 'data-testid': 'twins-scene' }),
}));
vi.mock('../../../src/remotion/scenes/ContactScene.jsx', () => ({
  ContactScene: () => React.createElement('g', { 'data-testid': 'contact-scene' }),
}));

describe('ScrollBG', () => {
  it('renders an SVG with viewBox "0 0 1440 900"', () => {
    const { container } = render(<ScrollBG />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 1440 900');
  });

  it('renders all four scene slots', () => {
    const { getByTestId } = render(<ScrollBG />);
    expect(getByTestId('about-scene')).not.toBeNull();
    expect(getByTestId('projects-scene')).not.toBeNull();
    expect(getByTestId('twins-scene')).not.toBeNull();
    expect(getByTestId('contact-scene')).not.toBeNull();
  });
});
