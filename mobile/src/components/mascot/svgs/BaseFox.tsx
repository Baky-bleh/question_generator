import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon } from 'react-native-svg';

interface BaseFoxProps {
  size: number;
  children?: React.ReactNode;
  earDroop?: number;
  bodyOffset?: number;
}

export function BaseFox({ size, children, earDroop = 0, bodyOffset = 0 }: BaseFoxProps) {
  const s = size / 200;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Tail */}
      <Ellipse cx="60" cy={170 + bodyOffset} rx="35" ry="15" fill="#FF8C42" rotation={-20} origin={`60, ${170 + bodyOffset}`} />
      <Ellipse cx="42" cy={165 + bodyOffset} rx="12" ry="8" fill="#FFFFFF" rotation={-20} origin={`42, ${165 + bodyOffset}`} />
      {/* Body */}
      <Ellipse cx="100" cy={150 + bodyOffset} rx="40" ry="35" fill="#FF8C42" />
      <Ellipse cx="100" cy={155 + bodyOffset} rx="28" ry="25" fill="#FFD4A8" />
      {/* Head */}
      <Circle cx="100" cy={90 + bodyOffset} r="40" fill="#FF8C42" />
      {/* Ears */}
      <Polygon points={`68,${60 + bodyOffset + earDroop} 58,${20 + earDroop * 2} 88,${50 + bodyOffset + earDroop}`} fill="#FF8C42" />
      <Polygon points={`72,${55 + bodyOffset + earDroop} 64,${28 + earDroop * 2} 85,${50 + bodyOffset + earDroop}`} fill="#FFD4A8" />
      <Polygon points={`132,${60 + bodyOffset + earDroop} 142,${20 + earDroop * 2} 112,${50 + bodyOffset + earDroop}`} fill="#FF8C42" />
      <Polygon points={`128,${55 + bodyOffset + earDroop} 136,${28 + earDroop * 2} 115,${50 + bodyOffset + earDroop}`} fill="#FFD4A8" />
      {/* Face area */}
      <Ellipse cx="100" cy={100 + bodyOffset} rx="30" ry="25" fill="#FFD4A8" />
      {/* Nose */}
      <Ellipse cx="100" cy={97 + bodyOffset} rx="5" ry="3.5" fill="#3C3C3C" />
      {/* Custom face expressions and extras */}
      {children}
    </Svg>
  );
}
