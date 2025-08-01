import { Queue, Worker } from "bullmq";
import { sendEmail } from "../HospitalUtils/emailUtils/sendEmail.js";
import { connectRedis } from "../db/connectRedis.js";

// src/jobs/letter.queue.js

// Queue and worker variables (assigned later)
export let letterQueue;
let worker;

const QUEUE_NAME = "letter-queue";

export const initLetterQueue = async () => {
  const redis = await connectRedis();

  // Create the queue
  letterQueue = new Queue(QUEUE_NAME, {
    connection: redis,
  });

  // Create the worker
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { to, subject, html, attachments, name } = job.data;

      console.log(`📬 Processing job ${job.id} for ${to}...`);

      try {
        await sendEmail({ to, subject, html, attachments });
        console.log(`✅ Email sent to ${to}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${to}: ${error.message}`);
        throw error;
      }
    },
    {
      connection: redis,
    }
  );

  // Event logging
  worker.on("completed", (job) => {
    console.log(`✅ Letter job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.log(`❌ Letter job ${job.id} failed: ${err.message}`);
  });

  console.log("📨 Letter Queue and Worker initialized");
};
