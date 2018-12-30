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
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
})
var upload = multer({
    storage: storage
});
var currentHash;
var hash2;
app.use(bodyparser.urlencoded({
    extended: false
}))
var dbFunctions = {
    connect: function (cb) {
        mongo.connect(dbURL, function (err, db) {
            if (err) {
                console.log(err);
                //db.close();
                return err;
            } else {
                var col = db.collection('default');
                cb(col);
                db.close();
            }
        });
    },
    findAll: function (cb) {
        this.connect(function (col) {
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
        this.connect(function (col) {
            col.insert(obj);
            cb();
        });
    },
    removeDoc: function (id, cb) {
        this.connect(function (col) {
            console.log(`removing id ${id}`);
            col.remove({
                _id: new ObjectId(id)
            });
            cb();
        });
    }
};


app.use(express.static('./'));

function getHash() {
    dbFunctions.findAll(function (ress) {

        watchUploads(function (items) {
            console.log('uploads: ' + items);
            var str2 = items.join('');
            var currentHashUploads = crypto.createHash('md5').update(str2).digest("hex").toString();
            hash2 = currentHashUploads;
            console.log('uploads hash: ' + currentHashUploads);
        });

        var str = '';
        ress.forEach(function (item) {
            str += item._id;
        });
        currentHash = crypto.createHash('md5').update(str).digest("hex").toString();
        console.log('hash updated');
        return (currentHash);
    });
}

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


app.get('/checkuploads', function (req, res) {
    watchUploads(function (items) {
        res.jsonp({
            items: items
        });
    });

});

app.get('/testMongo', function (req, res) {
    dbFunctions.findAll(function (ress) {
        res.send(ress);
    });
});

app.post('/upload',
    upload.single('img'),
    function (req, res, next) {
        if (req.file) {
            //watchUploads();
            getHash();
            res.redirect('/');
        } else {
            res.send('No file');
        }
    });



app.post('/hashCheck', function (req, res) {
    //getHash();
    var clientHash = req.body.hash;
    var clientHash2 = req.body.hash2;

    if (clientHash === currentHash && clientHash2 === hash2) {
        res.jsonp({
            stat: "same"
        });
    } else {
        console.log("Client's hash change detected");
        res.jsonp({
            stat: "changed"
        });
    }
});

app.get('/clearDB', function (req, res) {
    mongo.connect(dbURL, function (err, db) {
        if (err) {
            console.log(err);
            res.send("DB error");
        } else {
            db.dropDatabase();
            getHash();
            res.send("DB dropped");
        }
    });
});

app.get('/push/:testString', function (req, res) {
    var val = req.params.testString;
    var time = new Date();

    dbFunctions.insert({
        val: val,
        time: time
    }, function () {
        getHash();
        res.redirect("/");
    });

});

app.post('/removeDoc', function (req, res) {
    var id = req.body.id;
    dbFunctions.removeDoc(id, function () {
        getHash();
        res.jsonp({
            status: 20
        });
    });
});

app.post('/removeUpload', function (req, res) {
    var item = req.body.item;
    console.log('removal req for ' + item);
    removeUpload(item, function () {
        getHash();
        res.jsonp({
            status: 20
        });
    });

});
app.listen(port, function () {
    console.log('server started on port ' + port);
    getHash();
});
