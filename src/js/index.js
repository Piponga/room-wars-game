import Launcher from './Launcher';


$(document).ready(function () {
    (function () {
        let hostUrl = 'http://localhost:5000';
        let guestName = 'Guest' + Math.floor(Math.random() * 10000);

        $('.login-guest-form input').val(guestName);

        $(document.forms['login-guest-form']).on('submit', function (e) {
            e.preventDefault();
            let form = $(this);

            $('.error', form).html('');

            $.ajax({
                url: hostUrl + "/login",
                method: "POST",
                data: form.serialize(),
                complete: function (res) {
                    new Launcher($('.login-guest-form input').val(), res.responseText);

                    $('.login-shade').hide();
                },
                error: function (err) {
                    console.log(err);
                }
            });
        });
    })();
    // $.ajax({
    //     url: hostUrl,
    //     method: "POST",
    //     data: '',
    //     complete: function (res) {
    //         console.log(444, res.responseJSON);
    //     },
    //     error: function (err) {
    //         console.log(err);
    //     }
    // });
});