import cors from "cors";
import express from "express";
import generateRouter from "./routes/generate";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", generateRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`workout-generator backend listening on port ${port}`);
});
