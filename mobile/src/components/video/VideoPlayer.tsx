import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { VideoControls } from "./VideoControls";
import { useTheme } from "@/theme";

let Video: any = null;
let ResizeMode: any = {};
try {
  const av = require("expo-av");
  Video = av.Video;
  ResizeMode = av.ResizeMode;
} catch {
  // expo-av native module not available
}

interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<any>;
  isPlaying: boolean;
  isLoaded: boolean;
  positionSeconds: number;
  durationSeconds: number;
  playbackSpeed: number;
  onPlaybackStatusUpdate: (status: any) => void;
  onLoad: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onCycleSpeed: () => void;
  onToggleFullscreen: () => void;
}

export function VideoPlayer({
  videoUrl,
  videoRef,
  isPlaying,
  isLoaded,
  positionSeconds,
  durationSeconds,
  playbackSpeed,
  onPlaybackStatusUpdate,
  onLoad,
  onPlay,
  onPause,
  onSeek,
  onCycleSpeed,
  onToggleFullscreen,
}: VideoPlayerProps) {
  const { colors, typography } = useTheme();

  if (!Video) {
    return (
      <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: '#fff', textAlign: 'center', padding: 20 }]}>
          Video playback requires a development build.{'\n'}Run: npx expo run:android
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.text }]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onLoad={onLoad}
        shouldPlay={false}
        useNativeControls={false}
      />
      {!isLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.textInverse} />
        </View>
      )}
      {isLoaded && (
        <VideoControls
          isPlaying={isPlaying}
          positionSeconds={positionSeconds}
          durationSeconds={durationSeconds}
          playbackSpeed={playbackSpeed}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onCycleSpeed={onCycleSpeed}
          onToggleFullscreen={onToggleFullscreen}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
