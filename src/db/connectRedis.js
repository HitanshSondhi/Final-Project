import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redis = null;

const connectRedis = async () => {
  try {
    redis = new Redis({
      host: "redis-14406.c301.ap-south-1-1.ec2.redns.redis-cloud.com",
      port: 14406,
      password: "dO7dZ1PyF67DEUvlAbNtncY4HxE2mShU",
      
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    redis.on("error", (err) => {
      console.error("❌ Redis Client Error:", err);
    });

    // Optional: test ping
    await redis.ping();

    return redis;
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    process.exit(1);
  }
};

export { connectRedis, redis };
