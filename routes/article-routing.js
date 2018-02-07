// Require all models
let db = require("../models");
let axios = require("axios");
let cheerio = require("cheerio");

module.exports = function (app) {
    app.get("/scrapeArticles", function (req, res) {
        let scrapeArray = [];
        // First, we grab the body of the html with request
        axios.get("http://www.ksl.com/").then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            let $ = cheerio.load(response.data);

            $("div.top_story_info").each(function (i, element) {
                let result = {};

                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(element).find("h1").text();
                result.summary = $(element).find("h2").text();
                let tmplink = $(element).find("a").attr("href");
                if (tmplink.includes("http://www.ksl.com/")) {
                    result.link = tmplink;
                } else {
                    result.link = "http://www.ksl.com/" + tmplink;
                }

                scrapeArray.push(result);
            });

            $("div.top_picks h2").each(function (i, element) {
                let result = {};

                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(element).find("a").text();
                result.summary = "top_pick";
                let tmplink = $(element).find("a").attr("href");
                if (tmplink.includes("http://www.ksl.com/")) {
                    result.link = tmplink;
                } else {
                    result.link = "http://www.ksl.com/" + tmplink;
                }

                scrapeArray.push(result);
            });

            // Now, we grab every h2 within an article tag, and do the following:
            $("div.headline").each(function (i, element) {
                // Save an empty result object
                let result = {};

                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(element).find("h2").find("a").text();
                result.summary = $(element).find("h5").text();
                let tmplink = $(element).find("h2").find("a").attr("href");
                if (tmplink.includes("http://www.ksl.com/")) {
                    result.link = tmplink;
                } else {
                    result.link = "http://www.ksl.com/" + tmplink;
                }

                scrapeArray.push(result);
            });

            for (let i = 0; i < scrapeArray.length; i++) {
                let art = scrapeArray[i];

                db.Article.findOneAndUpdate({link: art.link}, {
                    $set: {
                        title: art.title,
                        summary: art.summary,
                        link: art.link
                    }
                }, {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }, function (err, doc) {
                    if (err) {
                        console.log("Something wrong when updating data!");
                    }
                });
            }
        });
        res.redirect("/");
    });

    app.get("/", function(req, res) {
        db.Article
            .find({saved: false})
            .then(function (dbArticles) {
                // If we were able to successfully find Articles, send them back to the client
                //res.json(dbArticles);
                res.render("index", {
                    articles: dbArticles
                });
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

// Route for getting all saved Articles from the db
    app.get("/savedArticles", function (req, res) {
        // Grab every document in the Articles collection
        db.Article
            .find({saved: true})
            .then(function (dbArticles) {
                // If we were able to successfully find Articles, send them back to the client
                //res.json(dbArticles);
                res.render("savedArticles", {
                    articles: dbArticles
                });
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

// Route for grabbing a specific Article by id, populate it with it's note
    app.get("/articles/:id", function (req, res) {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
        db.Article
            .findOne({_id: req.params.id})
            // ..and populate all of the notes associated with it
            .populate("notes")
            .then(function (dbArticle) {
                // If we were able to successfully find an Article with the given id, send it back to the client
                res.json(dbArticle);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

// Route for saving/updating an Article's associated Note
    app.post("/saveArticleNote/:id", function (req, res) {
        // Create a new note and pass the req.body to the entry
        db.Note
            .create(req.body)
            .then(function (dbNote) {
                // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
                // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                //return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
                return db.Article.findOneAndUpdate({_id: req.params.id}, {$push: {notes: dbNote._id}}, {new: true});
                //return db.Article.findOneAndUpdate({_id: req.params.id}, {$set: {notes: dbNote._id}}, {new: true});

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

    app.post("/saveArticle/:id", function (req, res) {
        // Create a new note and pass the req.body to the entry
        db.Article
            .findOneAndUpdate({_id: req.params.id}, {saved: true}, {new: true})
            .then(function (dbArticle) {
                // If we were able to successfully update an Article, send it back to the client
                res.json(dbArticle);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

    app.delete("/deleteArticle/:id", function (req, res) {
        db.Article.remove({_id: req.params.id}, function (err) {
            res.end();
        });
    });

    app.delete("/deleteNote/:id", function (req, res) {
        console.log("... deleting note: " + req.params.id);
        db.Note.remove({_id: req.params.id}, function (err) {
        }).then(function (data) {
            res.json(data);
        });
    });
};