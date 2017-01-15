const express = require('express');

const unhcr = require('../services/unhcr');

const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('slides');
});

module.exports = router;
