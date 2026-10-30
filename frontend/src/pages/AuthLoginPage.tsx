import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import lumeLogo from '../assets/lume-logo.png';

export const AuthLoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setBusy(true);
    try {
      await login(email.trim(), senha, false);
      navigate('/faculdades');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível entrar. Verifique seus dados.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setBusy(true);
    try {
      await registerUser({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        rua: rua.trim() || undefined,
        bairro: bairro.trim() || undefined,
        cidade: cidade.trim() || undefined,
        estado: estado.trim().toUpperCase() || undefined,
        aceitou_termos: aceitouTermos,
      });
      navigate('/faculdades');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível criar sua conta.');
    } finally {
      setBusy(false);
    }
  };

  const changeForm = (registering: boolean) => {
    setIsRegistering(registering);
    setErrorMessage('');
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <header className="auth-brand">
          <img src={lumeLogo} alt="LUME — GPS de Carreira" />
          <span>Seu próximo passo começa aqui</span>
        </header>

        <div className="auth-heading">
          <span className="auth-eyebrow">{isRegistering ? 'NOVO CADASTRO' : 'ACESSO DO ESTUDANTE'}</span>
          <h1 id="auth-title">{isRegistering ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
          <p>{isRegistering
            ? 'Informe seus dados para começar a explorar o LUME.'
            : 'Acesse sua conta para continuar sua jornada.'}</p>
        </div>

        <div className="auth-segment" role="tablist" aria-label="Acesso à conta">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegistering}
            className={!isRegistering ? 'is-active' : ''}
            onClick={() => changeForm(false)}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegistering}
            className={isRegistering ? 'is-active' : ''}
            onClick={() => changeForm(true)}
          >
            Criar conta
          </button>
        </div>

        {errorMessage && <div role="alert" className="auth-error">{errorMessage}</div>}

        {!isRegistering ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={event => setSenha(event.target.value)}
                required
              />
            </label>
            <button type="button" className="auth-text-button auth-forgot" onClick={() => navigate('/recuperar-senha')}>
              Esqueci minha senha
            </button>
            <button type="submit" className="auth-submit" disabled={busy || !email.trim() || !senha}>
              {busy ? 'Entrando...' : 'Entrar'}
            </button>
            <p className="auth-switch-prompt">
              Ainda não tem uma conta?{' '}
              <button type="button" className="auth-text-button" onClick={() => changeForm(true)}>Cadastre-se</button>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              <span>Nome completo</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                value={nome}
                onChange={event => setNome(event.target.value)}
                minLength={2}
                required
              />
            </label>
            <label>
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Senha (mínimo de 8 caracteres)</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Crie uma senha"
                value={senha}
                onChange={event => setSenha(event.target.value)}
                minLength={8}
                required
              />
            </label>
            <div className="auth-form-grid">
              <label>
                <span>Rua (opcional)</span>
                <input autoComplete="street-address" placeholder="Rua" value={rua} onChange={event => setRua(event.target.value)} />
              </label>
              <label>
                <span>Bairro (opcional)</span>
                <input autoComplete="address-level3" placeholder="Bairro" value={bairro} onChange={event => setBairro(event.target.value)} />
              </label>
            </div>
            <div className="auth-form-grid auth-form-grid--city">
              <label>
                <span>Cidade (opcional)</span>
                <input autoComplete="address-level2" placeholder="Cidade" value={cidade} onChange={event => setCidade(event.target.value)} />
              </label>
              <label>
                <span>Estado (opcional)</span>
                <input
                  autoComplete="address-level1"
                  placeholder="UF"
                  value={estado}
                  onChange={event => setEstado(event.target.value.toUpperCase())}
                  maxLength={2}
                />
              </label>
            </div>
            <label className="auth-terms">
              <input type="checkbox" checked={aceitouTermos} onChange={event => setAceitouTermos(event.target.checked)} required />
              <span>Li e aceito os termos de uso e a política de privacidade.</span>
            </label>
            <button type="submit" className="auth-submit" disabled={busy || nome.trim().length < 2 || !email.trim() || senha.length < 8 || !aceitouTermos}>
              {busy ? 'Criando conta...' : 'Criar minha conta'}
            </button>
            <p className="auth-switch-prompt">
              Já tem uma conta?{' '}
              <button type="button" className="auth-text-button" onClick={() => changeForm(false)}>Entrar</button>
            </p>
          </form>
        )}

        <button type="button" className="auth-admin-link" onClick={() => navigate('/admin/login')}>
          🔒 Portal do administrador
        </button>
      </section>
    </main>
  );
};
