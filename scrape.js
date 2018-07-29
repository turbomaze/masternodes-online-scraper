const request = require('request');
const cheerio = require('cheerio');
const url = 'https://masternodes.online/#masternode-stats';

if (process.argv.length < 4) {
  console.log('Usage: node scrape.js MIN_WORTH MIN_ROI');
  process.exit(0);
}

const params = {
  minWorth: parseFloat(process.argv[2]) || -1,
  roi: parseFloat(process.argv[3]) || -1,
};

function cleanName(name) {
  return name.substring(name.indexOf(' ')).trim();
}

function getTicker(name) {
  return name.substring(name.indexOf('(') + 1, name.indexOf(')'));
}

function getRow(a) {
  const b = '<body>';
  const i = a.indexOf(b);
  const j = a.indexOf('</body>');
  const clean = a
    .substring(i + b.length, j)
    .replace(/\t/g, '')
    .split('\n')
    .map(a => a.trim());
  return {
    icon: clean[0],
    name: cleanName(clean[1]),
    ticker: getTicker(clean[1]),
    price: parseFloat(clean[2].substring(1)),
    change: parseFloat(clean[3].substring(0, clean[3].length - 1)),
    volume: parseFloat(clean[4].substring(1)),
    marketcap: parseFloat(clean[5].substring(1)),
    roi: parseFloat(clean[6].substring(0, clean[6].length - 1)),
    nodes: parseInt(clean[7]),
    minRequired: parseFloat(clean[8]),
    minWorth: parseFloat(clean[9].substring(1)),
  };
}

request(url, (err, res, body) => {
  if (!err && res.statusCode == 200) {
    const $ = cheerio.load(body);
    const rows = [];
    $('#masternodes_table tr').each((i, el) => {
      const $$ = cheerio.load($(el).text());
      const a = JSON.parse(JSON.stringify($$.html()));
      const row = getRow(a);
      rows.push(row);
    });

    const result = rows
      .filter(row => {
        return row.minWorth >= params.minWorth && row.roi >= params.roi;
      })
      .reduce((s, a) => s + 1, 0);

    console.log(result);
  } else {
    console.log('error');
  }
});
