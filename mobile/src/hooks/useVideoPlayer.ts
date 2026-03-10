import { useRef, useState, useCallback, useEffect } from "react";
import { useVideoProgressMutation } from "@/hooks/queries/useVideoLesson";

let Video: any = null;
try {
  Video = require("expo-av").Video;
} catch {
  // expo-av not available
}

type AVPlaybackStatus = any;
type AVPlaybackStatusSuccess = any;

type PlaybackSpeed = 1 | 1.25 | 1.5 | 2;

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 1.25, 1.5, 2];
const PROGRESS_REPORT_INTERVAL_MS = 30_000;

interface UseVideoPlayerOptions {
  videoLessonId: string;
  lastPositionSeconds: number;
  durationSeconds: number;
}

export function useVideoPlayer({
  videoLessonId,
  lastPositionSeconds,
  durationSeconds,
}: UseVideoPlayerOptions) {
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSeconds, setPositionSeconds] = useState(lastPositionSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const actualDuration = useRef(durationSeconds);
  const lastReportedPosition = useRef(lastPositionSeconds);

  const watchPercent =
    actualDuration.current > 0
      ? Math.min(100, Math.round((positionSeconds / actualDuration.current) * 100))
      : 0;

  const progressMutation = useVideoProgressMutation(videoLessonId);

  const reportProgress = useCallback(() => {
    if (positionSeconds <= 0 || actualDuration.current <= 0) return;
    const currentPercent = Math.min(
      100,
      Math.round((positionSeconds / actualDuration.current) * 100),
    );
    progressMutation.mutate({
      position_seconds: Math.round(positionSeconds),
      watch_percent: currentPercent,
    });
    lastReportedPosition.current = positionSeconds;
  }, [positionSeconds, progressMutation]);

  // Report progress every 30 seconds while playing
  useEffect(() => {
    if (!isPlaying || !isLoaded) return;

    const interval = setInterval(() => {
      reportProgress();
    }, PROGRESS_REPORT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, isLoaded, reportProgress]);

  // Report progress when playback stops
  useEffect(() => {
    if (!isPlaying && isLoaded && positionSeconds > 0) {
      reportProgress();
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsLoaded(false);
      return;
    }

    const loadedStatus = status as AVPlaybackStatusSuccess;
    setIsLoaded(true);
    setIsPlaying(loadedStatus.isPlaying);

    if (loadedStatus.positionMillis !== undefined) {
      setPositionSeconds(loadedStatus.positionMillis / 1000);
    }

    if (loadedStatus.durationMillis !== undefined && loadedStatus.durationMillis > 0) {
      actualDuration.current = loadedStatus.durationMillis / 1000;
    }
  }, []);

  const play = useCallback(async () => {
    await videoRef.current?.playAsync();
  }, []);

  const pause = useCallback(async () => {
    await videoRef.current?.pauseAsync();
  }, []);

  const seek = useCallback(async (seconds: number) => {
    await videoRef.current?.setPositionAsync(seconds * 1000);
    setPositionSeconds(seconds);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await videoRef.current?.dismissFullscreenPlayer();
    } else {
      await videoRef.current?.presentFullscreenPlayer();
    }
    setIsFullscreen((prev) => !prev);
  }, [isFullscreen]);

  const cycleSpeed = useCallback(async () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const nextSpeed = SPEED_OPTIONS[nextIndex];
    setPlaybackSpeed(nextSpeed);
    await videoRef.current?.setRateAsync(nextSpeed, true);
  }, [playbackSpeed]);

  // Resume from last position on mount
  const onLoad = useCallback(async () => {
    if (lastPositionSeconds > 0) {
      await videoRef.current?.setPositionAsync(lastPositionSeconds * 1000);
    }
  }, [lastPositionSeconds]);

  return {
    videoRef,
    isPlaying,
    isLoaded,
    positionSeconds,
    durationSeconds: actualDuration.current,
    watchPercent,
    playbackSpeed,
    isFullscreen,
    play,
    pause,
    seek,
    toggleFullscreen,
    cycleSpeed,
    onPlaybackStatusUpdate,
    onLoad,
  };
}
