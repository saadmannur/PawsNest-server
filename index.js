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
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;


const port = process.env.PORT


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

// middleware function
const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
        return res.status(401).send({ message: "Unauthorized" })
    }
    
    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload); //check
        next()
    }
    catch (error) {
        res.status(403).send({ message: "Forbidden" })
    }
}

async function run() {
    try {
        // await client.connect();

        const db = client.db('paws-nest');
        const petCollection = db.collection('pets')
        const adaptedPetCollection = db.collection('adapted-pets')

        //all-pets get api and implement searching and filtering
        app.get('/pet', async (req, res) => {
            const { search, species } = req.query;
            const query = {};

            if (search) {
                query.petName = { $regex: search, $options: 'i' }
            }

            if(species){
                const speciesArray = species.split(',');
                query.species ={$in: speciesArray}
            }
            const result = await petCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/pet/:id', verifyToken,  async (req, res) => {
            const { id } = req.params;
            const result = await petCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.patch('/pet/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const updatedPetData = req.body;
            const result = await petCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedPetData }
            )
            res.send(result)
        })

        app.delete('/pet/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await petCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.get('/pet/email/:email', verifyToken, async (req, res) => {
            const { email } = req.params;
            const result = await petCollection.find({ ownerEmail: email }).toArray()
            res.send(result)
        })

        app.post('/pet', verifyToken, async (req, res) => {
            const newPetData = req.body;
            const result = await petCollection.insertOne(newPetData);
            res.send(result)
        })

        app.get('/adapted-pet', async (req, res) => {         //we are not using this api
            const result = await adaptedPetCollection.find().toArray();
            res.send(result)
        })

        app.get('/adapted-pet/:id', verifyToken,  async (req, res) => {
            const { id } = req.params;
            const result = await adaptedPetCollection.find({ petId: id }).toArray()
            res.send(result)
        })

        app.patch('/adapted-pet/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const { status } = req.body;
            const result = await adaptedPetCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: status } }
            );
            res.send(result)
        })

        app.get('/adapted-pet/email/:email', verifyToken, async (req, res) => {
            const { email } = req.params;
            const result = await adaptedPetCollection.find({ adapterEmail: email }).toArray()
            res.send(result)
        })

        app.delete('/adapted-pet/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await adaptedPetCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.post('/adapted-pet', verifyToken, async (req, res) => {
            const newAdaptedPetData = req.body;
            const result = await adaptedPetCollection.insertOne(newAdaptedPetData);
            res.send(result)
        })

        app.get('/featured-pet', async (req, res) => {
            const result = await petCollection.find().limit(6).toArray()
            res.send(result)
        })





        // await client.db("admin").command({ ping: 1 });
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