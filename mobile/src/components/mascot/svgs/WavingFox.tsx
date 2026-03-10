import React from 'react';
import { Circle, Ellipse, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function WavingFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Waving arm */}
      <Ellipse cx="148" cy="110" rx="8" ry="18" fill="#FF8C42" rotation={-30} origin="148, 110" />
      <Circle cx="155" cy="92" r="9" fill="#FF8C42" />
      {/* Friendly eyes */}
      <Circle cx="85" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="115" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="87" cy="83" r="2.5" fill="#FFFFFF" />
      <Circle cx="117" cy="83" r="2.5" fill="#FFFFFF" />
      {/* Big friendly smile */}
      <Path d="M88,103 Q100,114 112,103" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Circle cx="75" cy="98" r="6" fill="#FFB3B3" opacity="0.5" />
      <Circle cx="125" cy="98" r="6" fill="#FFB3B3" opacity="0.5" />
    </BaseFox>
  );
}
