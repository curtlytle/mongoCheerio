// Require all models
let db = require("../models");
let axios = require("axios");
let cheerio = require("cheerio");

module.exports = function (app) {
    app.get("/scrape", function (req, res) {
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
                    upsert: true
                }, function (err, doc) {
                    if (err) {
                        console.log("Something wrong when updating data!");
                    }

                    //console.log(doc);
                });

            }
            res.send("Scrape Complete");
        });
    });

// Route for getting all Articles from the db
    app.get("/", function (req, res) {
        // Grab every document in the Articles collection
        db.Article
            .find({})
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
    app.post("/articles/:id", function (req, res) {
        // Create a new note and pass the req.body to the entry
        db.Note
            .create(req.body)
            .then(function (dbNote) {
                // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
                // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                //return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
                //return db.Article.findOneAndUpdate({_id: req.params.id}, {$push: {notes: dbNote._id}}, {new: true});
                //return db.Article.findOneAndUpdate({_id: req.params.id}, {$set: {notes: dbNote._id}}, {new: true});
                return db.Article.findOne({_id: req.params.id}, function(err, article) {
                    if (article.notes == null) {
                        article.notes.push(dbNote);
                    } else {
                        article.notes[0] = dbNote;
                    }
                    article.save(function (err) {
                        // handle errs
                    });
                });
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
};