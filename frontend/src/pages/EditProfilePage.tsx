import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { User } from '../types';

interface ProfileRecord {
  id_usuario: string;
  nome: string;
  email: string;
  perfil: User['perfil'];
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

interface ProfileForm {
  nome: string;
  email: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const emptyForm: ProfileForm = {
  nome: '',
  email: '',
  rua: '',
  bairro: '',
  cidade: '',
  estado: '',
};

function messageFromError(error: unknown) {
  if (!axios.isAxiosError<{ error?: string; message?: string; detalhes?: Array<{ mensagem: string }> }>(error)) {
    return error instanceof Error ? error.message : 'Não foi possível salvar suas informações.';
  }
  const data = error.response?.data;
  return data?.detalhes?.map((detail) => detail.mensagem).join('; ')
    || data?.error
    || data?.message
    || 'Não foi possível salvar suas informações.';
}

function value(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function toUser(profile: ProfileRecord): User {
  return {
    id: profile.id_usuario,
    nome: profile.nome,
    email: profile.email,
    perfil: profile.perfil,
    rua: profile.rua ?? undefined,
    bairro: profile.bairro ?? undefined,
    cidade: profile.cidade ?? undefined,
    estado: profile.estado ?? undefined,
  };
}

export const EditProfilePage: React.FC = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [initial, setInitial] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get<ProfileRecord>('/usuarios/me')
      .then(({ data }) => {
        const next: ProfileForm = {
          nome: data.nome ?? '',
          email: data.email ?? '',
          rua: data.rua ?? '',
          bairro: data.bairro ?? '',
          cidade: data.cidade ?? '',
          estado: data.estado ?? '',
        };
        if (!active) return;
        setForm(next);
        setInitial(next);
        updateUser(toUser(data));
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(messageFromError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [updateUser]);

  const setField = (field: keyof ProfileForm, nextValue: string) => {
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    let personalDataSaved = false;
    try {
      const personalChanges: { nome?: string; email?: string } = {};
      if (value(form.nome) !== value(initial.nome)) personalChanges.nome = form.nome.trim();
      if (value(form.email).toLowerCase() !== value(initial.email).toLowerCase()) personalChanges.email = form.email.trim();

      const addressChanges: Record<string, string | null> = {};
      (['rua', 'bairro', 'cidade', 'estado'] as const).forEach((field) => {
        const next = field === 'estado' ? form[field].trim().toUpperCase() : form[field].trim();
        if (value(next) !== value(initial[field])) addressChanges[field] = next || null;
      });

      if (!Object.keys(personalChanges).length && !Object.keys(addressChanges).length) {
        setSuccessMessage('Seus dados já estão atualizados.');
        return;
      }

      let updated: ProfileRecord | undefined;
      if (Object.keys(personalChanges).length) {
        const response = await api.patch<ProfileRecord>('/usuarios/me', personalChanges);
        updated = response.data;
        updateUser(toUser(response.data));
        personalDataSaved = true;
      }
      if (Object.keys(addressChanges).length) {
        const response = await api.put<ProfileRecord>('/usuarios/me/localizacao', addressChanges);
        updated = response.data;
        updateUser(toUser(response.data));
      }
      if (!updated) {
        const response = await api.get<ProfileRecord>('/usuarios/me');
        updated = response.data;
        updateUser(toUser(response.data));
      }
      if (!updated) throw new Error('Não foi possível recuperar os dados atualizados.');
      const next: ProfileForm = {
        nome: updated.nome ?? '',
        email: updated.email ?? '',
        rua: updated.rua ?? '',
        bairro: updated.bairro ?? '',
        cidade: updated.cidade ?? '',
        estado: updated.estado ?? '',
      };
      setForm(next);
      setInitial(next);
      setSuccessMessage('Cadastro atualizado com sucesso.');
    } catch (error) {
      const detail = messageFromError(error);
      setErrorMessage(personalDataSaved
        ? `Nome/e-mail foram salvos, mas o endereço não foi atualizado. ${detail}`
        : detail);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (Object.keys(form) as Array<keyof ProfileForm>)
    .some((field) => value(form[field]) !== value(initial[field]));

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '46px',
    padding: '0 14px',
    border: '1px solid #E0DFF0',
    borderRadius: '9px',
    background: '#FFFFFF',
    color: '#1C1C2E',
    fontSize: '14px',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    color: '#7B7B96',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F1F0F7' }}>
      <header style={{ background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '26px 48px' }}>
        <button type="button" onClick={() => navigate('/perfil')} style={{ background: 'transparent', color: '#1C1C2E', fontWeight: 800 }}>
          ← Voltar ao perfil
        </button>
      </header>
      <main style={{ width: 'min(100% - 40px, 760px)', margin: '0 auto', padding: '32px 0 56px' }}>
        <h1 style={{ color: '#1C1C2E', fontSize: '28px', marginBottom: '8px' }}>Editar cadastro</h1>
        <p style={{ color: '#7B7B96', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Mantenha seus dados atualizados para receber recomendações mais relevantes.
        </p>
        {errorMessage ? <div role="alert" style={{ marginBottom: '16px', padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '10px' }}>{errorMessage}</div> : null}
        {successMessage ? <div role="status" style={{ marginBottom: '16px', padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: '10px' }}>{successMessage}</div> : null}
        {loading ? <p role="status" style={{ color: '#7B7B96' }}>Carregando seus dados...</p> : (
          <form onSubmit={save} style={{ display: 'grid', gap: '18px' }}>
            <section style={{ display: 'grid', gap: '16px', padding: '24px', background: '#FFFFFF', border: '1px solid #E0DFF0', borderRadius: '14px' }}>
              <h2 style={{ color: '#1C1C2E', fontSize: '17px' }}>Informações pessoais</h2>
              <label style={labelStyle}>NOME COMPLETO
                <input style={inputStyle} value={form.nome} onChange={(event) => setField('nome', event.target.value)} required minLength={2} maxLength={150} />
              </label>
              <label style={labelStyle}>E-MAIL
                <input style={inputStyle} type="email" autoComplete="email" value={form.email} onChange={(event) => setField('email', event.target.value)} required maxLength={255} />
              </label>
              <p style={{ color: '#7B7B96', fontSize: '12px', lineHeight: 1.5 }}>Se alterar o e-mail, use o novo endereço no próximo acesso.</p>
            </section>
            <section style={{ display: 'grid', gap: '16px', padding: '24px', background: '#FFFFFF', border: '1px solid #E0DFF0', borderRadius: '14px' }}>
              <h2 style={{ color: '#1C1C2E', fontSize: '17px' }}>Endereço</h2>
              <p style={{ color: '#7B7B96', fontSize: '12px', lineHeight: 1.5 }}>Usamos sua região para ordenar instituições e cursos. Não é necessário compartilhar sua localização GPS.</p>
              <label style={labelStyle}>RUA
                <input style={inputStyle} value={form.rua} onChange={(event) => setField('rua', event.target.value)} maxLength={200} />
              </label>
              <label style={labelStyle}>BAIRRO
                <input style={inputStyle} value={form.bairro} onChange={(event) => setField('bairro', event.target.value)} maxLength={100} />
              </label>
              <label style={labelStyle}>CIDADE
                <input style={inputStyle} value={form.cidade} onChange={(event) => setField('cidade', event.target.value)} maxLength={100} />
              </label>
              <label style={labelStyle}>ESTADO (UF)
                <input style={inputStyle} value={form.estado} onChange={(event) => setField('estado', event.target.value.toUpperCase())} maxLength={2} />
              </label>
            </section>
            <button type="submit" disabled={saving || !hasChanges} style={{ minHeight: '50px', padding: '0 18px', borderRadius: '10px', background: '#1C1C2E', color: '#EDEB80', fontWeight: 800, opacity: saving || !hasChanges ? 0.6 : 1 }}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
