import React from 'react';
import { Circle, Ellipse, Path, Polygon } from 'react-native-svg';
import { BaseFox } from './BaseFox';

export function CelebratingFox({ size }: { size: number }) {
  return (
    <BaseFox size={size}>
      {/* Stars */}
      <Polygon points="30,30 33,40 43,40 35,46 38,56 30,50 22,56 25,46 17,40 27,40" fill="#FFC800" opacity="0.8" />
      <Polygon points="170,25 172,32 179,32 173,36 175,43 170,39 165,43 167,36 161,32 168,32" fill="#FFC800" opacity="0.6" />
      <Polygon points="155,60 157,65 162,65 158,68 159,73 155,70 151,73 152,68 148,65 153,65" fill="#58CC02" opacity="0.7" />
      {/* Raised arms */}
      <Ellipse cx="55" cy="130" rx="10" ry="18" fill="#FF8C42" rotation={30} origin="55, 130" />
      <Ellipse cx="145" cy="130" rx="10" ry="18" fill="#FF8C42" rotation={-30} origin="145, 130" />
      {/* Excited eyes */}
      <Circle cx="85" cy="85" r="7" fill="#3C3C3C" />
      <Circle cx="115" cy="85" r="7" fill="#3C3C3C" />
      <Circle cx="87" cy="82" r="3" fill="#FFFFFF" />
      <Circle cx="117" cy="82" r="3" fill="#FFFFFF" />
      {/* Open mouth */}
      <Ellipse cx="100" cy="108" rx="10" ry="7" fill="#3C3C3C" />
      <Ellipse cx="100" cy="105" rx="8" ry="4" fill="#FF6B6B" />
      {/* Blush */}
      <Circle cx="75" cy="98" r="7" fill="#FFB3B3" opacity="0.5" />
      <Circle cx="125" cy="98" r="7" fill="#FFB3B3" opacity="0.5" />
    </BaseFox>
  );
}
