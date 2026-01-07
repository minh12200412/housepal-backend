import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { initCronJob } from './cronJob.js';

const app = createApp();

initCronJob();

app.listen(config.port, () => {
  console.log(`HousePal API is running at http://localhost:${config.port}`);
});
