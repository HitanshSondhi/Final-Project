import Redis from "ioredis";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { connectRedis } from "./db/connectRedis.js";
import { agenda } from "./jobs/agenda.js";
import { initLetterQueue } from "./jobs/letter.queue.js";

await initLetterQueue();

dotenv.config({
    path: './.env' // Correct path to your .env file
});



const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await agenda.start();
   


    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });

    app.on("error", (err) => {
      console.error("❌ Server error:", err);
    });

  } catch (error) {
    console.error("❌ Startup failed:", error);
  }
};

startServer();
