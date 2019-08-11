var express = require('express');
var port = 80;
var bodyparser = require('body-parser');
var cors = require('cors');
var app = express();
var dbURL = 'mongodb://localhost:27017/db';
const mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var crypto = require('crypto');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var syncher = require('./packages/syncher');
var multer = require('multer');
const webpush = require('web-push');
var qrcode = require('qrcode');
webpush.setVapidDetails(
    'mailto:example@yourdomain.org',
    'BOwgl5YKUWtkZ34IkuZQzP7-R-Gj03xHez498heSUY17vg48-jgOk7Ux_KdgCG8lQdDXBkEGkAFhkBYKQ_oLyGU',
    'iGfUiNnfAG8EMGuTx-M2gY6_kFRCc5MwnB8aTg9GYLA'
);
//var expressip = require('express-ip');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
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
//SSL



var upload = multer({
    storage: storage
});
var currentHash;
var hash2;
app.use(bodyparser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(cors());

//capp.use(expressip().getIpInfoMiddleware);
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


app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

//PUSH
function push(sub, obj) {
    if (sub) {
        sub = JSON.parse(sub);
        /*webpush.sendNotification(sub, JSON.stringify(obj)).catch(error => {
    console.error(error);
});*/
    }
}

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
    fs.readdir('./public/uploads', function (err, items) {
        if (!err) {
            callback(items);
        }
    });
}

function removeUpload(item, callback) {
    fs.unlink(`./public/uploads/${item}`, function (err) {
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

function handleQr(key, items) {
    var qrPresent = false;
    items.forEach(function (i) {
        if (i.includes('syncherQr.key_')) {
            qrPresent = true;
        }
    });
    if (!qrPresent) {
        console.log('No QR found. Creating...');
        qrcode.toFile(__dirname + `/public/uploads/syncherQr.key_${key}.png`, `http://35.200.245.209?key=${key}`, {
            color: {
                dark: '#425f61', // Blue dots
                light: '#0000' // Transparent background
            }
        }, function (err) {
            if (err) throw err
            console.log('done')
        })
    } else {
        console.log('QR already there');
    }
}

app.get('/checkuploads', function (req, res) {
    if (req.query.key == undefined) {
        req.query.key = '';
    }
    //console.log(req.query.key);
    watchUploads(function (items) {
        // QR code finder
        var items = filterByKey(req.query.key, items);
        handleQr(req.query.key, items);
        res.jsonp({
            items: items
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
        // console.log(ress);
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

app.post('/pushSubscription', function (req, res) {
    push(req.cookies.push, {
        title: 'Welcome',
        options: {
            body: `Hello ${req.cookies.user}`,
            vibrate: [100, 50, 100]
        }
    });
    res.send('Got the subscription');
});

app.listen(port, function () {
    console.log('server started on port ' + port);
});


//SSL server
/*var https = require('https');
https.createServer({
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.cert')
}, app).listen(443, () => {
    console.log('HTTPS server started');
})*/
