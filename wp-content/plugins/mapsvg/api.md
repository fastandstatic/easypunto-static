## Quick start

MapSVG exposes a global object `mapsvg` on the window. It contains various classes and methods.

For example, you can check if the map is viewed on mobile device (but not on tablet):

```js
mapsvg.utils.env.isPhone()
```

Other `mapsvg` uses will be shown below.

## Map

#### Get

Get map by index (in the order of creation):

```js
const map_1 = mapsvg.get(0)
const map_2 = mapsvg.get(1)
const map_3 = mapsvg.get(3)
```

Get map by ID:

```js
const map = mapsvg.getById(254)
```

Get all of created maps:

```js
const maps = mapsvg.instances
```

#### Create (by ID)

Create a new map from the settings previously created in MapSVG control panel, by providing the MAP_ID of the created map:

```js
const map = new mapsvg.map("html-conainer-id", {
  id: MAP_ID,
  options: {
    loadingText: "Loading map...",
  },
})
```

When you use the code above, mapsvg will make a request to the server and get the SVG file and map options. It is essential to provide the loading message, to show it to the user while mapsvg loads data from the server.

#### Create (standalone)

Create a new standalone map, without connection to the server:

```js
const map = new mapsvg.map(
              "html-conainer-id",
              {
                options: {
                  source: "path/to/file.svg"
                  loadingText: "Loading map...",
                },
              }
            )
```

#### Update

When the map is created, you can update any options using the `update` method:

```js
map.update({
  zoom: {
    on: true,
  },
})
```

It is equivalent to calling the corresponding setter method:

```js
map.setZoom({ on: true })
```

#### Destroy

```js
map.destroy()
```

#### Events

You can listen to the map events by using the `mapsvg.events.on()` method:

```js
map.events.on("zoom", () => {
  console.log("map zoomed to " + mapsvg.zoomLevel)
})
```

Turn off all or one event handlers:

```js
map.events.off("zoom")

// or, remove event handler created previously:
map.events.on("zoom", eventHandler)
map.events.off("zoom", eventHandler)
```

## Marker

#### Get

Get all or one marker from mapsvg instance:

```js
const markers = map.markers
const markerById = map.getMarker(MARKER_ID)
```

#### Create

After you have created the map, you can add a `Marker`. Creating a marker requires providing a `Location`, and `Object` (if you want to show some data on click on the marker):

```js
const map = new mapsvg.map(CONTAINER_ID, { source: "path/to/file.svg })

const location = new mapsvg.location({
        geoPoint: new mapsvg.geoPoint({lat: 55.12, lng: 12.87}),
        img: "/path/to/markers/user-location.svg",
      })

const marker = new mapsvg.marker({
                location,
                object: {
                  field_1: "Hello world!",
                  field_2: "Apples and oranges",
                },
                map,
              })
```

#### Update

Show/hide the marker

```js
marker.show()
marker.hide()
```

Update marker coordinates:

```js
marker.update({
  geoPoint: new mapsvg.geoPoint({ lat: 55.12, lng: 12.87 }),
})
```

#### Delete

```js
marker.delete()
```

## Repositories

MapSVG has 2 data sets (called repositories): `map.objectsRepository` and `map.regionsRepository`.

`map.objectsRepository` contains what you create in the "Databas" tab in MapSVG control panel.
`map.regionsRepository` contains what you create in the "Regions" tab in MapSVG control panel.

Both of the repositories have the same structure and the same methods.

#### Get

When you need to get on or more of the created maps instances, you can do so via `MapSVG` global variable.

Get map by index (in the order of creation):

```js
const allObjects = map.objectsRepository.getLoaded()
const allRegions = map.regionsRepository.getLoaded()

const object = map.objectsRepository.findById(OBJECT_ID)
const region = map.regionsRepository.findById(OBJECT_ID)
```

Search:

```js
const filteredObjects = map.objectsRepository.find({ filters: { category: 1 } })
const filteredRegions = map.regionsRepository.find({ filters: { category: 1 } })
```

You can call the method above outside of the map. When you call it, MapSVG makes a request to the server, gets the results and reloads markers on the map and directory items, and changes selected filters fields.

#### Create / Update / Delete

You can't modify objects using JavaScript API - you can do that only in MapSVG cotrol panel.
