require('dotenv').config()
const express = require("express")
const Parser = require("./parser");
const mongoose = require("mongoose");
const app = express()
const port = 3000 | process.env.PORT
const mongoURL = process.env.MONGOURL

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.json())

app.post("/", (req, res) => {
    if(!req.body.url)
      return res.json({
        ok: false,
        error: "no url provided"
      });
    const url = req.body.url;
    Parser.loadPage(url).then(async data => {
      const $ = data.$;
      console.log("Parsing", $("h1[class=catalog-title]").text());
      const items = await Parser.fetchItems($);
      console.log(`${items.length} items fetched`);
      const categories = await Parser.fetchCategories($, url, data.html);
      console.log(`${categories.length} categories fetched`);
      res.json({
        ok: true,
        items: items.length,
        categories: categories.length
      })
    }).catch(e => {
      console.error(e);
    });
    
})

app.get("/", (req, res) => {
  console.log(req.headers);
})

app.listen(port,() => {
  console.log(`Listening localhost:${port}`)
})