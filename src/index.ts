
import "dotenv/config";

import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dns from "node:dns";
import myUserRoute from "./routes/MyUserRoute";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log("Connected to database!"))
  .catch((error) => console.error("Database connection error:", error));

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req: Request, res: Response) => {
  res.send({ message: "health OK!" });
});

app.use("/api/my/user", myUserRoute);

app.listen(7000, () => {
  console.log("server started on localhost: 7000");
});
