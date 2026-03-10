import React from 'react';
import { Circle, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function HappyFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Happy squinting eyes */}
      <Path d="M79,85 Q85,80 91,85" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M109,85 Q115,80 121,85" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Big smile */}
      <Path d="M88,103 Q100,115 112,103" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Circle cx="75" cy="98" r="6" fill="#FFB3B3" opacity="0.5" />
      <Circle cx="125" cy="98" r="6" fill="#FFB3B3" opacity="0.5" />
    </BaseFox>
  );
}
