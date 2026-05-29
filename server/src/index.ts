import "dotenv/config";
import app from "./app.js";
import { logger } from "./utils/logger.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
