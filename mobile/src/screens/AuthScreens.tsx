import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Heading, Message, MobileHeader, Page } from '../components/UI';
import { api } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';
import { RootStackParamList } from '../navigation/navigationTypes';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
type RegisterProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
type RecoverPasswordProps = NativeStackScreenProps<RootStackParamList, 'RecoverPassword'>;
type ResetPasswordProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

interface RecoveryResponse {
  mensagem: string;
  token_desenvolvimento?: string;
}

interface ResetResponse {
  mensagem: string;
}

function recoveryError(error: unknown) {
  if (!axios.isAxiosError<{ error?: string; detalhes?: Array<{ mensagem: string }> }>(error)) {
    return getErrorMessage(error, 'Não foi possível solicitar a recuperação.');
  }
  return error.response?.data?.detalhes?.map((detail) => detail.mensagem).join('; ')
    || error.response?.data?.error
    || 'Não foi possível solicitar a recuperação.';
}

export function LoginScreen({ navigation }: LoginProps) {
  useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErrorMessage('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível entrar. Verifique sua conexão e seus dados.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <MobileHeader />
        <View style={styles.welcome}>
          <Heading title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar." />
        </View>
        <View style={[styles.segment, { backgroundColor: colors.muted }]}>
          <View style={[styles.segmentItem, styles.segmentActive, { backgroundColor: colors.surface }]}><Text style={[styles.segmentActiveText, { color: colors.text }]}>Entrar</Text></View>
          <Pressable onPress={() => navigation.navigate('Register')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, { color: colors.subtle }]}>Criar conta</Text>
          </Pressable>
        </View>
        <Card>
          {errorMessage ? <Message error>{errorMessage}</Message> : null}
          <Field
            label="E-MAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="SENHA"
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            secureTextEntry
            autoComplete="password"
          />
          <Button title="Entrar →" onPress={submit} busy={busy} disabled={!email.trim() || !password} />
          <Pressable onPress={() => navigation.navigate('RecoverPassword')} style={styles.link}>
            <Text style={[styles.linkStrong, { color: colors.text }]}>Esqueci minha senha</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.subtle }]}>Ainda não tem conta? <Text style={[styles.linkStrong, { color: colors.text }]}>Cadastre-se</Text></Text>
          </Pressable>
        </Card>
      </Page>
    </KeyboardAvoidingView>
  );
}

export function RecoverPasswordScreen({ navigation }: RecoverPasswordProps) {
  useTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [developmentToken, setDevelopmentToken] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMessage('');
    setErrorMessage('');
    setDevelopmentToken('');
    setBusy(true);
    try {
      const { data } = await api.post<RecoveryResponse>('/usuarios/recuperar-senha', { email: email.trim() });
      setMessage(data.token_desenvolvimento
        ? 'O envio de e-mail está desativado no modo local. Configure o SMTP no backend para receber o link por e-mail.'
        : data.mensagem);
      setDevelopmentToken(data.token_desenvolvimento ?? '');
    } catch (error) {
      setErrorMessage(recoveryError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <MobileHeader onBackPress={() => navigation.goBack()} />
        <Heading title="Recuperar senha" subtitle="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos as instruções para redefinir sua senha." />
        <Card>
          {message ? <Message>{message}</Message> : null}
          {errorMessage ? <Message error>{errorMessage}</Message> : null}
          {developmentToken ? (
            <Button
              title="Continuar para criar nova senha"
              onPress={() => navigation.navigate('ResetPassword', { token: developmentToken })}
            />
          ) : null}
          <Field
            label="E-MAIL"
            value={email}
            onChangeText={(value) => { setEmail(value); setErrorMessage(''); }}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Button title="Enviar instruções" onPress={submit} busy={busy} disabled={!email.trim()} />
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.subtle }]}>Lembrou sua senha? <Text style={[styles.linkStrong, { color: colors.text }]}>Voltar ao login</Text></Text>
          </Pressable>
        </Card>
      </Page>
    </KeyboardAvoidingView>
  );
}

export function ResetPasswordScreen({ navigation, route }: ResetPasswordProps) {
  useTheme();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMessage('');
    setErrorMessage('');
    if (password !== confirmation) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<ResetResponse>('/usuarios/redefinir-senha', {
        token: route.params.token,
        nova_senha: password,
      });
      setMessage(data.mensagem);
    } catch (error) {
      setErrorMessage(recoveryError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <MobileHeader onBackPress={() => navigation.goBack()} />
        <Heading title="Criar nova senha" subtitle="Escolha uma senha com pelo menos 8 caracteres." />
        <Card>
          {message ? <Message>{message}</Message> : null}
          {errorMessage ? <Message error>{errorMessage}</Message> : null}
          <Field label="NOVA SENHA" value={password} onChangeText={setPassword} placeholder="Mínimo de 8 caracteres" secureTextEntry autoComplete="new-password" />
          <Field label="CONFIRMAR NOVA SENHA" value={confirmation} onChangeText={setConfirmation} placeholder="Digite novamente" secureTextEntry autoComplete="new-password" />
          <Button title="Salvar nova senha" onPress={submit} busy={busy} disabled={password.length < 8 || !confirmation} />
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.subtle }]}>Voltar ao <Text style={[styles.linkStrong, { color: colors.text }]}>login</Text></Text>
          </Pressable>
        </Card>
      </Page>
    </KeyboardAvoidingView>
  );
}

export function RegisterScreen({ navigation }: RegisterProps) {
  useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErrorMessage('');
    setBusy(true);
    try {
      await register({
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        rua: street.trim() || undefined,
        bairro: neighborhood.trim() || undefined,
        cidade: city.trim() || undefined,
        estado: state.trim().toUpperCase() || undefined,
        aceitou_termos: true,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível criar sua conta.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <MobileHeader />
        <Heading title="Criar conta" subtitle="Informe seus dados para começar a explorar o LUME." />
        <View style={[styles.segment, { backgroundColor: colors.muted }]}>
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, { color: colors.subtle }]}>Entrar</Text>
          </Pressable>
          <View style={[styles.segmentItem, styles.segmentActive, { backgroundColor: colors.surface }]}><Text style={[styles.segmentActiveText, { color: colors.text }]}>Criar conta</Text></View>
        </View>
        <Card>
          {errorMessage ? <Message error>{errorMessage}</Message> : null}
          <Field label="NOME COMPLETO" value={name} onChangeText={setName} placeholder="Seu nome" autoComplete="name" />
          <Field
            label="E-MAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="SENHA (MÍNIMO 8 CARACTERES)"
            value={password}
            onChangeText={setPassword}
            placeholder="Crie uma senha"
            secureTextEntry
            autoComplete="new-password"
          />
          <Field label="RUA (OPCIONAL)" value={street} onChangeText={setStreet} placeholder="Rua" />
          <Field label="BAIRRO (OPCIONAL)" value={neighborhood} onChangeText={setNeighborhood} placeholder="Bairro" />
          <Field label="CIDADE (OPCIONAL)" value={city} onChangeText={setCity} placeholder="Cidade" />
          <Field
            label="ESTADO (SIGLA, OPCIONAL)"
            value={state}
            onChangeText={setState}
            placeholder="SP"
            autoCapitalize="characters"
            maxLength={2}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            onPress={() => setAcceptedTerms((current) => !current)}
            style={styles.termsRow}
          >
            <View style={[
              styles.checkbox,
              { borderColor: colors.border },
              acceptedTerms && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }],
            ]}>
              {acceptedTerms ? <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text> : null}
            </View>
            <Text style={[styles.termsText, { color: colors.subtle }]}>Li e aceito os termos de uso e a política de privacidade.</Text>
          </Pressable>
          <Button
            title="Criar minha conta"
            onPress={submit}
            busy={busy}
            disabled={name.trim().length < 2 || !email.trim() || password.length < 8 || !acceptedTerms}
          />
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.subtle }]}>Já tem uma conta? <Text style={[styles.linkStrong, { color: colors.text }]}>Entrar</Text></Text>
          </Pressable>
        </Card>
      </Page>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  welcome: { marginTop: 6 },
  segment: {
    flexDirection: 'row', gap: 4, padding: 4,
    borderRadius: 12,
  },
  segmentItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  segmentActive: { backgroundColor: colors.surface, elevation: 2 },
  segmentActiveText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  segmentText: { color: colors.subtle, fontSize: 13, fontWeight: '700' },
  link: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: colors.subtle, fontSize: 13 },
  linkStrong: { color: colors.text, fontWeight: '800' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  checkbox: {
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 6,
  },
  checkboxChecked: { backgroundColor: colors.text, borderColor: colors.text },
  checkmark: { color: colors.primary, fontWeight: '900' },
  termsText: { flex: 1, color: colors.subtle, fontSize: 12, lineHeight: 18 },
});
