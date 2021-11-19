const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");

const _html = fs.readFileSync("./in.html", { encoding: "utf-8" });


// CONFIG
const REQUEST_TIME = 250 // in ms


function getAllSource() {
    let i = 0,
    srcs = [];
  let $ = cheerio.load(_html),
    item = $("div.x-colored-product > .__product"),
    itemDetailSrc = $("div.x-colored-product > .__product > a");

  while (i < item.length) {
    srcs[i] = `https://www.ivrose.com${itemDetailSrc[i].attribs.href}`;
    i++;
  }

  return {srcs, page: item.length}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async () => {
    let res = getAllSource();
    let sources = res.srcs
    let i = 0, j;
    let final = []

    while(i < res.page) {
        await request(sources[i]).then(async (res) => {
            let $ = cheerio.load(res)

            let _name = $('.xp-name'),
                _sku = $('div.xp-sku > span'),
                _lowerPrice = $('span.xp-lower-price')
                _realPrice = $('del.xp-del-price'),
                _productOff = $('span#product-off'),
                _image = $('.xp-list-image.listimage')

            let name = _name[0].children.pop().data.trim(),
                sku = _sku[0].children[0].data,
                star = 0,
                lowerPrice = _lowerPrice.text().trim(),
                realPrice = _realPrice.text(),
                productOff = _productOff.text(), // PERCENT
                thumbImgs = [],
                largeImgs = [],
                idsImg = []
            j = 0
            while (j < _image.length) {
                let cuccut = _image[j].attribs.style
                let imgId = cuccut.slice(cuccut.indexOf('/small/') + 7, cuccut.length - 1)
                thumbImgs[j] = `https://image.geeko.ltd/small/${imgId}`
                largeImgs[j] = `https://image.geeko.ltd/large/${imgId}`
                idsImg[j] = imgId;
                request(thumbImgs[j]).pipe(fs.createWriteStream(`./data/src/thumb/${imgId}.png`))
                request(largeImgs[j]).pipe(fs.createWriteStream(`./data/src/large/${imgId}.png`))
                j++;
            }
            let dataToAppend = {
                name, sku, star, lowerPrice, realPrice, productOff, thumbImgs, largeImgs, idsImg
            }
            final[i] = dataToAppend
            console.log(`DONE: ${name}`);
            await sleep(REQUEST_TIME);
        })
        i++;
    }

    fs.writeFileSync('./data/data.json', JSON.stringify(final), 'utf-8')
})();