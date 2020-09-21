interval = setInterval(()=>{getNotif();}, 500);
var pending = false;
const getNotif = async () => {
  var url = "";
  if (window.location.href.substring(window.location.href.length-1) == "/") {
    url = window.location.href.substring(0, window.location.href.length-1);
  }
  else {
    url = window.location.href;
  }
  const response = await fetch(url + '/get-notif');
  const resJson = await response.json();
  var notifDiv = document.getElementById('notifAlert');
  var notifText = document.getElementById('notifText');
  if (resJson.waitingJobList != 0 || resJson.delayedJobList != 0) {
    totalToDo = parseInt(resJson.waitingJobList) + parseInt(resJson.delayedJobList)
    $('#notifText').html('Hay ' + totalToDo + ' importaciones pendientes.')
    pending = true;
  }
  else {
    if (pending == true){
      pending = false;
      $('#notifFinishedBody').text(resJson.completedJobList + ' pedidos ingresados correctamente.')
      $('#notifFinishedToast').toast('show')
      if (resJson.failedJobList > 0) {
        $('#notifFailedBody').text(resJson.failedJobList + ' pedidos no pudieron ingresarse')
        $('#notifFailedToast').toast('show')
      }
    }
    else {
      if (resJson.failedJobList > 0) {
        $('#notifFailedBody').text('Hay ' + resJson.failedJobList + ' pedidos importados con problemas')
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
