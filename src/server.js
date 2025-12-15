import { createApp } from "./app.js";
import { config } from "./config/env.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`HousePal API is running at http://localhost:${config.port}`);
});
