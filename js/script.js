
/**
 * Function to load the current version from json file
 */
function loadVersion(){
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
            var version = "v" + json.major + "." + json.minor + "." + json.patch + " " + json.release;
            console.log("Version", version);
            $('#version').text(version);
        }
    });
}