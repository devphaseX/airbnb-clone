import { createAppServer, getEnv, createConfig } from './server/';

async function startServer() {
  const env = getEnv();
  await createConfig({ env });
  const app = createAppServer();

  const port = env.SERVER_PORT ?? 5001;
  await new Promise<void>((res) => {
    app.listen(port, () => {
      res();
    });
  });

  console.log(`server is running on port ${port}`);
}

startServer();
