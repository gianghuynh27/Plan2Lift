import app from './app';
import dbConnect from './db/db-connect';

import config from './config/config';

dbConnect(config.mongoUri).then(() => {
  const server = app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });

  server.on('SIGINT', () => {
    console.log('SIGINT received. Closing server...');
  });
});

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
