const bodyParser	= require("body-parser");
const express		= require("express");
const mongodb		= require("mongodb");
const dotenv		= require("dotenv");
const path			= require("path");
const ejs			= require("ejs");
const fs			= require("fs");

dotenv.config();

// Port
const port = (process.env.TEST ? process.env.TEST_PORT : process.env.PORT);

// MongoDB
const mongUrl	= process.env.MONGO_URL || 'localhost';
const mongPort	= process.env.MONGO_PORT || '27017';
const uri		= `mongodb://${mongUrl}:${mongPort}/`;
const dbName	= 'test';
let db;
async function connectToMongo() {
	try {
		const client = await mongodb.MongoClient.connect(uri);
		db = client.db(dbName);
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("Failed to connect to MongoDB", err);
	}
}

// Express App
var app = express();
app.set("view engine", "ejs");
app.set("views", "views/");
app.use(express.json());
app.use(express.static(path.join(__dirname + "/public")));

let gen = {
	"charset"       : "UTF-8",
    "author"        : "Dylan Colton",
    "desc"          : "Description",

    "title"         : "Forum",
    "struct"        : "structure.css",
    "style"         : "000-test.css",
    "favicon"       : "icon.png",

    // Location
    "headLoc"       : "partials/static/",
    "headfootLoc"   : "partials/static/",
    "styleLoc"      : "/css/",
    "faviLoc"       : "/assets/favicons/",
};

// Homepage
app.get("/", (req, res) => {
	try {
		res.status(200).render("index.ejs", gen);
	} catch (err) {
		res.status(500).render("500.ejs", Object.assign({}, gen, {title:"500 - Internal Server Error", message:err}));
	}
});

// Fallback
app.all("*/:ex", (req, res) => {
	try {
		// The views/partials/pages needs changed to something else when I figure out how I'm storing forum threads
		const url = path.normalize(req.params.ex).replace(/^(\.\.(\/|\\|$))/, '');
		fs.access(__dirname + `views/partials/pages/${url}.ejs`, fs.constants.F_OK, (err) => {
			if (err) {
				res.status(404).render("404.ejs", Object.assign({}, gen, {title: "404 - Not Found", err:`Could not find ${url}`}));
			} else {
				res.status(200).render("index.ejs", Object.assign({}, gen, {}));
			}
		});
	} catch (err) {
		res.status(500).render("500.ejs", Object.assign({}, gen, {title:"500 - Internal Server Error", err:err}));
	}
});

connectToMongo().then(() => {
	if (db) {
		app.listen(port, () => {
			console.log(`Listening on port ${port}`);
		});
	} else {
		console.error("Server did not start because MongoDB connection failed.");
	}
}).catch(err => {
	console.error("Error during MongoDB connection:", err);
});
