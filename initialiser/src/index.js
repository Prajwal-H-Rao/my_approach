import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import { copyS3Folder } from "./aws.js";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/project", async (req, res) => {
  const { replId, language } = req.body;

  if (!replId) {
    res.status(400).send("Bad request");
    return;
  }

  await copyS3Folder(`base/${language}`, `code/${replId}`);
  res.send("Project Created");
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Listening on *:${port}`);
});
