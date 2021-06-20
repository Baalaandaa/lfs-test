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
    return {
      $: cheerio.load(data),
      html: data
    };
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
  
  static async fetchCategories($, url, pageHtml){
    let categories = [];
    const ssrModelInd = pageHtml.indexOf("ssrModel");
    const appVerionInd = pageHtml.indexOf("appVersion");
    let str = pageHtml.substr(ssrModelInd + 9, appVerionInd - ssrModelInd - 9 - 34);
    const ssrData = JSON.parse(str);
    if(ssrData.model.xData.xcatalogQuery.indexOf(";") !== -1){//Checkboxes
      console.log("Checkbox page");
      const resp = await fetch(`https://wbxcatalog-ru.wildberries.ru/${ssrData.model.xData.xcatalogShard}/filters?locale=ru&filters=xsubject&${ssrData.model.xData.xcatalogQuery}`);
      const categoriesData = await resp.json();
      const list = categoriesData.data.filters[0].items;
      for(let i = 0; i < list.length; i++){
        const e = list[i];
        let category = new Category({
          name: e.name,
          url: url + (url.indexOf('?') !== -1 ? '&' : '?') + "xsubject=" + e.id
        });
        await category.save();
        categories.push(category);
      }
    } else if($(".sidemenu li ul li").length > 1){//Just selection
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
    console.log(url);
    const $ = (await this.loadPage(url)).$;
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