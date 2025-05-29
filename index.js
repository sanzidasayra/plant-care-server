// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://plant-care-client-ochre.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ─── MongoDB Client Setup ─────────────────────────────────────────────────────
const uri =
  `mongodb+srv://${process.env.USER}:${process.env.PASS}` +
  `@cluster0.vdaznfz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // 1) Connect to Mongo
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    // 2) Grab your collections
    const plantsCollection = client.db("plantDB").collection("plants");
    const usersCollection = client.db("plantDB").collection("users");

    // ─── Routes ────────────────────────────────────────────────────────────────

    // List plants (optionally filtered by ?email=…)
    app.get("/plants", async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      const plants = await plantsCollection.find(query).toArray();
      res.send(plants);
    });

    // Create a new plant
    app.post("/plants", async (req, res) => {
      const newPlant = req.body;
      const result = await plantsCollection.insertOne(newPlant);
      res.send(result);
    });

    // Get the 6 most-recently-added plants
    app.get("/plants/new", async (req, res) => {
      try {
        const latest = await plantsCollection
          .find()
          .sort({ _id: -1 })
          .limit(6)
          .toArray();
        res.send(latest);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch new plants" });
      }
    });

    // Delete a plant by ID
    app.delete("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const result = await plantsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      console.log("Delete result:", result);
      res.send(result);
    });

    // Create a new user
    app.post("/users", async (req, res) => {
      const userProfile = req.body;
      const { acknowledged, insertedId } = await usersCollection.insertOne(
        userProfile
      );
      if (!acknowledged) {
        return res.status(500).send({ error: "Failed to create user" });
      }
      userProfile._id = insertedId;
      res.send(userProfile);
    });

    // Get a user by ?email=…
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.send([]);
      const user = await usersCollection.findOne({ email });
      res.send(user || []);
    });

    // Update a plant by ID
    app.put("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      const result = await plantsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
      );
      res.send(result);
    });

    // Optional health-check root
    app.get("/", (req, res) => {
      res.send("🌱 Plant care tracker server is running!");
    });

    // 3) Start listening **only after** all routes are in place
    app.listen(port, () => {
      console.log(`🚀 Server is live on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

run().catch(console.dir);
