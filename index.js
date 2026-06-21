const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

const dotenv = require('dotenv');
dotenv.config()


const { MongoClient, ServerApiVersion } = require("mongodb");
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

        app.post('/pet', async (req, res) => {
            const newPetData = req.body;
            const result = await petCollection.insertOne(newPetData);
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