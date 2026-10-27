import { createServer } from 'node:http';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 4000);
const yoga = createApp();

createServer(yoga).listen(port, () => {
  console.log(`Thicket API ready at http://localhost:${port}${yoga.graphqlEndpoint}`);
});
