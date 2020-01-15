var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
var AWS = require('aws-sdk');

const rekognitionCollectionID = 'skooldio'
const defaultS3bucket = 'skooldio-face-search'

var app = express()
// parse application/json
app.use(bodyParser.json())
// parse application/xwww-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Enable all CORS requests
app.use(cors())

//config for region
AWS.config.update({
	region: 'ap-southeast-1',
});

var rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'})
var s3 = new AWS.S3()

// Index Face
app.post('/face', function(req, res) {
  var s3bucket = process.env.S3_BUCKET || defaultS3bucket
  var s3path = req.body.s3path
  var name = req.body.name

  console.log(`Indexing face image s3://${s3bucket}/${s3path} to collection ${rekognitionCollectionID}`)
  var indexParams = {
    CollectionId: rekognitionCollectionID,
    DetectionAttributes: ["ALL"], 
    ExternalImageId: s3path, 
    Image: {
      S3Object: {
        Bucket: s3bucket, 
        Name: s3path
      }
    }
  }
  rekognition.indexFaces(indexParams, function(error, response) {
    if (error) {
      console.log(error, error.stack) // an error occurred
      res.status(500).json({error: error})
    }
    else if (response.FaceRecords.length <= 0) {
      res.json({rekognition: response, imageURL:null})
    } else {
      res.json({rekognition: response, imageURL:`https://${s3bucket}.s3-ap-southeast-1.amazonaws.com/${s3path}`})
    }
  })
})

// Search Face
app.get('/face', function(req, res) {
  var s3bucket = process.env.S3_BUCKET || defaultS3bucket
  var s3path = req.query.s3path

  console.log(`Searching faces by image s3://${s3bucket}/${s3path} in collection ${rekognitionCollectionID}`)
  var searchParams = {
    CollectionId: rekognitionCollectionID,
    Image: {
      S3Object: {
        Bucket: s3bucket,
        Name: s3path
      }
    },
    MaxFaces: 1
  }
  rekognition.searchFacesByImage(searchParams, function(error, response) {
    if (error) {
      console.log(error, error.stack) // an error occurred
      res.status(500).json({error: error})
    } else if (response.FaceMatches.length <= 0) {
      res.json({rekognition: response})
    } else {
      // Construct image urls
      var extImageID = response.FaceMatches[0].Face.ExternalImageId
      var imageURL = `https://${s3bucket}.s3-ap-southeast-1.amazonaws.com/${extImageID}`
      res.json({rekognition: response, imageURL: imageURL})
    }
  })
})

// S3 Signed URL for upload
app.get('/upload', function(req, res) {
  var s3bucket = process.env.S3_BUCKET || defaultS3bucket
  var fileName = Date.now() + '_' + req.query.fileName

  console.log(`Getting signed URL for upload to s3 bucket ${s3bucket}`)

  var params = { 
      Bucket: s3bucket, 
      Key: fileName, 
      Expires: 120,
      ContentType: req.query.fileType,
      ACL: 'public-read'
  };
  url = s3.getSignedUrl('putObject', params, function (err, url) {
    if(err){
      console.log('Error getting S3 pre-signed URL', err);
      res.json({ success: false, message: err});
    } else {
      res.json({ success : true, signedURL : url, fileName: fileName });
    }
  })
})

// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
