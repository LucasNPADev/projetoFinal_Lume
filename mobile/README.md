# LUME Mobile

Aplicativo móvel da POC do LUME — GPS de Carreira.

## Tecnologia

- React Native
- Expo
- TypeScript
- Axios
- React Navigation

A documentação original define React + TypeScript e o produto como aplicação web e móvel, mas não determina o framework específico do mobile. React Native + Expo foi adotado como implementação dessa camada.

## Execução

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

### Android Emulator

O valor padrão da API é:

`http://10.0.2.2:3333/api`

Esse endereço permite que o emulador Android acesse o backend local do computador.

### Dispositivo físico

Altere `EXPO_PUBLIC_API_URL` para o IP da máquina na rede local, por exemplo:

`http://192.168.0.10:3333/api`

## Módulos da POC

- início;
- carreiras;
- cursos;
- instituições;
- teste vocacional;
- autenticação/perfil.

O mobile utiliza a mesma API REST e o mesmo PostgreSQL consumidos pelo frontend web.
