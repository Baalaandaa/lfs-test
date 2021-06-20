const cheerio = require("cheerio")
const fetch = require("node-fetch")
const Item = require("./models/item");
const Category = require("./models/category");
const fs = require("fs");

class Parser {
  
  //Returns cheerio object from url
  static async loadPage(url){
    const response = await fetch(url);
    const data = await response.text();
    // fs.writeFileSync("debug.html", data);
    return cheerio.load(data);
  }
  
  static async fetchItems($){
    let items = [];
    const all = $(".j-card-item");
    $(all).each(function (i, elem) {
      const url = "http://wildberries.ru" + $(this).find(".ref_goods_n_p").attr('href');
      items.push(Parser.fetchItem(url));
    });
    return await Promise.all(items);
  }
  
  static async fetchCategories($, url){
    let categories = [];
    console.log($(".sidemenu").html());
    
    if($(".xsubject").length){//Checkboxes
      console.log("Checkbox page");
      const labels = $(".xsubject fieldset label");
      $(labels).each(function (){
        const dv = $(this).attr('data-value');
        const name = $(this).text();
        let link = url;
        if(url.indexOf("?") !== -1)
          link += '&';
        else link += '?';
        link += `xsubject=${dv}`;
        const category = new Category({
          name: name,
          url: link
        });
        category.save();
        categories.push(category);
      })
    } else if($(".sidemenu li ul").length){//Just selection
      console.log("Selection page");
      const objects = $(".sidemenu li ul li");
      $(objects).each(function (){
        const link = $(this).find("a");
        const data = {
          name: link.text(),
          url: 'http://wildberries.ru' + link.attr('href')
        };
        const category = new Category(data);
        category.save();
        categories.push(category);
      })
    }
    return categories;
  }
  
  static async fetchItem(url){
    const $ = await this.loadPage(url);
    const data = {
      name: $("span[class=brand]").text() + " / " + $(".name").text(),
      description: $(".j-description p").text(),
      article: $(".article span").text(),
      url: url
    };
    const item = new Item(data);
    await item.save();
    return item;
  }
  
}

module.exports = Parser