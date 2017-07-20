const express = require("express");
const request = require("request");
const fs = require("fs");
const app = express();
const stripe = require("stripe")("sk_test_mWNAbwn5mAcqtFdOCTTPkwVS");

app.set("port", process.env.PORT || 3001);

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', '*');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.get("/api/connect/oauth/callback", (req, res) => {
  const code = req.query.code;

  // Make /oauth/token endpoint POST request
  request.post({
    url: 'https://connect.stripe.com/oauth/token',
    form: {
      grant_type: "authorization_code",
      client_id: 'ca_B2cTTSqNUDbklnO8F49Tll68CUDllize',
      code: code,
      client_secret: 'sk_test_mWNAbwn5mAcqtFdOCTTPkwVS'
    }
  }, (err, r, body) => {
    res.setHeader('Content-Type', 'application/json');
    fs.writeFile('data.json', JSON.stringify(body || {}), 'utf-8', () => {
      res.redirect('http://localhost:3000?connect=true');
    });
  });
});

app.get('/api/stripe/charge', (req, res) => {
  stripe.charges.create({
    amount: req.query.amount * 100,
    currency: "usd",
    source: req.query.token,
    transfer_group: "{ORDER10}",
  }).then((charge) => {
    res.send({ success: true, data: charge });
  }).catch((err) => {
    console.log(err);
    res.send({ success: false, data: err });
  });
});

app.get('/api/stripe/transfer', (req, res) => {
  fs.readFile('./data.json', 'utf-8', (err, data) => {
    if (err) { res.send({success: false, data: err}) };
    const jsonData = JSON.parse(JSON.parse(data));
    stripe.transfers.create({
      amount: req.query.amount * 100 * 0.5,
      currency: "usd",
      source_transaction: req.query.chargeId,
      destination: jsonData.stripe_user_id,
    }).then((transfer) => {
      res.send({ success: true, data: transfer });
    }).catch((err) => {
      console.log(err);
      res.send({ success: false, data: err });
    });
  });
});

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
