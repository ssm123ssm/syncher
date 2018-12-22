var express = require('express');
var port = 80;
var bodyparser = require('body-parser');
var app = express();
var dbURL = 'mongodb://localhost:27017/db';
const mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
app.use(bodyparser.urlencoded({
    extended: false
}))
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
        res.redirect("/");
    });

});

app.post('/removeDoc', function (req, res) {
    var id = req.body.id;
    dbFunctions.removeDoc(id, function () {
        res.jsonp({
            status: 20
        });
    });
});

app.listen(port, function () {
    console.log('server started on port ' + port);
});
