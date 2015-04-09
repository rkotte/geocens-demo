var sensors = {};
var geocens_api_key = "57378dc18d74bef1051312e29a26f0b3";

function init(){
  sensors = {};

  document.getElementById('title').innerText = "Sources";
  var el = document.getElementById('main');
  el.innerHTML = "<div id='content'><div id='geocens' class='sources'></div><div id='ogc' class='sources'></div></div>";
  el = document.getElementById('geocens');
  el.addEventListener("click", geocens_click,false);
  el = document.getElementById('ogc');
  el.addEventListener("click", ogc_click,false);
}

function geocens_click(){
  var el = document.getElementById('title');
  el.onclick = init;
  
  // use test data
  //sensors = geocensSensors;

  if(!sensors.length){
  document.getElementById('title').innerText = "Loading data...";
    var service = new Geocens.DataService({
      api_key: geocens_api_key
    });

    service.getRawSensors({
      done: function(data) {
        sensors = data;
       displaySensors();
       document.getElementById('title').innerText = "Geocens";
      },
      fail: function(error) {
        console.log("There was an Error:", error.statusText);
      }
    });
  } else {
   displaySensors();
   document.getElementById('title').innerText = "Geocens";
  }
}

function ogc_click(){
  var el = document.getElementById('title');
  el.onclick = init;
  
  // use test data
  // sensors = ogcSensors;

  if(!sensors.length){
  document.getElementById('title').innerText = "Loading data...";
  var service = new Geocens.SOS({
      service_url: "http://app.geocens.ca:8171/sos"
    });

    service.getObservation({
      offering: "Temperature",
      property: "urn:ogc:def:property:noaa:ndbc:Water Temperature",
      done: function (observations) {
        sensors = observations;
        displaySensorsOGC();
        document.getElementById('title').innerText = "OGC SOS - Temperature";
      },
      fail: function(error) {
        console.log("There was an Error:", error.statusText);
      }

    });
  } else {   
    displaySensorsOGC();
    document.getElementById('title').innerText = "OGC SOS - Temperature";
  }
}

function naturalCompare(a ,b) {
  var ax = [], bx = [];

  a.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ ax.push([$1 || Infinity, $2 || ""])});
  b.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ bx.push([$1 || Infinity, $2 || ""])});

  while(ax.length && bx.length) {
    var an = ax.shift();
    var bn = bx.shift();
    var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
    if(nn) return nn;
  }
  return ax.length - bx.length;
}

function displayIt(tmp){
  var tmp2 = "";
  tmpX = tmp.sort(naturalCompare); 
  var tmpObj = [];
  for(var a in tmpX) {
      if(!tmpObj[tmpX[a].charAt(0)]){
        tmpObj[tmpX[a].charAt(0)] = [];
      }
      tmpObj[tmpX[a].charAt(0)].push(tmpX[a]);
  }
  for(var a in tmpObj) {
    tmp2 += "<div id='Parent-"+ a.toUpperCase() +"' class='sensorIDParent'><div class='index'>" + a.toUpperCase() + "</div>" ;
    for(var b in tmpObj[a]) {
      tmp2 += "<div id='id_"+ tmpObj[a][b] +"' class='sensorID'>" + tmpObj[a][b] +"</div>";    
    }
    tmp2 += "</div>";
  }
  document.getElementById('main').innerHTML = tmp2;
}

function displaySensors(){
  var tmp = [];
  for(var a in sensors) {
    var tmpA = sensors[a].nickName;
    tmp.push(tmpA);
  }
    displayIt(tmp);
  $(document).ready(function(){$('div.sensorID').click(function() {itemClick(this.id)})});
}

function displaySensorsOGC() {
  var tmp = [];
  for(var a in sensors) {
    var tmpA = sensors[a]._attributes.procedure_id.split(":")[sensors[a]._attributes.procedure_id.split(":").length-1].split("_")[1];
    tmp.push(tmpA);
  }
  displayIt(tmp);
  $(document).ready(function(){$('div.sensorID').click(function() {itemClickOGC(this.id)})});  
}

function itemClicked(id, func, s, idLetter, tmpDesc ){
  document.getElementById('title').onclick = func;
  var tmp = reItemClick(s[0]);
  tmp2 = "<div class='itemBlock'>" + idLetter +"</div>";
    for(var a in s) {
      if(a === 'timestamp') {
        tmpDate = new Date(s[a]);
        tmp2 += "<div class='title"+a+" title'>" + a + ": </div>" + "<div class='item"+a+" item'>" + tmpDate.toGMTString()+ "</div>";        
      } else {
        tmp2 += "<div class='title"+a+" title'>" + a + ": </div>" + "<div class='item"+a+" item'>" + s[a]+ "</div>";
      }
    }
    tmp2 += "<hr id='line1'><hr id='line2'><style>.gm-style-iw{height: 50px;width: 150px;overflow: hidden;}</style><div id='map1'></div>";
    document.getElementById('title').innerText = "Details";
    document.getElementById('main').innerHTML = tmp2;
    makeMap(s.latitude, s.longitude, tmpDesc);
}

function itemClickOGC(id){
  var func = ogc_click;
  var s = sensors.filter(function(a){
        var tmp = a._attributes.procedure_id.split(":")[a._attributes.procedure_id.split(":").length-1].split("_")[1];
        if(tmp === id.split("_")[1])
          return a; 
        }
      );
  var tmp = reItemClick(s[0]);
  var idLetter = tmp.procedure_id.split(":")[6].charAt(0);    
  var tmpDesc = tmp.procedure_id.split(":")[6] + "<br>TEMP: <b>" + tmp.value +"</b>";
  itemClicked(id, func, tmp, idLetter, tmpDesc );
}

function itemClick(id){
  var func = geocens_click;
  var s = sensors.filter(function(a){
    var tmp = a.nickName;
      if(tmp === id.split("_")[1])
        return a; 
      }
      );
  var tmp = reItemClick(s[0]);
  var idLetter = tmp.nickName.charAt(0);
  var tmpDesc = tmp.nickName + "<br>ID: <b>" + tmp.id +"</b>";
  itemClicked(id, func, tmp, idLetter, tmpDesc );
}

function reItemClick(obj, tmp) {
  if(!tmp) var tmp = {};
  for(var a in obj){
    if(typeof(obj[a]) === 'object' ){
      if(a === 'loc') {
        tmp["longitude"] = String(obj[a][1]);
        tmp["latitude"] = String(obj[a][0]);
      }else{
        reItemClick(obj[a], tmp);
      }
    } else if(typeof(obj[a]) != 'function') {
    tmp[a] = obj[a];
    }
  }
 return tmp; 
}

function makeMap(lat,lng, tmpDesc){
      var map = new google.maps.Map(document.getElementById('map1'), {
      zoom: 5,
      center: new google.maps.LatLng(lat, lng),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();
    var marker, i;
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map: map
    });

    google.maps.event.addListener(marker, 'click', (function(marker, i) {
      return function() {
        infowindow.setContent(tmpDesc);
        infowindow.maxWidth = "100px";
        infowindow.open(map, marker);
      }
    })(marker, i));
}
