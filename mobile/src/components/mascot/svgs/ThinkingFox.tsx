import React from 'react';
import { Circle, Ellipse, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function ThinkingFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Thought bubbles */}
      <Circle cx="150" cy="45" r="4" fill="#E5E5E5" />
      <Circle cx="158" cy="35" r="6" fill="#E5E5E5" />
      <Circle cx="168" cy="22" r="9" fill="#E5E5E5" />
      {/* Paw on chin */}
      <Ellipse cx="130" cy="110" rx="8" ry="12" fill="#FF8C42" rotation={-20} origin="130, 110" />
      {/* Eyes looking up */}
      <Circle cx="85" cy="83" r="6" fill="#3C3C3C" />
      <Circle cx="115" cy="83" r="6" fill="#3C3C3C" />
      <Circle cx="87" cy="80" r="2.5" fill="#FFFFFF" />
      <Circle cx="117" cy="80" r="2.5" fill="#FFFFFF" />
      {/* Hmm mouth */}
      <Path d="M95,105 L105,105" stroke="#3C3C3C" strokeWidth="2" strokeLinecap="round" />
    </BaseFox>
  );
}
