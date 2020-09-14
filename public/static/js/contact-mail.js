$(document).ready( function() {
    $('#submitMessage').click(function (e) {
        var email = $('#contactEmail').val();
        var subject = $('#subjectEmail').val();
        var message = $('#messageText').val();
        var isValid_email = validateEmail(email) ? true : false;
        var isValid_subject = subject.length >= 2 && subject.length <= 100 ? true : false;
        var isValid_message = message.length >= 10 && message.length <= 3000 ? true : false;
        var snack = document.getElementById("snackbar");

        if(!isValid_email) {
            e.preventDefault();
            invalidSnack(snack, "El correo es inválido");
        }

        if(!isValid_subject) {
            e.preventDefault();
            invalidSnack(snack, "El asunto debe tener entre 2 y 100 caracteres");
        }

        if(!isValid_message) {
            e.preventDefault();
            invalidSnack(snack, "El mensaje debe tener entre 10 y 3000 caracteres");
        }

        // (implicit) Otherwise, mail stuff
    });
});

function validateEmail(stringToTest){
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(stringToTest).toLowerCase());
}

function invalidSnack(obj, message){
    obj.innerText = message;
    obj.className = "show snack-red";
    setTimeout(function(){
        obj.className = obj.className.replace("show", "");
        obj.innerText = "";
    }, 3000);
}