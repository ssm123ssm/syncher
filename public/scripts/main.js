var firstRun = true;

$(function () {

    var scope = angular.element($("#ngapp")).scope();
    var urlnow = window.location.href;
    if (urlnow.includes('key=')) {
        var key = urlnow.split('key=')[1];
        $("#pvtKey").val(key);
        $('#setKey').click();
    }
    $(".remove").click(function (e) {
        e.preventDefault();
    });

    $('#pushData').keypress(function (event) {
        if (event.keyCode == 13) {
            $('#sendMsg').click();
        }
        if (event.keyCode == 27) {
            $("#closeCreatePost").trigger('click');
        }
    });
    $('#pvtKey').keypress(function (event) {
        if (event.keyCode == 13) {


            $('#setKey').click();
        }
    });
    var frm = $('#form1');
    frm.submit(function (ev) {

    });

    $(".qr").click(function () {

        $(".qr").fadeOut(400);
    });

    $('.qr-btn').click(function () {
        //debugger;
        $(".qr").fadeIn(400);
    });
    $("#user").click(function (ev) {
        var el = $("#user");
        this.contentEditable = true;
        el.focusout(function () {
            scope.user = el.html();
            scope.$apply();
            el.contentEditable = false;
            Cookies.set('user', scope.user);
        });
        el.keypress(function (ev) {
            if (ev.keyCode == 13) {
                this.blur();
            }
        });
    });

    function readURL(input) {

        if (input.files && input.files[0]) {
            if (input.files[0].type.includes('image')) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $("#imagePreviewFrame").css("display", "block");
                    $('#imagePreview').attr('src', e.target.result);
                    $('#imagePreview').hide();
                    $('#imagePreview').fadeIn(650);
                }
                reader.readAsDataURL(input.files[0]);
            } else {
                console.log('not an image, file type is %s', input.files[0].type);
            }

        }
    }
    $("#imgupload").change(function () {
        readURL(this);
        var scope = angular.element($("#ngapp")).scope();
        scope.fileAttached = true;
        scope.attachedFileName = this.files[0].name;
        scope.$apply();
    });

    $("#closeCreatePost").click(function () {
        var el = $("#createPost");
        el.fadeOut(500);
    });
    $("#createBtn").click(function () {
        $("#createPost").fadeIn(500);
        $("#pushData").focus();
    });
});
var app = angular.module('myApp', []);
app.directive("msguser", function () {
    return {
        restrict: "EA",
        link: function (scope, elem, attrs) {
            $(elem).click(function () {
                scope.$parent.triggerCreate('message');

            });
        }
    }
});
app.controller('ctrl', function ($scope) {
    $scope.status = "On";
    $scope.user = 'anonymous';
    $scope.mode = 'public';
    $scope.key = '';
    $scope.key_visible = false;
    $scope.docs = [];
    $scope.msgs = [];
    $scope.synching = 1;
    $scope.msgLed = 'idle';
    $scope.indicator = 'idle';
    $scope.fileAttached = false;
    $scope.postBehaviour = 'post';
    $scope.postToACpecific = false;
    $scope.attachedFileName = '';
    $scope.turnOffLed = function () {
        $scope.msgLed = 'idle';
    }
    $scope.triggerCreate = function (postBehaviour) {
        $scope.postBehaviour = postBehaviour;
        //$scope.$apply();
        $("#createBtn").trigger('click');
    }
    $scope.setPostBehaviour = function (val) {
        $scope.postBehaviour = val;
    }
    $scope.removeFile = function () {
        $("#imgupload").val('');
        $scope.fileAttached = false;
        $scope.attachedFileName = '';
        $("#imagePreviewFrame").css("display", "none");
    }
    $scope.pvt = function () {
        // debugger;
        firstRun = true;
        synch.clearTimeouts();
        var oldKey = $scope.key;
        $scope.key = $("#pvtKey").val();
        if (oldKey != $scope.key) {
            $('.qr').fadeIn(400);
        }
        Cookies.set('key', $scope.key);
        if ($("#pvtKey").val() == null || $("#pvtKey").val() == '') {
            $scope.mode = 'public';

            $scope.key_visible = false;
        } else {
            $scope.mode = 'private';
            $scope.key_visible = true;
        }

        console.log($scope);
        $scope.getData();
        //going public feed. handle page reload
        //$scope.getDocs();
    };
    $scope.push = function () {

        //checking for attachments
        var el = document.getElementById("imgupload");
        console.log(el.files);
        if (el.files && el.files[0]) {
            console.log('attachement detected');
            $("#attachmentDescription").val($("#pushData").val());
            $('#form1').submit();
        } else {
            //Change starts here
            var val = $("#pushData").val();
            $scope.indicator = 'busy';
            $scope.synching = true;
            var url = '/push';
            var dataToBeSent = {
                data: val,
                key: $scope.key,
                user: $scope.user,
                user_id: $scope.user_id,
                behaviour: $scope.postBehaviour
            };
            if (dataToBeSent.behaviour == 'message') {
                firstRun = true;
            }

            if ($scope.postToACpecific) {
                dataToBeSent.postTo = $scope.postTo;
                $scope.postToACpecific = false;
            }
            synch.clearTimeouts();
            $.ajax({
                url: url,
                method: 'POST',
                data: dataToBeSent,
                success: function (data) {
                    $("#pushData").val('');
                    $("#closeCreatePost").trigger('click');
                    $scope.getData();
                    console.log('OK');
                    $scope.synching = false;
                    $scope.$apply();
                }

            });
        }



    }
    $scope.remove = function (id) {
        $scope.synching = true;
        $scope.indicator = 'busy';
        synch.clearTimeouts();
        $.ajax({
            method: 'POST',
            data: {
                id: id
            },
            url: "/removeDoc",
            success: function (data) {
                if (data.status == 20) {
                    $scope.getData();
                }
                $scope.synching = false;
            },
            error: function () {
                console.log('error on removal');
                $scope.synching = false;
            }
        });
    }
    $scope.removeUpload = function (item) {
        $scope.synching = true;
        $.ajax({
            method: 'POST',
            data: {
                item: item
            },
            url: "/removeUpload",
            success: function (data) {
                if (data.status == 20) {
                    synch.clearTimeouts();
                    $scope.getData();
                }
                $scope.synching = false;
            },
            error: function () {
                console.log('error on removal');
                $scope.synching = false;
            }
        });
    }

    $scope.getDocs = function () {

        $.ajax({
            method: 'GET',
            url: "/testMongo",
            data: {
                key: $scope.key
            },
            success: function (data) {

                //$scope.msgs = [];
                //$scope.docs = [];
                var newMessages = [];

                var newDocs = [];


                data.forEach(function (item) {
                    if (item.behaviour == 'message') {
                        newMessages.push(item);
                        //$scope.msgs.push(item);
                    }
                    if (item.behaviour == 'post') {
                        newDocs.push(item);
                        //$scope.docs.push(item);
                    }
                });
                //notifier.messages($scope.msgs, newMessages);
                if (window.Notification && !firstRun) {
                    notifier.messages($scope.msgs, newMessages, $scope);
                } else {
                    if (!firstRun) {
                        //alert(firstRun);
                        notifier.blink($scope);
                    }
                }

                processDocs(newDocs);

                $scope.msgs = newMessages;
                $scope.docs = newDocs;
                // $scope.docs = data;
                firstRun = false;
                $scope.synching = false;
                var arr = [];
                data.forEach(function (item) {
                    arr.push(item._id);
                });
                var obj = {
                    data: arr,
                    key: $scope.key,
                    url: '/hashCheck',
                    callback: function () {
                        console.log('Docs hash changed. Resynching...');
                        $scope.getDocs();
                    },
                    indicator: {
                        scope: $scope,
                        on: 'on',
                        off: 'idle',
                        error: 'error'
                    }
                }
                $scope.$apply();
                synch.synchNow(obj);
            },
            error: function () {
                console.log('error on getting docs');
                $scope.synching = false;
                $scope.$apply();
            }
        });
    }

    $scope.getUploads = function () {
        $.ajax({
            method: 'GET',
            url: '/checkUploads',
            data: {
                key: $scope.key
            },
            success: function (data) {
                var obj = {
                    data: data.items,
                    key: $scope.key,
                    url: '/uploadsHashCheck',
                    callback: function () {
                        console.log('Uploads hash changed. Resynching...');
                        $scope.getUploads();
                    },
                    indicator: {
                        scope: $scope,
                        on: 'on',
                        off: 'idle',
                        error: 'error'
                    }
                }
                var items = processUploads(data.items);

                $scope.uploads = items;
                synch.synchNow(obj);
                $scope.$apply();
            },
            error: function () {
                console.log('error on getting uploads');
                $scope.synching = false;
                $scope.$apply();
            }
        });
    }
    $scope.getData = function () {
        $scope.host = window.location.origin + '?key=' + $scope.key;
        $scope.getDocs();
        $scope.getUploads();
    }

    //coockie
    if (Cookies.get('key')) {
        $("#pvtKey").val(Cookies.get('key'));
        $scope.pvt();
    } else {
        Cookies.set('key', $scope.key);
    }
    if (Cookies.get('user')) {
        $scope.user = Cookies.get('user');
        $scope.user_id = Cookies.get('user_id');
    } else {
        Cookies.set('user', 'anonymous');
        Cookies.set('user_id', uniq.plain(18));
    }

    $('.qr').fadeIn(400);

});

function genWaves(speed) {
    var waves = new SineWaves({
        el: document.getElementById('waves'),

        speed: speed,

        width: '100px',

        height: '30px',

        ease: 'SineInOut',

        wavesWidth: '70%',

        waves: [
            {
                timeModifier: 4,
                lineWidth: 1,
                amplitude: -25,
                wavelength: 25
    },
            {
                timeModifier: 2,
                lineWidth: 2,
                amplitude: -50,
                wavelength: 50
    }, {
                timeModifier: 3,
                lineWidth: 1,
                amplitude: -25,
                wavelength: 25
    }, {
                timeModifier: 1,
                lineWidth: 1,
                amplitude: -25,
                wavelength: 25
    }
  ],
        // Called on window resize
        resizeEvent: function () {
            var gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
            gradient.addColorStop(0, "rgba(23, 210, 168, 0.2)");
            gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
            gradient.addColorStop(1, "rgba(23, 210, 168, 0.2)");

            var index = -1;
            var length = this.waves.length;
            while (++index < length) {
                this.waves[index].strokeStyle = gradient;
            }

            // Clean Up
            index = void 0;
            length = void 0;
            gradient = void 0;
        }
    });
    return waves;
}
var wave = genWaves(4);

function processDocs(docs) {
    docs.forEach(function (item) {
        if (item.val.includes('http') && item.val.includes('/') && item.val.includes('.') && item.val.includes(':')) {
            item.type = 'link';
        } else {
            item.type = 'non-link';
        }
    });
    docs.reverse();
}

function processUploads(items) {
    //console.log(items);
    var scope = angular.element($("#ngapp")).scope();
    var out = [];
    items.forEach(function (item) {
        var obj = {
            upload: item
        };
        if (item.split('.').length > 1) {
            var ext = item.split('.')[item.split('.').length - 1];
            if (ext == 'jpg' || ext == 'png' || ext == 'jpeg' || ext == 'bmp') {
                obj.type = 'image';
            }
        }
        if (item.includes('syncherQr.key_')) {
            obj.type = 'qr';
            scope.qrLink = `/qr/${item}`;
            scope.$apply();
            //$('.qr').fadeIn(400);
        }

        out.push(obj);
    });
    return out;
}
