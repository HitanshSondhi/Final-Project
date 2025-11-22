import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redis = null;

const connectRedis = async () => {
  try {
    redis = new Redis({
      host: "redis-15248.c99.us-east-1-4.ec2.cloud.redislabs.com", // ❌ removed :15248
      port: 15248,
      password: "8y2OTJ7mfY1QoLyfpstcPQ3Lwk9u5BZY",
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
       // IMPORTANT for Redis Cloud
    });

    redis.on("connect", () => {
      console.log(" Redis connected successfully");
    });

    redis.on("error", (err) => {
      console.error(" Redis Client Error:", err);
    });


    await redis.ping();

    return redis;
  } catch (error) {
    console.error(" Redis connection failed:", error);
    process.exit(1);
  }
};

export { connectRedis, redis };
