var geodist = require('geodist')
var geolib = require('geolib')

var responseObj = {}
var polygonPath = []
var circle = {}
function latlng(lat,lng){
    this.lat = Number(lat);
    this.lng = Number(lng);
    // console.log(lat,lng)
}
function segment(name,start,end){
    this.name = name;
    this.start = start;
    this.end = end;
    // console.log(name,start,end)
}
function Street(name,segments){
    this.name = name;
    this.segments = segments;
}
function getLatLng(nodeArr,arrObj){
    // console.log('in getLatLng')
    var o = {}
    nodeArr.forEach(function(nodeArrObj){
        if(nodeArrObj.$.id == arrObj.$.ref){
            o = new latlng(nodeArrObj.$.lat,nodeArrObj.$.lon)
            return o;
        }
    })
    // console.log(o)
    return o;
}

function pointInPolygon(polygonPath, coordinates) {
    let numberOfVertexs = polygonPath.length - 1;
    let inPoly = false;
    let { lat, lng } = coordinates;

    let lastVertex = polygonPath[numberOfVertexs];
    let vertex1, vertex2;

    let x = lat, y = lng;

    let inside = false;
    for (var i = 0, j = polygonPath.length - 1; i < polygonPath.length; j = i++) {
        let xi = polygonPath[i].latitude, yi = polygonPath[i].longitude;
        let xj = polygonPath[j].latitude, yj = polygonPath[j].longitude;

        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    console.log('inside : ',inside)
    return inside;
}

function isWithinBounds(latlng){
    // console.log('in isWithinBounds '+ latlng)
    var bool = false;
    if(polygonPath.length > 0){
        bool = geolib.isPointInside(latlng,polygonPath)
    }else{
        bool = geolib.isPointInCircle(latlng,circle.center,circle.radius)
    }
    // console.log(bool)
    // return pointInPolygon(polygonPath,latlng);
    return bool;
}

function getAllSegments(refArr,nodeArr){
    // console.log('in getAllSegments')
    var arr = []
    var segments = []
    refArr.forEach(function(arrObj){
        var o = getLatLng(nodeArr,arrObj);
        if(isWithinBounds(o)){
            arr.push(o)
        }
    })
    // console.log(arr)
    arr.forEach(function(latlng,i){
        if(i<arr.length-1){
            segments.push(new segment('Segment '+(i+1),arr[i],arr[i+1]))
        }
    })
    return segments;
}

function getAllStreets(body,obj) {
    polygonPath = body.polygonPath;
    circle = body.circle;
    // console.log('in getAllStreets')
    responseObj = obj
    var streets = []
    
    obj.osm.way.forEach(function(way){
        if(way.tag){
            var streetName = '';
            var isHighway = false;
            way.tag.forEach(function(arrObj){
                if(arrObj.$.k == "name"){
                    streetName = arrObj.$.v
                }
                if(arrObj.$.k == "highway"){
                    isHighway = true
                }
                if(arrObj.$.k == "lanes" && Number(arrObj.$.v)>2){
                    isHighway = false
                    return;
                }
            })
            if(isHighway){
                var segments = getAllSegments(way.nd,obj.osm.node)
                if(segments.length>0){
                    streets.push(new Street(streetName,segments))
                }
            }
        }
        
        // if(way.tag && way.tag.length > 1){
        //     var arrObj = way.tag[1]
        //     if(arrObj.$.k == "name"){
        //         var segments = getAllSegments(way.nd,obj.osm.node)
        //         streets.push(new Street(arrObj.$.v,segments))
        //     }
        // }else if(way.tag){
        //     var arrObj = way.tag[0]
        //     if(arrObj.$.k == "highway"){
        //         var segments = getAllSegments(way.nd,obj.osm.node)
        //         streets.push(new Street(arrObj.$.v,segments))
        //     }
        // }
    })
    var res = {streets}
    return res;
}

function Member(name,latlng,isProspect){
    this.name = name;
    this.latlng = latlng;
    this.isProspect = isProspect;
}
var prospects = []
var members =[]

function getNotified(query){
    var msg = "";
    let currentLocation = new latlng(query.lat,query.lng)
    members.forEach(function(member){
        if(geodist(currentLocation,member.latlng,{exact: true, unit: 'km'})<0.5){
            msg = member.name + " near by, Say hello!"
            break;
        }
    })
    return {"data":msg};
}

function addMember(query){
    members.push(new Member(query.name,new latlng(query.lat,query.lng),query.isProspect))
    return {error : "",msg:"Success"}
}

function testDistance(query){
    var start = new latlng(query.lat1,query.lng1)
    var end = new latlng(query.lat2,query.lng2)
    var obj = geolib.computeDestinationPoint({lat:query.lat1,lon:query.lng1},88,90)
    var offset = obj.longitude - query.lng1
    console.log('')
    // return { 'dist' : geodist(start,end,{exact: true, unit: 'km'})}
    return { 'geolib-dist' : geolib.getDistance({latitude : query.lat1,longitude : query.lng1},{latitude : query.lat2,longitude : query.lng2}),
             'dist' : geodist(start,end,{exact: true, unit: 'm'}),
             'radius' : offset}
}

function getOffset(latlng,radius){
    var obj = geolib.computeDestinationPoint({lat:latlng.latitude,lon:latlng.longitude},radius,90)
    console.log(obj)
    return obj.longitude - latlng.longitude
}


module.exports.getAllStreets = getAllStreets
module.exports.getNotified = getNotified
module.exports.addMember = addMember
module.exports.getOffset = getOffset
module.exports.testDistance = testDistance