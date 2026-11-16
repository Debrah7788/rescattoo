import express from "express";
import cors from "cors";
import morgan from "morgan";
import gatoRoutes from "./routes/gatoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import imagemRoutes from "./routes/imagemRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { CORS_ORIGINS } from "./config.js";
import { UPLOADS_DIR } from "./middlewares/uploadMiddleware.js";
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
app.use("/uploads", express.static(UPLOADS_DIR, {
    fallthrough: false,
    setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-store");
    }
}));
app.use(authRoutes);
app.use(imagemRoutes);
app.use(gatoRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
