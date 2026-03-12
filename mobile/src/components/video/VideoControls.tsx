import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";

const AUTO_HIDE_DELAY_MS = 3_000;

interface VideoControlsProps {
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  playbackSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onCycleSpeed: () => void;
  onToggleFullscreen: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoControls({
  isPlaying,
  positionSeconds,
  durationSeconds,
  playbackSpeed,
  onPlay,
  onPause,
  onSeek,
  onCycleSpeed,
  onToggleFullscreen,
}: VideoControlsProps) {
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSeeking = useRef(false);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!isPlaying) return;
    hideTimer.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      setVisible(false);
    }, AUTO_HIDE_DELAY_MS);
  }, [isPlaying, opacity]);

  const showControls = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) });
    setVisible(true);
    scheduleHide();
  }, [opacity, scheduleHide]);

  const handleTap = useCallback(() => {
    if (visible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      opacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      setVisible(false);
    } else {
      showControls();
    }
  }, [visible, opacity, showControls]);

  // Auto-hide when playing
  useEffect(() => {
    if (isPlaying && visible) {
      scheduleHide();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isPlaying, visible, scheduleHide]);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      showControls();
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
    scheduleHide();
  }, [isPlaying, onPlay, onPause, scheduleHide]);

  const handleSlidingStart = useCallback(() => {
    isSeeking.current = true;
  }, []);

  const handleSlidingComplete = useCallback(
    (value: number) => {
      isSeeking.current = false;
      onSeek(value);
      scheduleHide();
    },
    [onSeek, scheduleHide],
  );

  const handleSpeedPress = useCallback(() => {
    onCycleSpeed();
    scheduleHide();
  }, [onCycleSpeed, scheduleHide]);

  const handleFullscreenPress = useCallback(() => {
    onToggleFullscreen();
    scheduleHide();
  }, [onToggleFullscreen, scheduleHide]);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.touchArea}>
        <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents={visible ? "auto" : "none"}>
          {/* Center play/pause button */}
          <View style={styles.centerArea}>
            <TouchableOpacity
              testID="video-play-pause-button"
              onPress={handlePlayPause}
              style={styles.playButton}
              activeOpacity={0.7}
            >
              <Ionicons
                testID={isPlaying ? "video-playing-indicator" : "video-paused-indicator"}
                name={isPlaying ? "pause" : "play"}
                size={48}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            <Text style={styles.timeText}>{formatTime(positionSeconds)}</Text>
            <Slider
              testID="video-progress-indicator"
              style={styles.slider}
              minimumValue={0}
              maximumValue={durationSeconds > 0 ? durationSeconds : 1}
              value={isSeeking.current ? undefined : positionSeconds}
              onSlidingStart={handleSlidingStart}
              onSlidingComplete={handleSlidingComplete}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor="#FFFFFF"
            />
            <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
            <TouchableOpacity testID="video-speed-button" onPress={handleSpeedPress} style={styles.speedButton}>
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFullscreenPress} style={styles.iconButton}>
              <Ionicons name="expand" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "center",
  },
  slider: {
    flex: 1,
    height: 40,
  },
  speedButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  speedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  iconButton: {
    padding: 4,
  },
});
