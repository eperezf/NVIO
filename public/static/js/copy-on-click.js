var copyText;

document.addEventListener('copy', function (e) {
    e.clipboardData.setData('text/plain', 'http://nvio.cl/track/' + copyText.childNodes[0].textContent.replace(' ',''));
    e.preventDefault();
});

function copyAsLink(clickedElement) {
    copyText = clickedElement;
    document.execCommand('copy');
}

function copySnackbar() {
    $('#notifCopiedBody').text(' Enlace de ' + copyText.childNodes[0].textContent.replace(' ','') + " copiado!")
    $('#notifCopiedToast').toast('show');
}
// TO DO: Give feedback through element styling when clicked, previously there was a poorly formatted and buggy badge to prompt when something was succesfully copied
