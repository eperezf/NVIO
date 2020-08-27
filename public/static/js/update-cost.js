console.log("Update cost running!");
function getCosto(){
  console.log("getCosto Runnin'!");
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
    localities.sort();
    console.log("Desde " + fromLocality + " hacia " + toLocality);
    console.log("Running Query");
    getCostoReq(localities);

  }


}

const getCostoReq = async (localities) => {
  document.getElementById("shippingCost").value = "Calculando...";
  console.log(localities);
  const response = await fetch(window.location.href + '/get-costo/' + localities[0] + "/" + localities[1]);
  const myJson = await response.json(); //extract JSON from the http response
  console.log(myJson);
  document.getElementById("shippingCost").value = myJson.costo;
  // do something with myJson
}
