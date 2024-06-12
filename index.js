require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


// mongodb - start

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Password}@cluster0.x4cetjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("Bistro_Boss_Restaurent");
    const menuCollection = database.collection("menu");
    const reviewCollection = database.collection("reviews");
    const cartCollection = database.collection("carts");
    const userCollection = database.collection("users");

    // user related apis
    app.get('/users', async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.post('/users', async(req,res)=>{
      const user = req.body;
      // check existing user
      const query = {email : user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({message: "user already exists"})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    // Menu related api
    app.get('/menu', async(req,res)=>{
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    // Review related api
    app.get('/review', async(req,res)=>{
      const result = await reviewCollection.find().toArray()
      res.send(result)
    })
    // cart collection apis
    app.get('/carts', async(req,res)=>{
      const user = req?.query?.email;
      // console.log(user)
      const query = {email : user}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/carts', async(req,res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem)
      res.send(result)
    })

    app.delete('/carts/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

   
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb - end

// root api
app.get('/', (req,res)=>{
    res.send("Bistro Boss Restaurant server is running")
})

app.listen(port,()=>{
    console.log("Bistro Boss Server is running on port : ", port)
})