import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import lumeLogo from '../assets/lume-logo.png';

export const AuthLoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [nome, setNome] = useState('');
  const [rua, setRua] = useState('Rua das Flores');
  const [bairro, setBairro] = useState('Centro');
  const [cidade, setCidade] = useState('São Paulo');
  const [estado, setEstado] = useState('SP');
  const [aceitouTermos, setAceitouTermos] = useState(true);

  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login(email, senha, false);
      navigate('/faculdades');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login. Verifique seus dados.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await registerUser({
        nome,
        email,
        senha,
        rua,
        bairro,
        cidade,
        estado: estado.trim().toUpperCase(),
        latitude: -23.5505,
        longitude: -46.6333,
        aceitou_termos: aceitouTermos
      });
      navigate('/faculdades');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <div className="auth-shell" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <div className="auth-showcase" style={{ width: '440px', background: 'linear-gradient(135deg, #EDEB80 0%, #E0DC5A 100%)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <img src={lumeLogo} alt="LUME — GPS de Carreira" style={{ width: '150px', height: '120px', objectFit: 'contain' }} />
          </div>
          <span style={{ background: 'rgba(28,28,46,0.1)', padding: '6px 14px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>GUIA UNIVERSITÁRIO</span>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '24px', lineHeight: '1.2', color: '#1C1C2E' }}>
            {isRegistering ? 'Crie sua conta no LUME' : 'Encontre a faculdade ideal para o seu futuro'}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['Busca por geolocalização', 'Trilhas de Carreiras', 'Comparador de Cursos', 'Quiz Vocacional'].map((item, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.35)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '13px' }}>
              ✓ {item}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-content" style={{ flex: 1, background: '#F1F0F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {errorMessage && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleLogin}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#7B7B96' }}>ACESSO DO ESTUDANTE</span>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1C1C2E', marginTop: '4px', marginBottom: '24px' }}>Acesse sua conta</h2>

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96' }}>E-MAIL</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', height: '48px', borderRadius: '10px', border: '2px solid #E0DFF0', padding: '0 16px', margin: '6px 0 16px 0', background: '#FFF' }} />

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7B7B96' }}>SENHA</label>
              <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: '100%', height: '48px', borderRadius: '10px', border: '2px solid #E0DFF0', padding: '0 16px', margin: '6px 0 24px 0', background: '#FFF' }} />

              <div style={{ textAlign: 'right', marginTop: '-16px', marginBottom: '18px', fontSize: '13px' }}>
                <button type="button" onClick={() => navigate('/recuperar-senha')} style={{ background: 'none', border: 0, padding: 0, color: '#1C1C2E', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
                  Esqueci ou quero trocar minha senha
                </button>
              </div>

              <button type="submit" style={{ width: '100%', height: '52px', borderRadius: '10px', background: '#EDEB80', color: '#1C1C2E', fontWeight: 'bold', fontSize: '14px' }}>Entrar →</button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#7B7B96' }}>
                Ainda não tem conta? <button type="button" onClick={() => { setIsRegistering(true); setErrorMessage(''); }} style={{ background: 'none', color: '#1C1C2E', padding: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Cadastre-se</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#7B7B96' }}>NOVO CADASTRO</span>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1C1C2E', marginTop: '4px', marginBottom: '20px' }}>Criar nova conta</h2>

              <input type="text" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '12px', background: '#FFF' }} />
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '12px', background: '#FFF' }} />
              <input type="password" placeholder="Senha (mínimo 8 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} required style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '12px', background: '#FFF' }} />

              <div className="auth-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} required style={{ height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '12px', background: '#FFF' }} />
                <input type="text" placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} required style={{ height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '12px', background: '#FFF' }} />
              </div>

              <div className="auth-form-grid auth-form-grid--city" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} required style={{ height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '16px', background: '#FFF' }} />
                <input type="text" placeholder="UF" value={estado} maxLength={2} onChange={(e) => setEstado(e.target.value.toUpperCase())} required style={{ height: '44px', borderRadius: '8px', border: '1px solid #E0DFF0', padding: '0 14px', marginBottom: '16px', background: '#FFF' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#7B7B96', marginBottom: '20px', cursor: 'pointer' }}>
                <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} required />
                Aceito os termos de uso e política de privacidade
              </label>

              <button type="submit" style={{ width: '100%', height: '52px', borderRadius: '10px', background: '#EDEB80', color: '#1C1C2E', fontWeight: 'bold', fontSize: '14px' }}>Cadastrar e Entrar →</button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#7B7B96' }}>
                Já possui conta? <button type="button" onClick={() => { setIsRegistering(false); setErrorMessage(''); }} style={{ background: 'none', color: '#1C1C2E', padding: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Fazer Login</button>
              </div>
            </form>
          )}

          <button type="button" onClick={() => navigate('/admin/login')} style={{ width: '100%', marginTop: '28px', background: '#FFF', border: '1px solid #E0DFF0', padding: '14px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', color: '#1C1C2E' }}>
            🔒 Portal do Administrador
          </button>
        </div>
      </div>
    </div>
  );
};