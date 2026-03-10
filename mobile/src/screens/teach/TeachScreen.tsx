import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getAccessToken } from '@/services/auth';

const API = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function TeachScreen() {
  const { colors, typography, spacing } = useTheme();
  const user = useAuthStore((s) => s.user);

  // Video upload
  const [videoState, setVideoState] = useState<UploadState>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFilename, setVideoFilename] = useState<string | null>(null);

  // Lesson form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('');
  const [lessonState, setLessonState] = useState<UploadState>('idle');

  const pickAndUploadVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow access to your media library to upload videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 1,
        videoMaxDuration: 3600,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const filename = asset.fileName || `video-${Date.now()}.mp4`;
      setVideoState('uploading');
      setVideoFilename(filename);

      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType || 'video/mp4',
      } as any);

      const resp = await fetch(`${API}/api/v1/admin/upload/video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${resp.status})`);
      }

      const data = await resp.json();
      setVideoUrl(data.url);
      setVideoState('success');
    } catch (e: any) {
      setVideoState('error');
      Alert.alert('Upload Failed', e.message || 'Something went wrong');
    }
  };

  const createLesson = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a lesson title.');
      return;
    }
    if (!videoUrl) {
      Alert.alert('No Video', 'Please upload a video first.');
      return;
    }

    try {
      setLessonState('uploading');
      const token = await getAccessToken();

      // First create a course if needed
      const courseResp = await fetch(`${API}/api/v1/admin/courses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language_from: 'en',
          language_to: 'math',
          title: courseName.trim() || 'My Course',
          course_type: 'math',
          content_mode: 'video_quiz',
          total_units: 1,
          total_lessons: 1,
        }),
      });

      if (!courseResp.ok) {
        const err = await courseResp.json().catch(() => ({}));
        throw new Error(err.detail || `Course creation failed (${courseResp.status})`);
      }

      const course = await courseResp.json();

      // Create the video lesson
      const lessonId = `vl-${Date.now()}`;
      const lessonResp = await fetch(`${API}/api/v1/admin/video-lessons`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: lessonId,
          course_id: course.id,
          unit_order: 1,
          lesson_order: 1,
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl,
          video_duration_seconds: 300,
          teacher_name: user?.display_name || 'Teacher',
        }),
      });

      if (!lessonResp.ok) {
        const err = await lessonResp.json().catch(() => ({}));
        throw new Error(err.detail || `Lesson creation failed (${lessonResp.status})`);
      }

      setLessonState('success');
      Alert.alert('Success!', `Lesson "${title}" created in course "${courseName || 'My Course'}".`);

      // Reset form
      setTitle('');
      setDescription('');
      setCourseName('');
      setVideoUrl(null);
      setVideoFilename(null);
      setVideoState('idle');
    } catch (e: any) {
      setLessonState('error');
      Alert.alert('Failed', e.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.base }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.heading2, { color: colors.text, marginBottom: spacing.sm }]}>
          Teacher Dashboard
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Upload a video and create a lesson for your students.
        </Text>

        {/* Step 1: Upload Video */}
        <Card variant="outlined" padding="md">
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={[typography.button, { color: colors.textInverse }]}>1</Text>
            </View>
            <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>
              Upload Video
            </Text>
          </View>

          {videoState === 'idle' && (
            <View style={{ marginTop: spacing.base }}>
              <Button variant="outline" onPress={pickAndUploadVideo}>
                <View style={styles.uploadRow}>
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                  <Text style={[typography.button, { color: colors.primary, marginLeft: 8 }]}>
                    Choose Video File
                  </Text>
                </View>
              </Button>
            </View>
          )}

          {videoState === 'uploading' && (
            <View style={[styles.statusRow, { marginTop: spacing.base }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.body, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                Uploading {videoFilename}...
              </Text>
            </View>
          )}

          {videoState === 'success' && (
            <View style={[styles.statusRow, { marginTop: spacing.base }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[typography.body, { color: colors.success, marginLeft: spacing.sm, flex: 1 }]}>
                {videoFilename} uploaded!
              </Text>
            </View>
          )}

          {videoState === 'error' && (
            <View style={{ marginTop: spacing.base }}>
              <View style={styles.statusRow}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <Text style={[typography.body, { color: colors.error, marginLeft: spacing.sm }]}>
                  Upload failed
                </Text>
              </View>
              <View style={{ marginTop: spacing.sm }}>
                <Button variant="outline" onPress={() => { setVideoState('idle'); }}>
                  Try Again
                </Button>
              </View>
            </View>
          )}
        </Card>

        {/* Step 2: Lesson Details */}
        <View style={{ marginTop: spacing.base }}>
          <Card variant="outlined" padding="md">
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: videoUrl ? colors.primary : colors.disabled }]}>
                <Text style={[typography.button, { color: colors.textInverse }]}>2</Text>
              </View>
              <Text style={[typography.heading3, { color: colors.text, marginLeft: spacing.sm }]}>
                Lesson Details
              </Text>
            </View>

            <View style={{ marginTop: spacing.base, gap: spacing.md }}>
              <View>
                <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                  Course Name
                </Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                    ...typography.body,
                  }]}
                  value={courseName}
                  onChangeText={setCourseName}
                  placeholder="e.g. Algebra Basics"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View>
                <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                  Lesson Title *
                </Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                    ...typography.body,
                  }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Introduction to Variables"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View>
                <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                  Description
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                    ...typography.body,
                  }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What will students learn?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Submit */}
        <View style={{ marginTop: spacing.lg, marginBottom: spacing.xxl }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={createLesson}
            loading={lessonState === 'uploading'}
            disabled={!title.trim() || !videoUrl || lessonState === 'uploading'}
          >
            Create Lesson
          </Button>

          {lessonState === 'success' && (
            <View style={[styles.statusRow, { marginTop: spacing.base, justifyContent: 'center' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[typography.body, { color: colors.success, marginLeft: spacing.sm }]}>
                Lesson created successfully!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
});
