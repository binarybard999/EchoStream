import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "\.env"
})

// console.log(process.env.PORT);
connectDB()
.then(() => {
    let port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`Server is running at port: ${port}`)
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed!!", err);
})
