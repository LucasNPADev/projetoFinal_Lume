import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`LUME API rodando na porta ${env.PORT}`);
});
