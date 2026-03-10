import React from 'react';
import { Circle, Ellipse, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function EncouragingFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Thumbs up arm */}
      <Ellipse cx="148" cy="135" rx="10" ry="16" fill="#FF8C42" rotation={-15} origin="148, 135" />
      <Circle cx="152" cy="118" r="8" fill="#FF8C42" />
      <Ellipse cx="152" cy="112" rx="4" ry="7" fill="#FF8C42" />
      {/* Warm eyes */}
      <Circle cx="85" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="115" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="87" cy="83" r="2" fill="#FFFFFF" />
      <Circle cx="117" cy="83" r="2" fill="#FFFFFF" />
      {/* Warm smile */}
      <Path d="M90,103 Q100,112 110,103" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Circle cx="75" cy="98" r="5" fill="#FFB3B3" opacity="0.4" />
      <Circle cx="125" cy="98" r="5" fill="#FFB3B3" opacity="0.4" />
    </BaseFox>
  );
}
