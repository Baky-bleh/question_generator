import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
let Audio: any = null;
try {
  Audio = require("expo-av").Audio;
} catch {
  // expo-av native module not available (e.g. Expo Go on SDK 55)
}
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Input, Button } from "@/components/ui";
import type { ExerciseComponentProps } from "./ExerciseRenderer";
import type { ListeningExercise } from "@lingualeap/types";

export function Listening({ exercise, onAnswer, disabled }: ExerciseComponentProps) {
  const ex = exercise as ListeningExercise;
  const { colors, typography, spacing } = useTheme();
  const [answer, setAnswer] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const playAudio = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 400 }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
    );

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: ex.audio_url });
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          cancelAnimation(pulseScale);
          pulseScale.value = withTiming(1, { duration: 200 });
          sound.unloadAsync();
        }
      });
      await sound.playAsync();
    } catch {
      setIsPlaying(false);
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [ex.audio_url, isPlaying, pulseScale]);

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return;
    onAnswer(answer.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.heading3, { color: colors.text, textAlign: "center", marginBottom: spacing.lg }]}>
        Type what you hear
      </Text>

      <View style={styles.audioArea}>
        <Animated.View style={pulseStyle}>
          <TouchableOpacity
            onPress={playAudio}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.playButton,
              {
                backgroundColor: isPlaying ? colors.primaryLight : colors.primary,
              },
            ]}
          >
            <Ionicons
              name={isPlaying ? "volume-high" : "play"}
              size={40}
              color={colors.textInverse}
            />
          </TouchableOpacity>
        </Animated.View>

        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.md }]}>
          Tap to {isPlaying ? "playing..." : "listen"}
        </Text>
      </View>

      <View style={styles.inputArea}>
        <Input
          placeholder="Type what you hear..."
          value={answer}
          onChangeText={setAnswer}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          disabled={disabled}
        />
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={!answer.trim() || disabled}
        >
          Check
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  audioArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  inputArea: {
    gap: 12,
  },
});
