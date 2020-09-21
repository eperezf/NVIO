async function deleteFailedJob(job){
  url = window.location.origin
  fetchurl = url + "/dashboard/hist-pedidos/delete-error/"
  result = await postData(fetchurl, {jobId: job});
  if (result.status == "OK") {
    $('#' + job).remove();
  }
}

async function postData(url = '', data = {}) {
  console.log(data);
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  });
  return response.json();
}
