var express = require('express')
//npm install body-parser --save, used to parse through data and covert to json 
var bodyParser = require('body-parser') 
var logic = require('./logic')
var axios = require('axios')
var app = express()
var parseString = require('xml2js').parseString;
app.use(express.static(__dirname)) //serves the static html file
app.use(bodyParser.json()) //to json
app.use(function(req, res, next){
    res.setTimeout(120000, function(){
        console.log('Request has timed out.');
            res.send(408);
        });
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/streets',(req,res) => {
    console.log(req.body)
    if(req.body){
        if(req.body.polygonPath && req.body.polygonPath.length > 0){
            var latMin = 180,lngMin = 180,latMax = -180,lngMax = -180;
            req.body.polygonPath.forEach(obj => {
                latMin = Math.min(latMin,obj.latitude)
                lngMin = Math.min(lngMin,obj.longitude)
                latMax = Math.max(latMax,obj.latitude)
                lngMax = Math.max(lngMax,obj.longitude)
            });
        } else {
            var offset = logic.getOffset(req.body.circle.center,req.body.circle.radius)
            console.log('offset :',offset)
            latMin = req.body.circle.center.latitude - offset;
            lngMin = req.body.circle.center.longitude - offset;
            latMax = req.body.circle.center.latitude + offset;
            lngMax = req.body.circle.center.longitude + offset;
        }
        console.log(latMin,lngMin,latMax,lngMax)
        axios.get('https://api.openstreetmap.org/api/0.6/map?bbox='+lngMin +','
        +latMin +','+lngMax +','+latMax)
        .then(function (response){
            var str = {}
            var self = this;
            parseString(response.data, function (err, result) {
                if(err){
                    res.send({'error' : {err}})
                }
                self.str = result
                // console.log(result.way.length)
                var streets = {}
                try{
                    streets = logic.getAllStreets(req.body,result)
                }catch(error){
                    console.log(error)
                    streets = {error}
                }
                res.send(streets)
                // res.send(result)
            });
            // console.log('success ' + JSON.stringify(response.data))
        
        })
        .catch(function (error){
            console.log('err'+ error)
            res.send(error)
        })
        
    }else{
        res.send({'error' : 'Invalid input'})
    }
})
app.get('/getNotified',(req,res) => {
    console.log(req.query)
    res.send(logic.testDistance(req.query))
}) 
app.get('/addMember',(req,res) => {
    console.log(req.query)
    res.send(logic.addMember(req.query))
})


var server = app.listen(4006, () =>{
  console.log("server is listening on port", server.address().port);
  }) 

//gets express server started and listening for requests

