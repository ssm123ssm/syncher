#!/usr/bin/env node
var express = require('express');
var port = 80;

var app = express();
var dbURL = 'mongodb://localhost:27017/db';
const mongo = require('mongodb').MongoClient;
var dbFunctions = {
    connect: function (cb) {
        mongo.connect(dbURL, function (err, db) {
            if (err) {
                console.log(err);
                db.close();
                return err;
            }
            var col = db.collection('default');
            console.log('connected');
            cb(col);
            db.close();
            console.log("DB closed");
        });
    },
    findAll: function (cb) {
        this.connect(function (col) {
            col.find({}, {
                _id: 0
            }).toArray(function (err, ress) {
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
    }
};


app.use(express.static('./'));

app.get('/testMongo', function (req, res) {
    dbFunctions.findAll(function (ress) {
        res.send(ress);
    });
});

app.get('/clearDB', function (req, res) {
    mongo.connect(dbURL, function (err, db) {
        if (err) {
            console.log(err);
            res.send("DB error");
        } else {
            db.dropDatabase();
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
        res.send(`instered value - ${val}`);
    });

});

app.listen(port, function () {
    console.log('server started on port ' + port);
});
