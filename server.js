var express = require('express'),
    app = express(),
    routerUser = require('./routers/user'),
    routerPost = require('./routers/post'),
    routerThread = require('./routers/thread'),
    routerForum = require('./routers/forum'),
    modelGeneral = require('./models/general'),
    PREFIX_URL = '/db/api/';

app.use(PREFIX_URL + 'user', routerUser);
app.use(PREFIX_URL + 'post', routerPost);
app.use(PREFIX_URL + 'thread', routerThread);
app.use(PREFIX_URL + 'forum', routerForum);

app.post(PREFIX_URL + 'clear', function(req, res) {
    //TODO create method
    res.send('clear command');
});

app.get(PREFIX_URL + 'status', function(req, res) {
    //TODO create method
    res.send('status command');
});

app.listen(80, function() {
    console.log('Все ОК. Слушаем на порту 80.');
});

