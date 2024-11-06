import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app, httpServer } from "./app.js";
import { initializeSocket } from "./utils/socket.js";

dotenv.config({
    path: ".env",
});

// console.log(process.env.PORT);
connectDB()
    .then(() => {
        let port = process.env.PORT || 8000;

        // Initialize socket.io and attach it to the HTTP server
        initializeSocket(httpServer);

        // Start the HTTP server
        httpServer.listen(port, () => {
            console.log(`Server is running at port: ${port}`);
        });
    })
    .catch((err) => {
        console.log("MONGO DB connection failed!!", err);
    });
