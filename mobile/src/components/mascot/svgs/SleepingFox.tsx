import React from 'react';
import { Path, Text as SvgText } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function SleepingFox({ size }: { size: number }) {
  return (
    <BaseFox size={size} bodyOffset={5} earDroop={3}>
      {/* Zzz */}
      <SvgText x="140" y="40" fontSize="18" fontWeight="bold" fill="#777777" opacity="0.7">Z</SvgText>
      <SvgText x="155" y="28" fontSize="14" fontWeight="bold" fill="#777777" opacity="0.5">Z</SvgText>
      <SvgText x="165" y="18" fontSize="10" fontWeight="bold" fill="#777777" opacity="0.3">Z</SvgText>
      {/* Closed eyes */}
      <Path d="M79,95 Q85,98 91,95" stroke="#3C3C3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M109,95 Q115,98 121,95" stroke="#3C3C3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Peaceful mouth */}
      <Path d="M95,115 Q100,118 105,115" stroke="#3C3C3C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </BaseFox>
  );
}
