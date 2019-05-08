const directline = require("offline-directline");
const express = require("express");
var cors = require('cors');
const endpoint = rewuire("./config.json").endpoint;

const app = express();
app.use(cors());
directline.initializeRoutes(app, 3000, endpoint);

