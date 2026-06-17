import express from "express";
import cors from "cors";
import { config } from "./config";
import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error";
import healthRouter from "./routes/health";
import chatRouter from "./routes/chat";

const app = express();

app.use(requestId);
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

app.use(healthRouter);
app.use(chatRouter);

app.use(errorHandler);

export default app;
