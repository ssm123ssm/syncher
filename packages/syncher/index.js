/*
Syncher middleware for handling Syncher.js
create a function that accepts the key and callback a function with server hash.
pass that function as a parameter to the middleware handling POST route to hash check(syncher.getHash(callback)).
*/

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
                    res.jsonp({
                        status: 'changed'
                    });
                }
            });
        };
    }
};
