var express = require('express'),
    app = express(),
    routerUser = require('./routers/user'),
    routerPost = require('./routers/post'),
    routerThread = require('./routers/thread'),
    routerForum = require('./routers/forum'),
    modelGeneral = require('./models/general'),
    bodyParser = require('body-parser'),
    responceCallback = require('./responce'),
    PREFIX_URL = '/db/api/';
try {
    app.use(bodyParser.json());
} catch (err) {
    
}


app.use(PREFIX_URL + 'user', routerUser);
app.use(PREFIX_URL + 'post', routerPost);
app.use(PREFIX_URL + 'thread', routerThread);
app.use(PREFIX_URL + 'forum', routerForum);

app.post(PREFIX_URL + 'clear/', function(req, res) {
    modelGeneral.clear( responceCallback(res) );
});

app.post(PREFIX_URL + 'status', function(req, res) {
    modelGeneral.status( responceCallback(res) );
});

app.listen(80, function() {
    console.log('Все ОК. Слушаем на порту 80.');
});

