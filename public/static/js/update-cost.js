function getCosto(){
  var e = document.getElementById("toLocality");
  var toLocality = e.options[e.selectedIndex].text;
  if (toLocality == "Selecciona una comuna") {
    toLocality = false;
  }
  var e = document.getElementById("fromLocality");
  var fromLocality = e.options[e.selectedIndex].text;
  if (fromLocality == "Selecciona una comuna") {
    fromLocality = false;
  }
  if (fromLocality && toLocality) {
    console.log("FROM: " + fromLocality);
    console.log("TO: " + toLocality);
    localities = [fromLocality, toLocality];
    localities.sort((a, b) => a.localeCompare(b, 'es', {sensitivity: 'base'}))
    getCostoReq(localities);

  }


}

const getCostoReq = async (localities) => {
  document.getElementById("shippingCost").value = "Calculando...";
  const response = await fetch(window.location.href + '/get-costo/' + localities[0] + "/" + localities[1]);
  const resJson = await response.json();
  document.getElementById("shippingCost").value = resJson.costo;
  // do something with myJson
}
