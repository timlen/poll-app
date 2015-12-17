var express = require('express');
var path = require('path');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var controllers = require('./controllers');

var app = express();

var packageFile = require('./package.json');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/' + packageFile.name);

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
app.use(session({
    secret: 'atv45atv4u8atv4mu89agv4mnu89a',
    store: new MongoStore({mongooseConnection: mongoose.connection, autoRemove: 'disabled'})
}));

app.use(logger('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());
//app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));

app.get('/app/*', function(req, res) {
    res.sendfile(__dirname + '/public/html/index.html');
});

app.use('/api', controllers);

/// catch 404 and forward to error handler
app.use(function(req, resp, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if(app.get('env') === 'development') {
    app.use(function(err, req, resp, next) {
        resp.status(err.status || 500);
        resp.send('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, resp, next) {
    resp.status(err.status || 500);
    resp.send('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
