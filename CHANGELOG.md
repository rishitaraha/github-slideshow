# Change Log

## Create polygon drawing tool in Cesium

### 0.1.0 - 2022-11-16

- Start

### 0.1.0 - 2022-11-17

- Struct a project with react, cesium

### 0.2.0 - 2022-11-18

- Add common events and maptool implementations
- Add primitives for polygon and polyline
- Add a mixin named drawingTools for polygon drawing
- Add polygon drawing tool like as default drawing: mouse left click -> create vertex, mouse right click -> finish drawing

### 0.2.1 - 2022-11-21

- Fix review issue
- Add marker(following mouse cursor) on drawing.
- Event implementation
- Fix extendable line style

### 0.2.2 - 2022-11-22

- Add comments
- Adding snap functionalities (working on)

### 0.2.3 - 2022-11-23

- Add snap functionality

### 0.2.4 - 2022-11-24

- Dragging vertex
- Creating a vertex on edge

### 0.2.5 - 2022-11-25

- Finished all functionalities

### 0.2.6 - 2022-11-26

#### Fixed issues on MR [1](https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1)

- Use the arrow function (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1178775358)
- Remove window object, use React Context (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1178819202)
- Not run in a non-dev environment (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1185705309)

#### Merge AaravMapViewer and AaravViewer (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1185718048)

#### Add an example for "Why do we need to raise this event here?" (https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/1#note_1185728653)

### 0.2.7 - 2022-11-29

- fix flickering polygon issue

### 0.2.8 - 2022-12-02

- add imagery layer and terrain

### 0.2.9 - 2022-12-6

- fix imagery layer and terrain

### 0.3.0 - 2022-12-7

- fix drawing tool on terrain

### 0.3.1 - 2022-12-12

- load MVT in Cesium

### 0.3.2 - 2022-12-14

- line drawing tool and use local package aereo-cesium

### 0.3.3 - 2022-12-15

- clear code related with aarav and use aereo-cesium local package

### 0.3.4 - 2022-12-19

- Add remove/redraw function for each tools

### 0.3.5 - 2022-12-22

- 2d/3d switcher

### 0.3.6 - 2022-12-27

- mvt-imagery-provider on vite environment

### 0.3.7 - 2023-01-03

- gis14 import wkt to cesium

### 0.3.8 - 2023-01-10

- gis4 import/export geojson
- move camera very small amount to update geometries
- fix create polygon/line from positions function

### 0.3.9 - 2023-01-12

- gis4 export geojson seperately polygon/line

### 0.4.0 - 2023-01-13

- implemented point drawing tools

### 0.4.1 - 2023-01-13

- gis4 import/export points in wkt
- gis4 import/export points in geojson

### 0.4.2 - 2023-01-25

- gis18 User is not able to disable edit mode for the existing features on the map

### 0.4.3 - 2023-01-31

- gis22 Display list of features drawn on map and allow to delete, enable editing and disable editing for each feature individually

#### side bar added

#### functionality implemented.

### 0.4.4 - 2023-02-02

- fix mvt showing. update glyphs property

### 0.4.5 - 2023-02-03

- export wkt for individual feature

### 0.4.6 - 2023-02-06

- mvt functionality moved to aereo-cesium

### 0.4.7 - 2023-02-07

- fix enable/disable edit function
- remove ts-ignore
- gis-26 Hide label and polygon when polygon's bounding volume is not visible while zooming out
- - hide feature

### 0.4.8 - 2023-02-08

- function for import/export each drawing tool

### 0.4.9 - 2023-02-08

- custom property and fix issues according to aereo-cesium library

### 0.5.0 - 2023-02-09

- aereo-cesium version change
- fix event process

### 0.5.1 - 2023-02-13

- gis 25 User should be able to select multiple features of different types using the Select tool button while the layer is in Edit mode
- - create a tool box for selection
- aereo-cesium version change
- - change cesium view type structure
- - create a tool for selection
- - some functions added (export wkt, delete features, reset)
- - implemented some id naming rule for features:
- - for eg.
- - id for Polygon : guid|Polygon
- - id for child features(like polyline, vertex): same guid of parent|Polygon|Line(or Point)

### 0.5.2 - 2023-02-13

- Enable/Disable draw button while creating feature.

### 0.5.3 - 2023-02-14

- gis 36 enable edit for multiple features of different types

### 0.5.4 - 2023-02-16

- hide feature/fix point import wkt/extend import wkt

### 0.5.5 - 2023-02-17

- gis 24 enable styling for multiple feature

### 0.5.6 - 2023-02-19

- gis 23 user should be able to create/edit text box

### 0.5.7 - 2023-02-20

- gis 45 toggle visibility functions are not working for imported features.
- remove point created event for importing wkt
- set label property for each entity
- add geometry ids, labels to polygon drawing import wkt

### 0.5.8 - 2023-02-22

- fixed point toggle visibility
- delete all textbox function
- delete textboxy by id
- toggle visibility for textbox

### 0.5.9 - 2023-02-23

- fix event multiple triggering
- gis 46 select tool should be able to select textbox

### 0.6.0 - 2023-02-27

- fix text styling (parameter type change: TextStyleOptions -> StyleOptions in Textbox changeStyle function)

### 0.6.1 - 2023-03-02

- add delete option to check if the feature is possibly deleted
- add select option to check if the feature is possibly selected
- update label position when modifying polygon

### 0.6.2 - 2023-03-02

- passing style options to drawing tool (if the tool has styleOptions already, then update the styleOptions)

### 0.6.3 -2023-03-05

- fix select tool issue (select/delete issue)

### 0.6.4 - 2023-03-06

- fix delete wkt polygon not working

### 0.6.5 - 2023-03-14

- GIS-67 the unfinished state should be removed when the user clicks outside of the cesium
- fixed event add and remove is not correct. Event should be added when component mounted and should be removed when component unmounted
- In aereo-cesium, drawing end event should be triggered after drawing mode updated

### 0.6.6 - 2023-03-16

- GIS-63 User should be able to add new layers in 3D map implementation
- Each layer consists of primitive collection for drawing and raster imagery layer for raster data
- Layer event implementation: created event, active layer changed event
- LayerTool UI implementation in gis-development

### 0.6.7 - 2023-03-21

- GIS-64 User should be able to edit layer
- able to change layer name and edit features on layers.
- can edit features by using select tool

### 0.6.8 - 2023-03-22

- add reset style function for each drawing tool

### 0.6.9 - 2023-03-22

- GIS-69 When drawing started, it check if active layer is selected or not

### 0.7.0 - 2023-03-28

- show terrain and raster layer with org_token

### 0.7.1 - 2023-04-03

- GIS-72 Point feature tool does not have the Select Active layer dropdown to choose from

### 0.7.2 - 2022-04-04

- GIS-67 the unfinished state should be removed when the user clicks outside of the cesium
- - version change

### 0.7.3 - 2023-04-05

- GIS-82 Authentication Header in MVTImageryProvider for vector tiles

### 0.7.3 - 2023-04-12

- GIS-83 Label Design Update & Colour Picker

### 0.7.4 - 2023-04-17

- [GIS-76 On selecting the TextBox using the Select tool, the Textbox should be editable and deletable](https://aarav-unmanned-systems.atlassian.net/browse/GIS-76)

### 0.7.5 - 2023-04-20

- fix terrain url

### 0.7.6 - 2023-04-25

- [GIS-80 User should be able to change opacity of a vector layer](https://aarav-unmanned-systems.atlassian.net/browse/GIS-80)

- change opacity for rasters and features in the selected layer

### 0.7.7 - 2023-04-27

- Fix delete point event triggering

### 0.7.8 - 2023-05-03

- [GIS-90 Remove label entity after toggling it in changeStyle function.](https://aarav-unmanned-systems.atlassian.net/browse/GIS-90)

### 0.7.9 - 2023-05-11

- [GIS-91 Add Info Tool](https://aarav-unmanned-systems.atlassian.net/browse/GIS-91)

### 0.8.0 - 2023-05-22

- [GIS-95 On saving the textbox confirmation modal should close](https://aarav-unmanned-systems.atlassian.net/browse/GIS-95)
- hide modal when textbox created event triggered

### 0.8.1 - 2023-06-07

- fix tiles url changed

### 0.8.2 - 2023-06-21

- fix textbox toggle visibility

### 0.8.3 - 2023-06-21

- fix point shape visible issue: marker and shape showing together

### 0.8.4 - 2023-06-23

- [GIS-113 User is able to select features from non editable layers](https://aarav-unmanned-systems.atlassian.net/browse/GIS-113)
- make layers list
- add toggling layers by id function
- fix select tool by layer

### 0.8.5 - 2023-07-06

- update cesium version to 107

### 0.8.6 - 2023-08-04

- update library version to 1.1.58

### 0.8.7 - 2023-08-25

- update library version to 1.1.62

### 0.8.8 - 2023-08-28

- update library version to 1.1.63

### 0.8.8 - 2023-09-05

- Update point drawing tool component to load geojson
- Used supercluster library to cluster large number of points

### 0.8.9 - 2023-09-21

- Update library version to 1.1.66

### 0.8.10 - 2023-09-22

- load wkt file for large dataset
- install new library @terraformer/wkt
- used this library to convert wkt array to geojson to be used in supercluster library

### 0.8.11 - 2023-09-28

- Update library version to 1.1.67

### 0.8.12 - 2023-10-06

- GIS-142 Point dragging, released event trigger

### 0.8.13 - 2023-10-09

- Created textbox array is not updated correctly. And fix it by spread operator.

### 0.8.14 - 2023-10-17

- GIS-144 Upload shape file

### 0.8.15 - 2023-10-24

- GIS-99 Add floating lines and floating polygons options on 3D map
- Solved by using Cesium GroundPrimitive and Corplanar Primitive

### 0.8.16 - 2023-11-14

- Library version update to 1.2.1

### 0.8.17 - 2023-11-30

- Library version update to 1.2.5
- Update some code for GIS-144 according to library version

### 0.8.18 - 2023-12-7

- Library version update to 1.2.6

### 0.8.19 - 2023-12-7

- Library version update to 1.2.8

### 0.8.20 - 2023-12-11

- GIS-127 toggle fill polygon
- Library version update to 1.2.8

### 0.8.21 - 2023-12-18

- GIS-160 fix upload shape file

### 0.8.22 - 2024-01-22

- [GIS-162 Shortcus works only after use clicks/pan with the mouse](https://aarav-unmanned-systems.atlassian.net/browse/GIS-162)
- Focus to cesium viewer canvas when it's loaded.

### 0.8.22 - 2024-03-20

- GIS-143 Label is not visible on huge polygon

### 0.8.23 - 2024-03-20

- Lint fix

### 0.8.24 - 2024-11-21

- GIS-170 3D swipe viewer implementation

### 0.8.25 - 2024-11-29

- GIS-170 rearrange 3D swipe viewer (left and right)

### 0.8.26 - 2024-12-12

- GIS-195 add compass in split viewer
- Cesiumjs Version update to 1.124.0
