import React from 'react';
import { Circle, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function IdleFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Eyes */}
      <Circle cx="85" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="115" cy="85" r="6" fill="#3C3C3C" />
      <Circle cx="87" cy="83" r="2" fill="#FFFFFF" />
      <Circle cx="117" cy="83" r="2" fill="#FFFFFF" />
      {/* Neutral mouth */}
      <Path d="M93,103 Q100,108 107,103" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
    </BaseFox>
  );
}
