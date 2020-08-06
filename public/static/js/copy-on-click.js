var copyText;
var badge;

document.addEventListener('copy', function (e) {
    e.clipboardData.setData('text/plain', 'http://nvio.cl/track/' + copyText.childNodes[0].textContent);
    e.preventDefault();
});

function copyAsLink(clickedElement) {
    copyText = clickedElement;
    document.execCommand('copy');
    badge = document.getElementById(copyText.childNodes[1].id);

    badge.className = 'badge badge-pill badge-success';
    console.log('copyText.childNodes[1].id -> ' + copyText.childNodes[1].id);
    console.log('BEFORE LOG ' + copyText.childNodes[0].textContent);
    showThenHide(-1, copyText.childNodes[0].textContent);
}

function showThenHide(newState, inString) {
    setTimeout(function(){
        if(newState == -1){
            console.log('AFTER LOG ' + inString);
            badge.className = 'badge badge-pill badge-success hidden';
            console.log(badge.className);
        }
    }, 2000);
}