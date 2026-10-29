import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { colors, useTheme } from '../theme';

export function Page({ children }: React.PropsWithChildren) {
  useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 26, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { mode } = useTheme();
  return (
    <View style={{
      width: compact ? 74 : 92,
      height: compact ? 58 : 74,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Image
        accessibilityLabel="LUME — GPS de Carreira"
        source={require('../../assets/lume-logo.png')}
        resizeMode="contain"
        tintColor={mode === 'dark' && !compact ? colors.white : undefined}
        style={{ width: compact ? 68 : 88, height: compact ? 54 : 70 }}
      />
    </View>
  );
}

export function MobileHeader({
  caption,
  onProfilePress,
  onBackPress,
}: {
  caption?: string;
  onProfilePress?: () => void;
  onBackPress?: () => void;
}) {
  const { mode } = useTheme();
  const { user } = useAuth();
  const avatarLabel = user?.nome.trim().charAt(0).toUpperCase() || '•';

  return (
    <View style={{
      minHeight: 76,
      marginHorizontal: -18,
      marginTop: -18,
      marginBottom: 2,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
    }}>
      {onBackPress ? (
        <Pressable onPress={onBackPress} accessibilityRole="button" style={{ paddingVertical: 8, paddingRight: 4 }}>
          <Text style={{ color: colors.onPrimary, fontSize: 13, fontWeight: '800' }}>‹ Voltar</Text>
        </Pressable>
      ) : null}
      <BrandLogo compact />
      {caption ? <Text style={{ flex: 1, color: colors.onPrimary, fontSize: 12, fontWeight: '700', lineHeight: 17 }}>{caption}</Text> : <View style={{ flex: 1 }} />}
      {onProfilePress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil"
          onPress={onProfilePress}
          style={({ pressed }) => [{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: mode === 'dark' ? colors.softAccent : colors.text,
            borderRadius: 18,
          }, pressed && { opacity: 0.8 }]}
        >
          <Text style={{ color: mode === 'dark' ? colors.accent : colors.primary, fontSize: 17 }}>{avatarLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  useTheme();
  return (
    <View style={{ gap: 4, marginBottom: 2 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.subtle, fontSize: 13, lineHeight: 19 }}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children }: React.PropsWithChildren) {
  useTheme();
  return (
    <View style={{
      padding: 16,
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
    }}>
      {children}
    </View>
  );
}

export function Label({ children }: React.PropsWithChildren) {
  useTheme();
  return <Text style={{ color: colors.subtle, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>{children}</Text>;
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  useTheme();
  return (
    <View style={{ gap: 6, marginBottom: 4 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.subtle}
        style={{
          minHeight: 46,
          paddingHorizontal: 13,
          color: colors.text,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          fontSize: 15,
        }}
        autoCapitalize={props.keyboardType === 'email-address' ? 'none' : props.autoCapitalize}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  busy = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  busy?: boolean;
}) {
  const { mode } = useTheme();
  const buttonTextColor = secondary || mode === 'dark' ? colors.onPrimary : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 44,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: secondary ? colors.primary : colors.text,
        },
        (disabled || busy) && { opacity: 0.55 },
        pressed && !disabled && !busy && { opacity: 0.8 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={buttonTextColor} />
      ) : (
        <Text style={{ color: buttonTextColor, fontSize: 14, fontWeight: '800' }}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Message({ children, error = false }: React.PropsWithChildren<{ error?: boolean }>) {
  useTheme();
  return (
    <Text
      accessibilityRole={error ? 'alert' : 'text'}
      style={{
        padding: 12,
        borderRadius: 10,
        fontSize: 13,
        lineHeight: 19,
        color: error ? colors.danger : colors.text,
        backgroundColor: error ? colors.dangerBackground : colors.softInfo,
      }}
    >
      {children}
    </Text>
  );
}

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  useTheme();
  return (
    <View style={{ minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={colors.accent} />
      <Text style={{ color: colors.subtle, fontSize: 13, lineHeight: 19 }}>{label}</Text>
    </View>
  );
}

export function BodyText({ children }: React.PropsWithChildren) {
  useTheme();
  return <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>{children}</Text>;
}
