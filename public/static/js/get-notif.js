interval = setInterval(()=>{getNotif();}, 500);
var pending = false;
const getNotif = async () => {
  const response = await fetch(window.location.href + '/get-notif');
  const resJson = await response.json();
  var notifDiv = document.getElementById('notifAlert');
  var notifText = document.getElementById('notifText');
  if (resJson.waitingJobList != 0) {
    $('#notifText').html('Hay ' + resJson.waitingJobList + ' importaciones pendientes.')
    pending = true;
  }
  else {
    if (pending == true){
      pending = false;
      $('#notifFinishedBody').text(resJson.completedJobList + ' pedidos ingresados correctamente.')
      $('#notifFinishedToast').toast('show')
      if (resJson.failedJobList > 0) {
        $('#notifFailedBody').text(resJson.failedJobList + ' pedidos no pudieron ingresarse. Has click aquí para saber más')
        $('#notifFailedToast').toast('show')
      }
    }
    else {
      if (resJson.failedJobList > 0) {
        $('#notifFailedBody').text('Hay ' + resJson.failedJobList + ' pedidos importados con problemas. Has click aquí para revisarlos.')
        $('#notifFailedToast').toast('show')
      }
    }
    $('#notifText').html('No hay importaciones pendientes.')
    $('#notifAlert').removeClass('alert-primary');
    $('#notifAlert').addClass('alert-success');
    $('#notifSpinner').addClass('hidden')
    clearInterval(interval);


  }
}
