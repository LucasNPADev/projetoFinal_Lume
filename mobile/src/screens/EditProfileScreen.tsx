import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Heading, Message, MobileHeader, Page } from '../components/UI';
import { RootStackParamList } from '../navigation/navigationTypes';
import { api, ApiUser } from '../services/api';
import { getErrorMessage } from '../services/errors';
import { colors, useTheme } from '../theme';

type EditableProfile = Pick<ApiUser, 'nome' | 'email' | 'rua' | 'bairro' | 'cidade' | 'estado'>;

const emptyProfile: EditableProfile = {
  nome: '',
  email: '',
  rua: '',
  bairro: '',
  cidade: '',
  estado: '',
};

function normalized(value: string | null | undefined) {
  return value?.trim() ?? '';
}

export function EditProfileScreen() {
  useTheme();
  const { updateUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<EditableProfile>(emptyProfile);
  const [original, setOriginal] = useState<EditableProfile>(emptyProfile);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<ApiUser>('/usuarios/me')
      .then(async ({ data }) => {
        const next: EditableProfile = {
          nome: data.nome ?? '',
          email: data.email ?? '',
          rua: data.rua ?? '',
          bairro: data.bairro ?? '',
          cidade: data.cidade ?? '',
          estado: data.estado ?? '',
        };
        if (!active) return;
        setProfile(next);
        setOriginal(next);
        await updateUser(data);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar seus dados.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [updateUser]);

  const setField = (field: keyof EditableProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const save = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    let personalDataSaved = false;
    try {
      const personalChanges: { nome?: string; email?: string } = {};
      if (normalized(profile.nome) !== normalized(original.nome)) personalChanges.nome = profile.nome.trim();
      if (normalized(profile.email).toLowerCase() !== normalized(original.email).toLowerCase()) {
        personalChanges.email = profile.email.trim();
      }

      const addressChanges: Record<string, string | null> = {};
      (['rua', 'bairro', 'cidade', 'estado'] as const).forEach((field) => {
        const fieldValue = (profile[field] ?? '').trim();
        const currentValue = field === 'estado' ? fieldValue.toUpperCase() : fieldValue;
        if (normalized(currentValue) !== normalized(original[field])) addressChanges[field] = currentValue || null;
      });

      if (!Object.keys(personalChanges).length && !Object.keys(addressChanges).length) {
        setSuccessMessage('Seus dados já estão atualizados.');
        return;
      }

      let updatedUser: ApiUser | undefined;
      if (Object.keys(personalChanges).length) {
        const response = await api.patch<ApiUser>('/usuarios/me', personalChanges);
        updatedUser = response.data;
        await updateUser(response.data);
        personalDataSaved = true;
      }

      if (Object.keys(addressChanges).length) {
        const response = await api.put<ApiUser>('/usuarios/me/localizacao', addressChanges);
        updatedUser = response.data;
        await updateUser(response.data);
      }

      if (!updatedUser) {
        const response = await api.get<ApiUser>('/usuarios/me');
        updatedUser = response.data;
        await updateUser(response.data);
      }

      const next: EditableProfile = {
        nome: updatedUser.nome ?? '',
        email: updatedUser.email ?? '',
        rua: updatedUser.rua ?? '',
        bairro: updatedUser.bairro ?? '',
        cidade: updatedUser.cidade ?? '',
        estado: updatedUser.estado ?? '',
      };
      setProfile(next);
      setOriginal(next);
      setSuccessMessage('Cadastro atualizado com sucesso.');
    } catch (error) {
      const detail = getErrorMessage(error, 'Não foi possível salvar as alterações.');
      setErrorMessage(
        personalDataSaved
          ? `Nome/e-mail foram salvos, mas o endereço não foi atualizado. ${detail}`
          : detail,
      );
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (Object.keys(profile) as Array<keyof EditableProfile>).some((field) =>
    normalized(profile[field]) !== normalized(original[field]),
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <MobileHeader onBackPress={() => navigation.goBack()} />
        <Heading title="Editar cadastro" subtitle="Mantenha seus dados atualizados para receber recomendações mais relevantes." />
        {errorMessage ? <Message error>{errorMessage}</Message> : null}
        {successMessage ? <Message>{successMessage}</Message> : null}
        {loading ? <Text style={{ color: colors.subtle }}>Carregando seus dados...</Text> : null}
        <Card>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Informações pessoais</Text>
          <Field label="NOME COMPLETO" value={profile.nome} onChangeText={(value) => setField('nome', value)} placeholder="Seu nome" autoComplete="name" />
          <Field
            label="E-MAIL"
            value={profile.email}
            onChangeText={(value) => setField('email', value)}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>
            Se você alterar o e-mail, use o novo endereço no próximo acesso.
          </Text>
        </Card>
        <Card>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>Endereço</Text>
          <Text style={{ color: colors.subtle, fontSize: 12, lineHeight: 18 }}>
            Usamos sua região para ordenar instituições e cursos. Não é necessário compartilhar sua localização GPS.
          </Text>
          <Field label="RUA" value={profile.rua ?? ''} onChangeText={(value) => setField('rua', value)} placeholder="Rua e número" autoComplete="street-address" />
          <Field label="BAIRRO" value={profile.bairro ?? ''} onChangeText={(value) => setField('bairro', value)} placeholder="Bairro" />
          <Field label="CIDADE" value={profile.cidade ?? ''} onChangeText={(value) => setField('cidade', value)} placeholder="Cidade" />
          <Field
            label="ESTADO"
            value={profile.estado ?? ''}
            onChangeText={(value) => setField('estado', value)}
            placeholder="UF"
            autoCapitalize="characters"
            maxLength={2}
          />
        </Card>
        <Button
          title="Salvar alterações"
          onPress={() => void save()}
          disabled={loading || !hasChanges}
          busy={saving}
        />
      </Page>
    </KeyboardAvoidingView>
  );
}
