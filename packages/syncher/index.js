/*
Syncher middleware for handling Syncher.js
create a function that accepts the key and callback a function with server hash.
pass that function as a parameter to the middleware handling POST route to hash check(syncher.getHash(callback)).
*/
const webpush = require('web-push');
webpush.setVapidDetails(
    'mailto:example@yourdomain.org',
    'BOwgl5YKUWtkZ34IkuZQzP7-R-Gj03xHez498heSUY17vg48-jgOk7Ux_KdgCG8lQdDXBkEGkAFhkBYKQ_oLyGU',
    'iGfUiNnfAG8EMGuTx-M2gY6_kFRCc5MwnB8aTg9GYLA'
);
//PUSH
function push(sub, obj) {


    if (sub) {
        sub = JSON.parse(sub);
        webpush.sendNotification(sub, JSON.stringify(obj)).catch(error => {
            console.error(error);
        });
    }
}

module.exports = {
    test: function (req, res, next) {
        console.log('passing thru syncher package!');
        next();
    },
    getHash: function (serverHash) {
        return function (req, res, next) {
            serverHash(req.body.key, function (hash) {
                if (hash == req.body.hash_docs) {
                    res.jsonp({
                        status: 'not changed'
                    });
                } else {
                    /*push(req.cookies.push, {
    title: 'Change of feed...',
    options: {
        body: `Hello ${req.cookies.user}, a change detected`,
        vibrate: [100, 50, 100]
    }
});*/
                    res.jsonp({
                        status: 'changed'
                    });
                }
            });
        };
    }
};
