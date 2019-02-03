var notifier = {
    messages: function (old, new_, blinker) {

        var newMessages_ = [];
        var oldMessages_ = [];

        old.forEach(function (item) {
            oldMessages_.push(item._id);
        });
        new_.forEach(function (item) {
            newMessages_.push(item._id);
        });

        for (var i = 0; i < new_.length; i++) {
            if (oldMessages_.indexOf(newMessages_[i]) < 0) {
                notifier.notifyMessage(new_[i].val, blinker);
                notifier.blink(blinker);
            }
        }
    },
    notifyMessage: function (body, blinker) {
        if ('Notification' in window) {
            Notification.requestPermission(function (res) {
                if (res === 'granted') {
                    const notification = new Notification("New message", {
                        body: body
                    });
                    notification.onclick = function () {
                        blinker.msgLed = 'idle';
                        blinker.$apply();
                        window.focus();
                        notification.close();

                    }

                }
            });
        }


    },
    blink: function (blinker) {
        blinker.msgLed = 'on';
        blinker.$apply();
    }
}
