const express = require('express');
const bcrypt = require('bcryptjs');
const ejs = require('ejs');
const app = express();
const path = require('path');
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");
const collection = require("./src/config");

app.set('view engine', 'ejs');
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));
app.use(cors());

app.use(express.urlencoded({ extended: false }));
//use EJS as the view engine

app.get('/', (req, res) =>{
    res.render("home")
});

app.get('/1', (req,res) => {
    res.render("home1")
});

app.get('/2', (req,res) => {
    res.render("home2")
});

app.get('/login', (req, res) =>{
    res.render("login")
});

app.get("/pay", (req, res) =>{
    const fieldRequire = 'This field is required'

    res.render("pay", {fieldRequire});
});

app.get("/checkout", (req, res) => {
      
      res.render("flutter", { user, public_key });
});

app.get("/course", (req, res) => {
    res.render("course")
});
//Register functionality

app.post("/pay", async(req,res) =>{
    const data = {
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
        status: 'unknown',
    }


    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });
    const fieldRequire = 'User already exists'
    if (existingUser) {
        res.send("<script>alert('User Already exists'); window.location.href='/pay';</script>");
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertMany(data);
        console.log(userdata);

        const payerEmail = data.email;
        const userName = data.name;
        const userPhone = data.phone;
        const public_key = process.env.PUBLIC_KEY;

        res.render("flutter", {payerEmail, userName,userPhone,public_key});       
      
    }
    
});

//Checkout function
app.get("/redirect_flutterewave", async (req, res) => {
    const { transaction_id } = req.query;
    // URL with transaction ID which will be used to confirm transaction status
    const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    const secret_key = process.env.SECRET_KEY;

    try {
        // Network call to confirm transaction status
        const response = await axios({
            url,
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${secret_key}`,
            },
        });

        // Extracting necessary data from the response
        const customerData = response.data.data.customer;

        // Assuming you have the user's email from the customer data
        // const email = customerData.email;

        // Updating the status to 'successful' in the database
        const filter = { email: customerData.email }; // Assuming email is the unique identifier
        const update = { status: 'successful' };
        const options = { new: true }; // To return the updated document
        const updatedUser = await collection.findOneAndUpdate(filter, update, options);

        // Redirecting to the course page
        res.redirect("/course");
    } catch (error) {
        console.log(error);
        // Handle errors appropriately
        res.status(500).send("Error processing transaction status");
    }
});

  
  
// Login user 
app.post("/login", async (req, res) => {
    try {
        const user = await collection.findOne({ name: req.body.name });

        if (!user) {
            return res.send("<script>alert('User does not exist'); window.location.href='/login';</script>");
        }

        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordMatch) {
            return res.send("<script>alert('Incorrect Password'); window.location.href='/login';</script>");
        }

        // Check if User has paid
        if (user.status !== 'successful') {
            return res.render("pay");
        }

        // If everything is fine and the status is successful, render the "course" page
        res.render("course");
    } catch (error) {
        console.error(error);
        return res.send("<script>alert('An Error occurred'); window.location.href='/login';</script>");
    }
});



// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
