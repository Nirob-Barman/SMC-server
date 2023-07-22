const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xceqs5c.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db("smcDb").collection("users");
        const classCollection = client.db("smcDb").collection("classes");

















        // user collection
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        app.get('/users/role', async (req, res) => {
            try {
                const email = req.query.email;

                const user = await usersCollection.findOne({ email });

                if (!user) { return res.status(404).json({ error: 'User not found' }); }

                const role = user.role;
                // console.log('Server role: ' + role);
                res.json(role);
                // res.send(role);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        })

        // Define the route to handle role updates for users
        app.patch('/users/:id', async (req, res) => {
            try {

                const { id } = req.params;
                const { role } = req.body;

                // Validate the role to prevent unauthorized role changes (optional)
                const validRoles = ['student', 'instructor', 'admin'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json({ error: 'Invalid role' });
                }

                // Assuming usersCollection is a valid MongoDB collection reference
                const updatedUser = await usersCollection.findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: { role } },
                    { returnOriginal: false } // Return the updated document
                );

                if (!updatedUser.value) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json(updatedUser.value);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log('User: ', user);

            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            console.log('Existing user: ', existingUser);
            // google login
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })













        // class collection

        // GET endpoint for retrieving classes
        app.get('/class', async (req, res) => {
            try {
                const classes = await classCollection.find().toArray();
                res.send(classes);
            }
            catch (error) {
                console.error('Error retrieving classes:', error)
                res.status(500).json({ error: 'Internal server error' });
            }
        })

        // GET endpoint for retrieving user classes by email
        app.get('/classes', async (req, res) => {
            try {
                // console.log(req.body);
                // console.log(req.query);
                const { email } = req.query;
                // const email = req.query.email;

                console.log("Server Email: ", email);
                // const userClasses = await classCollection.find({ email }).toArray();
                // res.send(userClasses);
                const classes = await classCollection.find({ email: email }).toArray();
                res.json(classes);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        })

        app.post('/classes', async (req, res) => {
            try {
                const addedClass = req.body;
                const result = await classCollection.insertOne(addedClass);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        })

        // Implement the endpoint to update the class status
        // PATCH endpoint to update the class status
        app.patch('/classes/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Invalid class ID' });
                }

                const updatedClass = await classCollection.findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: { status } },
                    { returnOriginal: false }
                );

                if (!updatedClass.value) {
                    return res.status(404).json({ error: 'Class not found' });
                }

                res.json(updatedClass.value);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // GET endpoint for retrieving feedback for a specific class
        app.get('/classes/:id/feedback', async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Invalid class ID' });
                }

                // const classCollection = client.db(dbName).collection('classes');
                const classData = await classCollection.findOne({ _id: new ObjectId(id) });

                if (!classData) {
                    return res.status(404).json({ error: 'Class not found' });
                }

                const feedback = classData.feedback || 'No feedback available';
                res.json({ feedback });
            } catch (error) {
                console.error('Error retrieving class feedback:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // POST endpoint to update the class feedback
        app.post('/classes/:id/feedback', async (req, res) => {
            try {
                const { id } = req.params;
                const { feedback } = req.body;
                console.log(feedback);

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Invalid class ID' });
                }

                const classCollection = client.db("smcDb").collection("classes");
                const updatedClass = await classCollection.findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: { feedback } },
                    { returnOriginal: false }
                );

                if (!updatedClass.value) {
                    return res.status(404).json({ error: 'Class not found' });
                }

                res.json(updatedClass.value);
            } catch (error) {
                console.error('Error handling feedback:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Camp is a family experience company')
})

app.listen(port, () => {
    console.log(`Camp is experiencing on port ${port}`);
})

