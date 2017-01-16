const express = require('express');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const logger = require('morgan');
const path = require('path');

const helpers = require('./helpers');

const indexRoute = require('./routes/index');
const dataRoute = require('./routes/data');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));

if(process.env.NODE_ENV === 'development') {
  app.use(require('connect-livereload')({
  }));
}

// Add helper functions to the loacls
app.use(function(req, res, next) {
  res.locals.helpers = helpers;
  next();
});

app.use('/', indexRoute);
app.use('/data/', dataRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  if(req.accepts('json')) {
    res.json({
      message: err.toString()
    });
  } else {
    // render the error page
    res.render('error');
  }
});

module.exports = app;
