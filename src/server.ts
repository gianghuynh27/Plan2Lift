import app from './app';

import dbConnect from './db/db-connect';
import emailService from './services/email.service';

import config from './config/config';
import logger from './logs/logger';

console.log('config =', config);
async function startServer(): Promise<void> {
  try {
    const connection = await dbConnect(config.mongoUri);

    if (!connection) {
      throw new Error('MongoDB connection failed');
    }

    await emailService.verifyConnection();
    logger.info('SMTP connection verified');

    const server = app.listen(config.port, () => {
      logger.info('HTTP server started', {
        port: config.port,
        appMode: config.appMode,
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received; closing server');

      server.close(async () => {
        await connection.disconnect();

        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Application failed to start', { error });
    process.exit(1);
  }
}

startServer();
// dbConnect(config.mongoUri).then(() => {
//   const server = app.listen(config.port, () => {
//     console.log(`Server is running on port ${config.port}`);
//   });

//   server.on('SIGINT', () => {
//     console.log('SIGINT received. Closing server...');
//   });
// });

// app.listen(5000, () => {
//   console.log('Server is running on port 5000');
// });

// // src/server.ts
// import express from 'express';
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// mongoose
//   .connect(process.env.DATABASE_URL as string)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Routes
// app.get("/", (_req, res) => {
//   res.send("API is running...");
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
