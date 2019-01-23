#!/usr/bin/env node

var express = require('express');
var port = 80;
var bodyparser = require('body-parser');
var app = express();
var dbURL = 'mongodb://localhost:27017/db';
const mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var crypto = require('crypto');
var fs = require('fs');
var syncher = require('./packages/syncher');
var multer = require('multer');
//var expressip = require('express-ip');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        if (file.originalname.includes('key_')) {
            cb("naming problem", null);
        }
        cb(null, file.originalname + '-' + Date.now() + '.' + 'key_' + req.body.key + '.' + 'des_' + req.body.description + '.' +
            file.originalname.split('.')[file.originalname.split('.').length - 1]);
        /*console.log("req.body");
console.log(req.body);*/
    }
})
var upload = multer({
    storage: storage
});
var currentHash;
var hash2;
app.use(bodyparser.urlencoded({
    extended: false
}));
//app.use(expressip().getIpInfoMiddleware);
var dbFunctions = {
    connect: function (collection, cb) {
        mongo.connect(dbURL, function (err, db) {
            if (err) {
                console.log(err);
                //db.close();
                return err;
            } else {
                var col = db.collection(collection);
                cb(col);
                db.close();
            }
        });
    },
    findAll: function (cb) {
        this.connect('default', function (col) {
            col.find({}).toArray(function (err, ress) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    cb(ress);
                }
            });
        });
    },
    insert: function (obj, cb) {
        this.connect('default', function (col) {
            col.insert(obj);
            cb();
        });
    },
    removeDoc: function (id, cb) {
        this.connect('default', function (col) {
            console.log(`removing id ${id}`);
            col.remove({
                _id: new ObjectId(id)
            });
            cb();
        });
    },
    search: function (query, target, cb) {
        var searchQ = {};
        searchQ[query] = target;
        this.connect('default', function (col) {
            col.find(searchQ).toArray(function (err, ress) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    cb(ress);
                }
            });
        });
    }
};


app.use(express.static('./'));

//function for passing into syncher NPM
function getHash(key, callback) {
    //console.log('a hash get request');
    if (key == '' || key == undefined) {
        key = null;
    }
    dbFunctions.search("key_", key, function (ress) {
        var str = '';
        ress.forEach(function (item) {
            str += item._id;
        });
        var currentHash = crypto.createHash('md5').update(str).digest("hex").toString();
        callback(currentHash);
    });
}

function getUploadsHash(key, callback) {
    if (key == null || key == undefined) {
        key = '';
    }
    watchUploads(function (items) {
        //console.log(key);
        var hash = crypto.createHash('md5').update(filterByKey(key, items).join('')).digest("hex").toString();
        //console.log(hash);
        callback(hash);
    });
}

function filterByKey(key, arr) {
    var ret = [];
    // console.log(`key is ${key}`);
    arr.forEach(function (item) {
        // console.log(`checking ${item}`);

        if (item.includes(`key_${key}`)) {
            var splits = item.split('.');
            var splitsCount = 0;
            var detKey;
            splits.forEach(function (split) {
                if (split.includes('key_')) {
                    splitsCount++;
                    detKey = split.slice(4);
                    //console.log(detKey);
                }
            });
            if (splitsCount > 1) {
                console.log('file name compromise');
            } else {
                if (detKey == key) {
                    ret.push(item);
                }
            }

        }
    });
    return ret;
}
/*var ch = ['asdsd.key_dsd.ds', 'asdsasd.key_dsdsd.ds', 'dsf.key_.ds', 'eww.key_ssm.dds.ds', 'qwe.key_.key_findme.ds'];
console.log(filterByKey('', ch));*/

function watchUploads(callback) {
    fs.readdir('./uploads', function (err, items) {
        if (!err) {
            callback(items);
        }
    });
}

function removeUpload(item, callback) {
    fs.unlink(`./uploads/${item}`, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('file removed');
            callback();
        }
    });
}

function getKeyByUserId(id, callback) {
    console.log('user id is %s', id);

}


app.get('/checkuploads', function (req, res) {
    if (req.query.key == undefined) {
        req.query.key = '';
    }
    //console.log(req.query.key);
    watchUploads(function (items) {
        res.jsonp({
            items: filterByKey(req.query.key, items)
        });
    });

});

app.get('/testMongo', function (req, res) {
    var key = req.query.key;
    if (key == '') {
        key = null;
    }
    dbFunctions.search("key_", key, function (ress) {
        //console.log(`getting docs for key: ${key}`);
        //console.log(ress);
        res.send(ress);
    });
});

app.post('/upload',
    upload.single('img'),
    function (req, res, next) {
        if (req.file) {
            res.redirect(`/`);
        } else {
            res.send('No file');
        }
    });



app.post('/hashCheck', syncher.getHash(getHash));
app.post('/uploadsHashCheck', syncher.getHash(getUploadsHash));

app.get('/clearDB', function (req, res) {
    mongo.connect(dbURL, function (err, db) {
        if (err) {
            console.log(err);
            res.send("DB error");
        } else {
            db.dropDatabase();
            //getHash();
            res.send("DB dropped");
        }
    });
});

app.get('/private', function (req, res) {

    res.jsonp({
        mode: 'private',
        key: req.query.key
    });
});

app.get('/all', function (req, res) {
    dbFunctions.findAll(function (ress) {
        res.jsonp(ress);
    });
});

app.get('/push/:testString', function (req, res) {
    var val = req.params.testString;
    var time = new Date();
    var key_ = req.query.key;

    dbFunctions.insert({
        val: val,
        time: time,
        key_: key_,
        browser: req.headers['user-agent'],
        host: req.headers.host
    }, function () {
        //getHash();
        res.redirect("/");
    });

});

app.post('/push', function (req, res) {
    var val = req.body.data;
    var time = new Date();
    var key_ = req.body.key;
    if (key_ == '') {
        key_ = null;
    }
    console.log(req.body);

    if (req.body.postTo) {
        console.log('Msg to specific');

    }

    dbFunctions.insert({
        val: val,
        time: time,
        key_: key_,
        user: req.body.user,
        user_id: req.body.user_id,
        behaviour: req.body.behaviour,
        browser: req.headers['user-agent'],
        host: req.headers.host
    }, function () {
        //getHash();
        res.jsonp({
            status: 20
        });
    });
});

app.post('/removeDoc', function (req, res) {
    var id = req.body.id;
    dbFunctions.removeDoc(id, function () {
        // getHash();
        res.jsonp({
            status: 20
        });
    });
});

app.post('/removeUpload', function (req, res) {
    var item = req.body.item;
    console.log('removal req for ' + item);
    removeUpload(item, function () {
        //getHash();
        res.jsonp({
            status: 20
        });
    });

});

app.listen(port, function () {
    console.log('server started on port ' + port);
    //getHash();
});
