/*Syncher.js
used to synch data with server.
synchNow accepts a string array, an specific key and and url of server endpoint.
hashes the string array and waits for the server's response.
server responds with a json {
status:"changed" OR "not changed"
}
if is changed, the callback is called, otherwise resynches after 5000ms delay.
server side handling is done with syncher node package.

Can pass an Indicator key to synchnow method, containing an object with a angular scope which has an indicator value, and css class names for on, off and error statuses
*/

var timeOuts = [];
var probeRate = 1000;
var synch = {
    generateHash: function (data) {
        if (data.length == 0) {
            data = [];
        }
        var plain = '';
        data.forEach(function (item) {
            plain += item;
        });
        //console.log(`plain: ${plain}`);
        var hash = CryptoJS.MD5(plain);
        //console.log(`hash: ${hash}`);
        return hash;
    },

    synchNow: function (obj) {
        var data = obj.data;
        var key = obj.key;
        var url = obj.url;
        var callback = obj.callback;
        if (obj.indicator != undefined) {
            obj.indicator.scope.indicator = obj.indicator.on;
            obj.indicator.scope.$apply();
        }
        $.ajax({
            method: 'POST',
            data: {
                hash_docs: synch.generateHash(data).toString(),
                key: key,
            },
            url: url,
            success: function (data_r) {
                var changed = data_r.status == 'changed' ? true : false;

                if (obj.indicator != undefined) {

                    obj.indicator.scope.indicator = obj.indicator.off;
                    obj.indicator.scope.$apply();
                }
                if (changed) {

                    console.log('hash changed. Performing callback');
                    //clearTimeout(timeOut);
                    callback();
                } else {
                    //console.log('hash not changed');
                    // clearTimeout(t);
                    timeOuts.push(setTimeout(function () {
                        synch.synchNow(obj)
                    }, probeRate));
                }
            },
            error: function (err, ex) {
                //alert(ex);
                //alert(ex);
                if (obj.indicator != undefined) {
                    obj.indicator.scope.indicator = obj.indicator.error;
                    obj.indicator.scope.$apply();
                }
                timeOuts.push(setTimeout(function () {
                    synch.synchNow(obj);
                }, 2000));
                //synch.synchNow(obj);
                console.log('Error on synchNow function');
            }
        });
    },
    clearTimeouts: function () {
        timeOuts.forEach(function (item) {
            clearTimeout(item);
        });
    }
};
