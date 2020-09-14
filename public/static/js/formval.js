// I gave up on this script, I tried 7 different ways and nothing worked
// This was originally planned for dash-editar-perfil.pug

const small_companyName = document.getElementById('companyName-small');
const small_companyRut = document.getElementById('companyRut-small');
const small_companyTurn = document.getElementById('companyTurn-small');
const small_companyRepresentative = document.getElementById('companyRepresentative-small');
const small_contactNumber = document.getElementById('contactNumber-small');
const small_email = document.getElementById('email-small')

const form_whole = document.getElementById('editProfileInfo');

console.log(">>>>>> edit profile form validation script is running");

form_whole.addEventListener('submit', (e) => {
    e.preventDefault();
    const form_companyName = form_whole.querySelector('#companyName');
    const form_companyRut = form_whole.querySelector('#companyRut');
    const form_companyTurn = form_whole.querySelector('#companyTurn');
    const form_companyRepresentative = form_whole.querySelector('#companyRepresentative');
    const form_contactNumber = form_whole.querySelector('#contactNumber');
    const form_email = form_whole.querySelector('#email');
    checkInputs(form_companyName, form_companyRut, form_companyTurn, form_companyRepresentative, form_contactNumber, form_contactNumber);
});

function checkInputs(name, rut, turn, rep, num, mail){
    const nameVal = name.value.trim();
    const rutVal = rut.value.trim();
    const turnVal = turn.value.trim();
    const repVal = rep.value.trim();
    const numVal = num.value.trim();
    const mailVal = mail.value.trim();

    if(nameVal === ''){
        setErrorFor(name, 'El nombre de la compañía no puede quedar en blanco');
    }else{
        setSuccessfor(name);
    }

    if(mailVal === ''){
        setErrorFor(mail, 'El correo de la compañía no puede quedar en blanco');
    }else if(!isEmail(mailVal)){
        setErrorFor(mail, 'El formato del correo no es válido');
    }else{
        setSuccessfor(mail);
    }

    if(numVal.replace(/\s/g,'').length < 8){
        setErrorFor(num, 'El número de contacto debe tener al menos 8 dígitos');
    }else{
        setSuccessfor(num);
    }
}

function setErrorFor(input, message) {
    const formGroup = input.parentElement; // .form-group
    const small = formGroup.querySelector('small');

    small.innerText = message;
    formGroup.className = 'form-group error';
}

function setSuccessfor() {
    const formGroup = input.parentElement; // .form-group
    const small = formGroup.querySelector('small');

    formGroup.className = 'form-group success';
}

function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}