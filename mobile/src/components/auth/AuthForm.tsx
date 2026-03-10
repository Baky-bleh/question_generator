import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';
import { Input, Button } from '@/components/ui';
import { useTheme } from '@/theme';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading?: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
}

function validateEmail(email: string): string | undefined {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export function AuthForm({ mode, onSubmit, loading = false }: AuthFormProps) {
  const { spacing } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' && !displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (mode === 'signup') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    setSubmitted(true);
    if (!validate()) return;

    await onSubmit({
      email: email.trim(),
      password,
      displayName: mode === 'signup' ? displayName.trim() : undefined,
    });
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {mode === 'signup' && (
        <Input
          label="Display Name"
          placeholder="How should we call you?"
          value={displayName}
          onChangeText={(text) => {
            setDisplayName(text);
            if (submitted) setErrors((prev) => ({ ...prev, displayName: '' }));
          }}
          error={submitted ? errors.displayName : undefined}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      )}
      <Input
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (submitted) {
            const err = validateEmail(text);
            setErrors((prev) => ({ ...prev, email: err ?? '' }));
          }
        }}
        error={submitted ? errors.email : undefined}
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Input
        label="Password"
        placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Enter your password'}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (submitted) {
            const err = validatePassword(text);
            setErrors((prev) => ({ ...prev, password: err ?? '' }));
          }
        }}
        error={submitted ? errors.password : undefined}
        secureTextEntry
        returnKeyType={mode === 'signup' ? 'next' : 'done'}
        onSubmitEditing={() => {
          if (mode === 'signup') {
            confirmRef.current?.focus();
          } else {
            handleSubmit();
          }
        }}
      />
      {mode === 'signup' && (
        <Input
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (submitted) {
              setErrors((prev) => ({
                ...prev,
                confirmPassword: text !== password ? 'Passwords do not match' : '',
              }));
            }
          }}
          error={submitted ? errors.confirmPassword : undefined}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      )}
      <View style={{ marginTop: spacing.md }}>
        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
        >
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </Button>
      </View>
    </View>
  );
}
