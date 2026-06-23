const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

const dotenv = require('dotenv');
dotenv.config()


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;


const port = process.env.PORT


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db('paws-nest');
        const petCollection = db.collection('pets')
        const adaptedPetCollection = db.collection('adapted-pets')

        app.get('/pet', async (req, res) => {
            const result = await petCollection.find().toArray();
            res.send(result)
        })

        app.get('/pet/:id', async (req, res) => {
            const { id } = req.params;
            const result = await petCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.patch('/pet/:id', async (req, res) => {
            const {id} = req.params;
            const updatedPetData = req.body;
            const result = await petCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: updatedPetData}
            )
            res.send(result)
        })

        app.delete('/pet/:id', async (req, res) => {
            const {id} = req.params;
            const result = await petCollection.deleteOne({_id: new ObjectId(id)})
            res.send(result)
        })

        app.get('/pet/email/:email', async (req, res) => {
            const { email } = req.params;
            const result = await petCollection.find({ ownerEmail: email }).toArray()
            res.send(result)
        })

        app.post('/pet', async (req, res) => {
            const newPetData = req.body;
            const result = await petCollection.insertOne(newPetData);
            res.send(result)
        })

        app.post('/adapted-pet', async (req, res) => {
            const newAdaptedPetData = req.body;
            const result = await adaptedPetCollection.insertOne(newAdaptedPetData);
            res.send(result)
        })

        app.get('/adapted-pet', async (req, res) => {
            const result = await adaptedPetCollection.find().toArray();
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("server is running fine")
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})