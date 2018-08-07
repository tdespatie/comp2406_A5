/*
  Author: Tyler Despatie
  Student Number: 101010622
  Course: COMP 2406
  Section: A1
  File app.js
*/
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var app = express();

var ROOT = '/public';
var db;

// Initialize connection once
MongoClient.connect("mongodb://localhost:27017/recipeDB", function(err, database) {
  if (err) console.log('Failed to connect to database');
  else {
    db = database; // Set db to the database we connected to
    app.listen(2406, function() {
      console.log("Server listening on 2406");
    });
  }
});

app.use(express.static(__dirname + ROOT)); // Required for retrieving images/css
app.use(bodyParser.urlencoded({extended: true})); // Required for parsing body of POST
app.set('view engine', 'pug'); // Required for the use of pug/jade

// Handles requests for the root directory, render the index page
app.get("/", function(req, res) {
    res.render('index.pug'); // Return the rendered index page
    res.end(); // End the response
});

// Route for handling GET requests for a specified recipe
app.get("/recipe/*", function(req, res) {
  // Find the recipe requested in the database
  db.collection("recipes").findOne({name: req.params[0]}, function(err, data) {
    if (err) res.sendStatus(404); // If it's not found, an error has occured
    else {
      res.send({name: data.name, // Name of recipe
                duration: data.duration, // Duration of cooking process
                ingredients: data.ingredients, // Recipe ingredients
                directions: data.directions, // Recipe directions
                notes: data.notes}); // Recipe notes
      res.end(); // End the response
    }
  });
});

// Route for handling GET requests for /recipes to populate dropdown
app.get("/recipes", function(req, res) {
  // Find all the recipes in the database
  db.collection("recipes").find({}, function(err, data) {
    var recipeList = [];
    data.each(function(err, recipe) {
      if (recipe) // Add each recipe to an array
        recipeList.push(recipe.name);
      else { // If what's returned is not a recipe, return what was added to the array
        res.send({names: recipeList});  // Return the names of the recipes
        res.end(); // End the response
      }
    });
  });
});

// Route for handling POST requests to update/add a recipe
app.post("/recipe", function(req, res) {
  // Parse the recipe name properly by substituting spaces for underscores
  var recipeName = req.body.name.split("_").join(" ");
  // If a recipeName was provided
  if (recipeName)
    db.collection("recipes").update({name: recipeName}, // Update the record
    {
        name: recipeName, // Set the recipe name
        duration: req.body.duration, // Set the duration
        ingredients: req.body.ingredients, // Set the ingredients
        directions: req.body.directions, // Set the directions
        notes: req.body.notes // Set the notes
        // Upsert set to true so the record is added if it doesn't exist
    }, {upsert: true}, function (err, result) {
      if (err) res.sendStatus(500); // Error has occured, return 500 (server error)
      else res.sendStatus(200); // OK, record was updated/added
      res.end(); // End the response
    });
  else
    res.sendStatus(400).end(); // Bad request, as recipe name was blank
});

// Return 404 for any page/route requested that isn't handled
app.get("*", function(req, res) {
  res.sendStatus(404).end();
});
