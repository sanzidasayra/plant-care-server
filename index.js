// server.js
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
      "https://plant-care-client-ochre.vercel.app/",
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
    console.log("Connected to MongoDB!");

    const plantsCollection = client.db("plantDB").collection("plants");
    const usersCollection = client.db("plantDB").collection("users");

    app.get("/plants", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { userEmail: email };
      }
      const result = await plantsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/plants", async (req, res) => {
      const newPlant = req.body;
      const result = await plantsCollection.insertOne(newPlant);
      res.send(result);
    });

    app.get("/plants/new", async (req, res) => {
      try {
        const result = await plantsCollection
          .find()
          .sort({ _id: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to fetch new plants" });
      }
    });

    app.delete("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantsCollection.deleteOne(query);
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
      if (!email) {
        return res.send([]);
      }

      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.send([]);
      }

      res.send(user);
    });

    app.put("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const updatedPlant = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: updatedPlant };

      const result = await plantsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Plant care tracker server is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
