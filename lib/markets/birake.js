var request = require('request');

var base_url = 'https://api.birake.com/v5/public';

function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url + '/ticker';
  request({uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {
      summary['ask'] = parseFloat(body[105]['highestBid']).toFixed(8);
      summary['bid'] = parseFloat(body[105]['lowestAsk']).toFixed(8);
      summary['volume'] = parseFloat(body[105]['quoteVolume24h']).toFixed(8);
      summary['volume_btc'] = parseFloat(body[105]['baseVolume24h']).toFixed(8);
      summary['high'] = parseFloat(body[105]['lowestAsk']).toFixed(8);
      summary['low'] = parseFloat(body[105]['highestBid']).toFixed(8);
      summary['last'] = parseFloat(body[105]['lastPrice']).toFixed(8);
      //summary['change'] = parseFloat(body[105]['percentChange']);
      return cb(null, summary);
    } else {
      return cb(error, null);
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/trades/?pair=' + coin.toUpperCase() + '_' + exchange.toUpperCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
          return cb(error, null);
        else if (body.error !== true) {
          var tTrades = body;
          var trades = [];
          for (var i = 0; i < tTrades.length; i++) {
              var Trade = {
                  orderpair: tTrades[i].marketPair,
                  ordertype: tTrades[i].type,
                  amount: parseFloat(tTrades[i].volume).toFixed(8),
                  price: parseFloat(tTrades[i].price).toFixed(8),
                  total: (parseFloat(tTrades[i].volume).toFixed(8) * parseFloat(tTrades[i].price)).toFixed(8),
                  timestamp: parseInt((new Date(tTrades[i].time).getTime() / 1000).toFixed(0))
              }
              trades.push(Trade);
          }
          return cb(null, trades);
      } else {
          return cb(body.Message, null);
      }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/depth/?pair=' + coin.toUpperCase() + '_' + exchange.toUpperCase();
    request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
            return cb(error, null);
        else if (body.error !== true) {
            var buyorders = body['buys'];
            var sellorders = body['sells'];

            var buys = [];
            var sells = [];
            if (buyorders.length > 0){
                for (var i = 0; i < buyorders.length; i++) {
                    var order = {
                        amount: parseFloat(buyorders[i].amount).toFixed(8),
                        price: parseFloat(buyorders[i].price).toFixed(8),
                        total: (parseFloat(buyorders[i].amount).toFixed(8) * parseFloat(buyorders[i].price)).toFixed(8)
                    }
                    buys.push(order);
                }
                } else {}
                if (sellorders.length > 0) {
                for (var x = 0; x < sellorders.length; x++) {
                    var order = {
                        amount: parseFloat(sellorders[x].amount).toFixed(8),
                        price: parseFloat(sellorders[x].price).toFixed(8),
                        total: (parseFloat(sellorders[x].amount).toFixed(8) * parseFloat(sellorders[x].price)).toFixed(8)
                    }
                    sells.push(order);
                }
            } else {
            }
            return cb(null, buys, sells);
            } else {
            return cb(body.Message, [], [])
        }
      });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_orders(coin, exchange, function(err, buys, sells) {
     if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange,  function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
