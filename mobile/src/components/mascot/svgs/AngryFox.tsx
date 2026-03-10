import React from 'react';
import { Circle, Ellipse, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function AngryFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Crossed arms */}
      <Ellipse cx="75" cy="145" rx="10" ry="16" fill="#FF8C42" rotation={20} origin="75, 145" />
      <Ellipse cx="125" cy="145" rx="10" ry="16" fill="#FF8C42" rotation={-20} origin="125, 145" />
      {/* Angry eyes */}
      <Circle cx="85" cy="87" r="5" fill="#3C3C3C" />
      <Circle cx="115" cy="87" r="5" fill="#3C3C3C" />
      <Circle cx="86" cy="85" r="1.5" fill="#FFFFFF" />
      <Circle cx="116" cy="85" r="1.5" fill="#FFFFFF" />
      {/* Angry eyebrows */}
      <Path d="M76,78 L92,82" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M124,78 L108,82" stroke="#3C3C3C" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Pout */}
      <Path d="M90,107 Q100,102 110,107" stroke="#3C3C3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Red cheeks */}
      <Circle cx="75" cy="98" r="6" fill="#FF6B6B" opacity="0.3" />
      <Circle cx="125" cy="98" r="6" fill="#FF6B6B" opacity="0.3" />
    </BaseFox>
  );
}
