const express = require('express');
const assert = require('assert');
const { Console } = require('console');
const MongoClient = require('mongodb').MongoClient;

var app = express();

// Update url with your own srv format connection string with username and password included
//e.g.: mongodb+srv://<username>:<password>@<fqdn>?retryWrites=true&w=majority
const url = '<YOUR CONNECTION STRING GOES HERE>';

// Connects to your MongoDB cluster
MongoClient.connect(url, { useUnifiedTopology: true })
.then(client => {
    console.log("Connected to Atlas cluster");

    // Obtain the handles to the DB and collections
    const db = client.db("formula_one");
    const teamsCollection = db.collection("teams");
    const resultsCollection = db.collection("results");

    app.use(express.json());

    // Call this init sequence before demo starts
    app.get('/init', (req, res) => {
        //Drop both collections
        teamsCollection.drop().catch(error=>{console.error("Teams collection drop error:\n"+error)})
        resultsCollection.drop().catch(error=>{console.error("Results collection drop error:\n"+error)})

        //Create teams collection
        var teams = [
            {_id: "Mercedes", points: 0, country: "Germany", drivers:["L. Hamilton", "V. Bottas"]},
            {_id: "Ferrari", points: 0, country: "Italy", drivers:["C. Leclerc", "S. Vettel"]},
            {_id: "Red Bull", points: 0, country: "Austria", drivers:["M. Verstappen", "A. Albon"]},
            {_id: "McLaren", points: 0, country: "United Kingdom", drivers:["L. Norris", "C. Sainz"]},
            {_id: "Renault", points: 0, country: "France", drivers:["D. Riccardo", "E. Ocon"]}
        ];
        teamsCollection.insertMany(teams)
        .catch(error=>{console.error("Teams insert error:\n"+error)})

        res.send('Init Completed');
    })

    // Add a new results document and update team scores in a single atomic transaction
    app.post('/results', (req, res) => {
        var input = req.body;
        console.log(input);

        var f1_results = {
            date: new Date(input.date),
            country: input.country,
            drivers: input.drivers,
            constructors: input.constructors
        };

        const session = client.startSession();
        var hasError = false;
        session.withTransaction(async() => {
            //Insert result
            resultsCollection.insertOne(f1_results)
            .catch(error=>{"Results insert error:\n"+console.error(error); hasError=true;})

            //Update points for relevant teams (1st, 2nd and 3rd)
            teamsCollection.findOneAndUpdate({_id: input.constructors[0]}, {$inc: {points: 25}})
            .catch(error=>{console.error("Teams update 1 error:\n"+error); hasError=true;})
            teamsCollection.findOneAndUpdate({_id: input.constructors[1]}, {$inc: {points: 18}})
            .catch(error=>{console.error("Teams update 2 error:\n"+error); hasError=true;})
            teamsCollection.findOneAndUpdate({_id: input.constructors[2]}, {$inc: {points: 15}})
            .catch(error=>{console.error("Teams update 3 error:\n"+error); hasError=true;})
        })
        .then(results=>{console.log("Transaction Successful")})
        .catch(error=>{console.error("Transaction error:\n"+error); hasError=true;})
        .finally(f=>{session.endSession();})

        res.json({Status: hasError ? "Failed" : "Success"});
    })

    // Update existing results document with a crash object
    app.post('/crashes', (req, res) => {
        var input = req.body;
        console.log(input);

        var crashCountry = input.crash.country;
        var crashDetails = input.crash.details;
        var hasError = false;
        resultsCollection.updateOne({country: crashCountry}, {$set: {crash: crashDetails}})
        .catch(error=>{console.error("Update crash error:\n"+error); hasError=true;})

        res.json({Status: hasError ? "Failed" : "Success"});
    })
    
    app.get('/top_drivers', (req, res) => {
        console.log("Top Drivers Request");
        var aggPipeline = [
            {
              '$project': {
                '_id': 0, 
                'top3': {
                  '$firstN': {
                    'n': 3, 
                    'input': '$drivers'
                  }
                }
              }
            }, {
              '$unwind': {
                'path': '$top3'
              }
            }, {
              '$sortByCount': '$top3'
            }
          ]

        resultsCollection.aggregate(aggPipeline).toArray()
        .then(result=>{return res.json(result)})
        .catch(error=>{return res.json("Top Drivers error:\n"+error);})
    })
})
.catch(error => {
    console.log("Error connecting to Atlas cluster")
    console.error("Connection error:\n"+error);
})

// Change the server port to one that you prefer
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Formula One API service listening at http://%s:%s", host, port)
})
