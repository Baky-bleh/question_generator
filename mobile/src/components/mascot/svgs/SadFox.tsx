import React from 'react';
import { Circle, Ellipse, Path } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function SadFox({ size }: { size: number }) {
  return (
    <BaseFox size={size} bodyOffset={5} earDroop={5}>
      {/* Sad eyes */}
      <Circle cx="85" cy="95" r="6" fill="#3C3C3C" />
      <Circle cx="115" cy="95" r="6" fill="#3C3C3C" />
      <Circle cx="87" cy="93" r="2" fill="#FFFFFF" />
      <Circle cx="117" cy="93" r="2" fill="#FFFFFF" />
      {/* Sad eyebrows */}
      <Path d="M78,85 Q85,81 92,85" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M108,85 Q115,81 122,85" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Frown */}
      <Path d="M90,117 Q100,111 110,117" stroke="#3C3C3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Tear */}
      <Ellipse cx="80" cy="103" rx="2" ry="3" fill="#1CB0F6" opacity="0.6" />
    </BaseFox>
  );
}
