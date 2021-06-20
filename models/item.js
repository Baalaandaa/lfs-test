const mongoose = require("mongoose")


const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  article: String,
  url: String
})

const Item = mongoose.model('item', itemSchema);

module.exports = Item;