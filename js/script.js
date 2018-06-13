
/**
 * Function to load the current version from json file
 */
function loadVersion() {
    $.ajax({
        datatype: "json",
        url: 'version.json',
        contentType: 'application/json',
        beforeSend: function (xhr) {
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType("application/json");
            }
        },
        success: function (json) {
            var version = "v" + json.major + "." + json.minor + "." + json.patch + "-" + json.release;
            console.log("Version", version);
            $('#version').text(version);
        }
    });
}

function goToLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var txt = "" + position.coords.longitude + "," + position.coords.latitude + "";
            var view = map.getView();
            view.setCenter(ol.proj.fromLonLat(txt.split(',').map(Number)));
            view.setZoom(12);
        });
    }
}