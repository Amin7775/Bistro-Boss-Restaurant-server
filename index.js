require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

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


    // jwt related apis
    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.Access_Token_Secret,{expiresIn:'1h'})
      res.send({token})
    })

    // jwt verify token middleware
    const verifyToken = (req,res,next)=>{
      if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      // console.log(token)
      jwt.verify(token, process.env.Access_Token_Secret,(err, decoded)=> {
        if(err){
          return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded
        next()
      });
    }

    // user related apis
    app.get('/users',verifyToken, async(req,res)=>{
      // console.log(req.headers)
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    // verify isAdmin
    app.get('/users/admin/:email',verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: "unauthorized access"})
      }
      const query = {email : email}
      const user = await userCollection.findOne(query)
      let admin = false
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})
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

    app.delete('/users/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req,res)=>{
      const id =req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updatedDoc = {
        $set : {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
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