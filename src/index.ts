import express from "express";
import cors from "cors";
import morgan from "morgan";

import gatoRoutes from "./routes/gatoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { CORS_ORIGINS } from "./config.js";

const app = express();

app.use(express.json());

app.use(cors({
  origin(origin, callback) {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }
}));

app.use(morgan("dev"));

app.use(express.static("public", {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-store");
  }
}));

// Rotas de autenticação
app.use(authRoutes);

// Rotas de gatos
app.use(gatoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});