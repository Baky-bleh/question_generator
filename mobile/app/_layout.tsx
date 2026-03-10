import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Toast, registerToastCallback } from '@/components/ui';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', variant: 'info', visible: false });

  useEffect(() => {
    registerToastCallback(({ message, variant }) => {
      setToast({ message, variant, visible: true });
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    async function bootstrap() {
      await useSettingsStore.getState().hydrate();
      await useAuthStore.getState().hydrate();
      setIsReady(true);
    }
    bootstrap();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(lesson)"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="(video)"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onDismiss={handleDismiss}
      />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
