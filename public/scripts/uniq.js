/*Getting unique keys in different formats...*/
var uniq = {
    plain: function (len) {
        var s1 = Date.now().toString();
        var s2 = Math.random().toString().split('.')[1];
        var s3;
        if (len - s1.length > 2) {
            var rem = len - s1.length;
            s3 = s2.slice(0, rem);
        }
        return s1 + s3;
    }
};
