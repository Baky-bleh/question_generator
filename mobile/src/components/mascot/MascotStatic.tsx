import React from 'react';
import { View } from 'react-native';
import type { MascotState } from '../../../../shared/mascot/types';
import { MASCOT_ASSETS, MASCOT_SIZES } from './mascotAssets';

interface MascotStaticProps {
  state: MascotState;
  size?: 'sm' | 'md' | 'lg';
}

export function MascotStatic({ state, size = 'md' }: MascotStaticProps) {
  const SvgComponent = MASCOT_ASSETS[state];
  const pixelSize = MASCOT_SIZES[size];

  return (
    <View style={{ width: pixelSize, height: pixelSize }}>
      <SvgComponent size={pixelSize} />
    </View>
  );
}
