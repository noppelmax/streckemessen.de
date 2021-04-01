
function search() {
	searchText = document.getElementById("searchText").value;
	searchForText(searchText);
}

function searchForText(searchText) {
	console.log("searching for: ", searchText);

	$.getJSON("https://nominatim.openstreetmap.org/search?q=" + searchText + "&format=json&countrycodes=de,ch,fr", function (json) {
		var txt = "" + json[0].lon + "," + json[0].lat + "";
		console.log(txt);

		var view = map.getView();
		view.setCenter(ol.proj.fromLonLat(txt.split(',').map(Number)));
		view.setZoom(12);
	});
}

var raster = new ol.layer.Tile({
	source: new ol.source.OSM()
});

var source = new ol.source.Vector();

var styleFinished = [
	new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0)'
		}),
		stroke: new ol.style.Stroke({
			color: '#0267fd',
			width: 3
		}),
		image: new ol.style.Circle({
			radius: 7,
			fill: new ol.style.Fill({
				color: '#0267fd'
			})
		})
	}),
	new ol.style.Style({
		image: new ol.style.Circle({
			radius: 4,
			fill: new ol.style.Fill({
				color: '#0267fd'
			})
		}),
		geometry: function (feature) {
			// return the coordinates of the first ring of the polygon
			var coordinates = feature.getGeometry().getCoordinates();
			return new ol.geom.MultiPoint(coordinates);
		}
	})
];

var vector = new ol.layer.Vector({
	source: source,
	style: styleFinished,
	wrapX: false
});

var select = new ol.interaction.Select({
	wrapX: false
});

var modify = new ol.interaction.Modify({
	features: select.getFeatures()
})


/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;


/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;


/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Click to continue drawing the line';


/**
 * Handle pointer move.
 * @param {ol.MapBrowserEvent} evt The event.
 */
var pointerMoveHandler = function (evt) {
	if (evt.dragging) {
		return;
	}
	/** @type {string} */
	var helpMsg = 'Click to start drawing';

	if (sketch) {
		helpMsg = continueLineMsg;
	}

	helpTooltipElement.innerHTML = helpMsg;
	helpTooltip.setPosition(evt.coordinate);

	helpTooltipElement.classList.remove('hidden');
};


var map = new ol.Map({
	layers: [raster, vector],
	target: 'map',
	view: new ol.View({
		center: [8.401285, 48.999550],
		zoom: 12
	}),
	controls: ol.control.defaults({
		attribution: false,
		zoom: false,
	})
});

map.on('pointermove', pointerMoveHandler);


map.getViewport().addEventListener('mouseout', function () {
	helpTooltipElement.classList.add('hidden');
});

var draw; // global so we can remove it later

setTimeout(function () {
	$('.infoalert').remove();
}, 10000);

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function (line) {
	var length = ol.Sphere.getLength(line);
	var output;
	if (length > 100) {
		output = (Math.round(length / 1000 * 100) / 100) +
			' ' + 'km';
	} else {
		output = (Math.round(length * 100) / 100) +
			' ' + 'm';
	}
	return output;
};


var styleDrawing = [
	new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0.2)'
		}),
		stroke: new ol.style.Stroke({
			color: '#0267fd',
			lineDash: [10, 10],
			width: 3
		}),
		image: new ol.style.Circle({
			radius: 5,
			stroke: new ol.style.Stroke({
				color: '#0267fd'
			}),
			fill: new ol.style.Fill({
				color: 'rgba(255, 255, 255, 0.2)'
			})
		})
	}),
	new ol.style.Style({
		image: new ol.style.Circle({
			radius: 4,
			fill: new ol.style.Fill({
				color: '#0267fd'
			})
		}),
		geometry: function (feature) {
			// return the coordinates of the first ring of the polygon
			var coordinates = feature.getGeometry().getCoordinates();
			return new ol.geom.MultiPoint(coordinates);
		}
	})
];

var draw;

function addInteraction() {
	var type = 'LineString';
	draw = new ol.interaction.Draw({
		source: source,
		type: type,
		style: styleDrawing
	});
	map.addInteraction(draw);

	createMeasureTooltip();
	createHelpTooltip();

	var drawListener;
	var modifyListener;
	draw.on('drawstart',
			function (evt) {
				$('.infoalert').remove();

				// set sketch
				sketch = evt.feature;

				/** @type {ol.Coordinate|undefined} */
				var tooltipCoord = evt.coordinate;

				drawListener = sketch.getGeometry().on('change', function (evt) {
					var geom = evt.target;
					var output = formatLength(geom);
					tooltipCoord = geom.getLastCoordinate();

					measureTooltipElement.innerHTML = output;
					measureTooltip.setPosition(tooltipCoord);
				});
			}, this);

	draw.on('drawend',
			function (evt) {
				measureTooltipElement.className = 'tooltip tooltip-static';
				measureTooltip.setOffset([0, -7]);

				/* Disable drawing more than one LineString */
				map.removeInteraction(draw);
				helpTooltipElement.remove();
				map.addInteraction(select);
				map.addInteraction(modify);
				//select.getFeatures().push(evt.features);
			}, this);
}

document.addEventListener('keydown', function (e) {
	if (e.which == 8 || e.which == 27 || e.which == 85)
		draw.removeLastPoint()
});

/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
	if (helpTooltipElement) {
		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	}
	helpTooltipElement = document.createElement('div');
	helpTooltipElement.className = 'tooltip tooltip-help hidden';
	helpTooltip = new ol.Overlay({
		element: helpTooltipElement,
		offset: [15, 0],
		positioning: 'center-left'
	});
	map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
	if (measureTooltipElement) {
		measureTooltipElement.parentNode.removeChild(measureTooltipElement);
	}
	measureTooltipElement = document.createElement('div');
	measureTooltipElement.className = 'tooltip tooltip-measure';
	measureTooltip = new ol.Overlay({
		element: measureTooltipElement,
		offset: [0, -15],
		positioning: 'bottom-center'
	});
	map.addOverlay(measureTooltip);
}

var locations = document.getElementsByClassName('location');
for (var i = 0, ii = locations.length; i < ii; ++i) {
			locations[i].addEventListener('click', relocate);
			}

			function relocate(event) {
			var data = event.target.dataset;
			searchForText(data.name);
			}

			/* Go to default view */
			searchForText("Karlsruhe");
			map.getView().setZoom(Number(13));

			goToLocation();

			addInteraction();
			loadVersion();
