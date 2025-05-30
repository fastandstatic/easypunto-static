const { registerPlugin } = wp.plugins
const { PluginSidebar } = wp.editor
const { __ } = wp.i18n
const { Component } = wp.element

const filterStyle = {
  "margin-bottom": "200px",
}

class Test extends Component {
  render() {
    return (
      <PluginSidebar title={__("Location", "textdomain")}>
        <div>
          <div id="mapsvg"></div>
        </div>
        <div id="mapsvg-filters" style={filterStyle}></div>
      </PluginSidebar>
    )
  }

  loadMap() {
    if (document.getElementById("mapsvg") === null) {
      return
    }
    window.mapsvgAdmin = {
      getData: () => ({
        options: window.mapsvgBackendParams,
      }),
    }

    var external = {
      markerImages: window.mapsvgBackendParams.mapsvgMarkerImages,
      googleApiKey: window.mapsvgBackendParams.googleApiKey,
      prefetch: false,
    }

    var source = window.mapsvgBackendParams.googleApiKey
      ? window.mapsvgBackendParams.mapsPath + "/geo-calibrated/empty.svg"
      : window.mapsvgBackendParams.mapsPath + "/geo-calibrated/world.svg"

    var mapOptions = {
      // TODO change the source
      source: source,
      filters: { on: false },
      fitMarkers: true,
      defaultMarkerImage: mapsvg.routes.root + "markers/_pin_default.png",
      containers: { header: { on: false } },
      googleMaps: {
        on: !!window.mapsvgBackendParams.googleApiKey,
        apiKey: window.mapsvgBackendParams.googleApiKey,
      },
      database: {
        on: false,
        regionsTableName: "regions_0",
        objectsTableName: "objects_0",
      },
      events: {
        afterInit: (event) => {
          const { map } = event
          this.mapsvg = map

          this.mapsvg.setMarkersEditMode(true)

          var meta = wp.data.select("core/editor").getEditedPostAttribute("meta")
          if (!meta) {
            meta = []
          }

          var formData = {}

          if (meta.mapsvg_location && meta.mapsvg_location !== "null") {
            var locationData = JSON.parse(meta.mapsvg_location)

            var location = new mapsvg.location(locationData)

            var marker = new mapsvg.marker({
              location: location,
              mapsvg: map,
            })
            map.markerAdd(marker)
            formData["location"] = location.getData()

            if (this.mapsvg.options.googleMaps.on) {
              this.mapsvg.events.on("googleMapsLoaded", () => {
                var coords = {
                  lat: location.geoPoint.lat,
                  lng: location.geoPoint.lng,
                }
                this.mapsvg.googleMaps.map.setCenter(coords)
                this.mapsvg.googleMaps.map.setZoom(10)
              })
            }
          }

          var formBuilder = new mapsvg.formBuilder({
            container: jQuery("#mapsvg-filters")[0],
            schema: new mapsvg.schema({
              fields: [
                {
                  type: "location",
                  name: "Location",
                  label: "",
                  parameterNameShort: "location",
                },
              ],
            }),
            showNames: false,
            editMode: false,
            filtersMode: true,
            mapsvg: map,
            mediaUploader: null,
            data: formData,
            admin: null,
            closeOnSave: false,
            events: {
              init: (event) => {
                const { formElement, name, value } = event.data
                this.mapsvg.hideMarkers()

                const locationFormElement = formBuilder.getFormElementByType("location")

                if (locationFormElement && locationFormElement.value) {
                  this.locationCopy = this.createLocationCopy(locationFormElement.value)
                  if (this.locationCopy) {
                    this.watchMarkerChanges(locationFormElement, this.locationCopy)
                    this.mapsvg.setEditingMarker(this.locationCopy.marker)
                  }
                }

                this.mapsvg.setMarkerEditHandler((location) => {
                  if (this.locationCopy) {
                    this.mapsvg.markerDelete(this.locationCopy.marker)
                  }
                  this.locationCopy = location
                  this.mapsvg.setEditingMarker(this.locationCopy.marker)
                  const object = formBuilder.getData()
                  // const img = this.mapsvg.getMarkerImage(object, );
                  // this.locationCopy.marker.setImage(img);
                  locationFormElement.setValue(location.getData())
                  locationFormElement.triggerChanged()
                  this.watchMarkerChanges(locationFormElement, this.locationCopy)
                })
              },
              "delete.formElement": (event) => {
                const { formElement, name, value } = event.data
                if (formElement.type === "location" && this.locationCopy) {
                  this.mapsvg.markerDelete(this.locationCopy.marker)
                  delete this.locationCopy
                }
              },
              "change.formElement": (event) => {
                const { formElement, name, value } = event.data
                if (formElement.type === "location") {
                  const location = JSON.stringify(value)
                  wp.data.dispatch("core/editor").editPost({ meta: { mapsvg_location: location } })

                  if (this.locationCopy) {
                    if (
                      value &&
                      (this.locationCopy.geoPoint.lat != value.geoPoint.lat ||
                        this.locationCopy.geoPoint.lng != value.geoPoint.lng)
                    ) {
                      if (this.mapsvg.options.googleMaps.on) {
                        var coords = {
                          lat: value.geoPoint.lat,
                          lng: value.geoPoint.lng,
                        }
                        this.mapsvg.googleMaps.map.setCenter(coords)
                        this.mapsvg.googleMaps.map.setZoom(17)
                      }
                    }
                    this.mapsvg.markerDelete(this.locationCopy.marker)
                  }

                  if (value) {
                    this.locationCopy = new mapsvg.location(value)

                    const marker = new mapsvg.marker({
                      location: this.locationCopy,
                      mapsvg: this.mapsvg,
                    })

                    this.mapsvg.markerAdd(this.locationCopy.marker)
                    this.mapsvg.setEditingMarker(marker)
                    this.watchMarkerChanges(formElement, this.locationCopy)
                  }
                }
              },
            },
          })
          formBuilder.init()
        },
      },
    }

    var map = new mapsvg.map("mapsvg", { options: mapOptions }, external)
  }

  createLocationCopy(locationFieldData) {
    if (locationFieldData) {
      let locationTemp = new mapsvg.location(locationFieldData)
      let markerCopy = new mapsvg.marker({
        location: locationTemp,
        mapsvg: this.mapsvg,
      })
      this.mapsvg.markerAdd(markerCopy)
      return locationTemp
    }
  }

  watchMarkerChanges(locationFormElement, location) {
    if (location && location.marker) {
      location.marker.events.on("change", () => {
        if (location.marker.isMoving()) {
          return false
        }
        locationFormElement.setValue(location.getData())
        locationFormElement.triggerChanged()
      })
    }
  }

  componentDidMount() {
    var _this = this
    setTimeout(function () {
      _this.loadMap()
      jQuery('button[aria-label="Location"]').on("click", function () {
        setTimeout(function () {
          _this.loadMap()
        }, 500)
      })
    }, 1000)
  }

  componentWillUnmount() {
    if (this.mapsvg) {
      this.mapsvg.destroy()
      delete this.locationCopy
      this.mapsvg = null
    }
  }
}

registerPlugin("mapsvg-sidebar", {
  icon: "location",
  render: Test,
})
