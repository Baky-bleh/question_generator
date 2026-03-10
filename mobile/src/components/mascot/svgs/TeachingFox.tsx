import React from 'react';
import { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function TeachingFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Light bulb */}
      <Circle cx="155" cy="40" r="12" fill="#FFC800" opacity="0.3" />
      <Circle cx="155" cy="40" r="8" fill="#FFC800" opacity="0.6" />
      <Circle cx="155" cy="40" r="4" fill="#FFC800" />
      {/* Rays */}
      <Line x1="155" y1="24" x2="155" y2="18" stroke="#FFC800" strokeWidth="2" strokeLinecap="round" />
      <Line x1="168" y1="40" x2="174" y2="40" stroke="#FFC800" strokeWidth="2" strokeLinecap="round" />
      <Line x1="165" y1="30" x2="170" y2="25" stroke="#FFC800" strokeWidth="2" strokeLinecap="round" />
      {/* Pointing arm */}
      <Ellipse cx="145" cy="120" rx="8" ry="16" fill="#FF8C42" rotation={-20} origin="145, 120" />
      {/* Wise eyes */}
      <Circle cx="85" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="115" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="87" cy="83" r="2" fill="#FFFFFF" />
      <Circle cx="117" cy="83" r="2" fill="#FFFFFF" />
      {/* Raised eyebrow */}
      <Path d="M108,76 Q115,72 122,76" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Knowing smile */}
      <Path d="M90,103 Q100,111 110,103" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
    </BaseFox>
  );
}
