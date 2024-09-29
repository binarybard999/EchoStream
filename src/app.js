import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

app.use(
    express.json({
        limit: "5mb",
    })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);

// Serve static files from the 'public' folder
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

// routes middleware
app.use("/api/v1/users", userRouter);
app.use('/api/videos', videoRouter);

export { app };
