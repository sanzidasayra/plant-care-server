const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

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
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const plantsCollection = client.db("plantDB").collection("plants");
    const usersCollection = client.db("plantDB").collection("users");


    app.get("/plants", async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      const plants = await plantsCollection.find(query).toArray();
      res.send(plants);
    });

    app.post("/plants", async (req, res) => {
      const newPlant = req.body;
      const result = await plantsCollection.insertOne(newPlant);
      res.send(result);
    });

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

    app.delete("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const result = await plantsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      console.log("Delete result:", result);
      res.send(result);
    });

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

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.send([]);
      const user = await usersCollection.findOne({ email });
      res.send(user || []);
    });

    app.put("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      const result = await plantsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updated }
      );
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("🌱 Plant care tracker server is running!");
    });

    app.listen(port, () => {
      console.log(`🚀 Server is live on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

run().catch(console.dir);
