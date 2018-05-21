var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = 7000;
var app = express();
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//mongoose.connect("mongodb://localhost/nytimes");
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nytimes";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
var db = mongoose.connection;
var newArticlesArray = [];

// Routes
// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  console.log("Starting scrape");
  var rowCount = 0;
  var insCount = 0;
  var updCount = 0;
  newArticlesArray = [];
  // First, we grab the body of the html with request
  axios.get("http://www.nytimes.com").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    var i = 0;

    db.Article.count(function (err, val) {
      console.log("Article Count Before Scraping: " + val);
    });

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.collection article").each(function (i, element) {
      // Save an empty result object
      var result = {};
      var tempStr = "";

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element).find('h2 a').text();
      result.link = $(element).find('a').attr("href");
      result.articleId = $(element).attr("data-story-id");
      tempStr = $(element).find('p.summary').text();
      tempStr = tempStr.replace("\n", "");
      tempStr = tempStr.trim();
      result.summary = tempStr;
      result.saved = false;
      result.newarticle = false;

      if (result.articleId != '' && result.link != '' && result.summary != '' && result.title != '') {
        console.log(++rowCount + "] articleId:" + result.articleId + ",link:" + result.link + ",title:" + result.title)

        db.Article.create(result, function (error) {
          console.log(++updCount + "] ERROR caught for :" + error);
          var str = JSON.stringify(error);
          if (str.includes("duplicate key error")) {
            console.log(++updCount + "] Article " + result.articleId + " already exists");
          } else {
            console.log(++insCount + "] NEW Article " + result.articleId);
            newArticlesArray.push(result.articleId);
          }
        });
      }

      // Create a new Article using the `result` object built from scraping
      /* db.Article.create(result)
         .then(function (dbArticle) {
           // View the added result in the console
           // console.log(++i);
         })
         .catch(function (err) {
           // If an error occurred, send it to the client
           return res.json(err);
         });*/


    });

    // If we were able to successfully scrape and save an Article, send a message to the client

  });

  db.Article.count(function (err, val) {
    console.log("article count" + val);
  });
  console.log("Scraping done");

});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/scrapenewarticles", function (req, res) {
  console.log("newArticlesArray:" + newArticlesArray);
  db.Article.find({ "articleId": newArticlesArray })
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/savearticle/:articleId", function (req, res) {
  console.log("Updating article" + req.params.articleId);
  var article = req.params.articleId;
  console.log(typeof (article));

  db.Article.findOneAndUpdate({ "articleId": article }, { save: true }, function (err, result) {
    console.log("before update RESULT: " + JSON.stringify(result));
    result.saved = true;
    result.save();
    console.log("before update RESULT: " + JSON.stringify(result));
  });

});


app.post("/deletearticle/:articleId", function (req, res) {
  console.log("Deleting article" + req.params.articleId);
  var article = req.params.articleId;
  console.log(typeof (article));

  db.Article.findOneAndUpdate({ "articleId": article }, { save: false }, function (err, result) {
    console.log("before update RESULT: " + JSON.stringify(result));
    result.saved = false;
    result.save();
    console.log("before update RESULT: " + JSON.stringify(result));
  });

});

// app.get("/getnote/:articleId", function (req, res) {
//   db.Article.findOne({ "articleId": req.params.articleId })
//     .populate("note")
//     .then(function (dbArticle) {
//       res.json(dbArticle);
//     })
//     .catch(function (err) {
//       res.json(err);
//     });
// });


app.get("/getnote/:articleTitle", function (req, res) {
  db.Note.find({ "articletitle": req.params.articleTitle })
    .then(function (notes) {
      res.json(notes);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/savenote/:articleId", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query

//      return db.Article.findOneAndUpdate({ "articleId": req.params.articleId }, {$set:{ note: dbNote} }, function (err) {
      
     
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/deletenote", function (req, res) {
  
  console.log("TO BE DElETED:"+JSON.stringify(req.body))
  db.Note.findOneAndRemove( req.body ,function (err, result) {
    
    console.log("DELETING NOTE: " + JSON.stringify(result));
  });

});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
