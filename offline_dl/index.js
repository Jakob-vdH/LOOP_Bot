const directline = require("offline-directline");
const express = require("express");
var cors = require('cors');

const app = express();
app.use(cors());
directline.initializeRoutes(app, 3000, "http://127.0.0.1:3978/api/messages");

