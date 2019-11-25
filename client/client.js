

const API_HOST = 'http://localhost:3001'

Dropzone.autoDiscover = false

$(function() {
	var currentFile
	var myDropzone = new Dropzone("#my-dropzone", { 
		url:"#",
		dictDefaultMessage: "Drop file here to upload to S3",
		method: "PUT",
		paramName: "file",
		thumbnailWidth: 300,
		thumbnailHeight: 300,
		parallelUploads: 1,
		autoProcessQueue: true,
		uploadMultiple: false,
		clickable: true,
		maxFiles: 1,
		accept: function(file, cb) {
			//override the file name, to use the s3 signature
			//console.log(file);
			var params = {
			  	fileName: file.name,
			  	fileType: file.type,
			};
			console.log('getting S3 presignedUploadURL', params);
			//path to S3 signature 
			$.getJSON(API_HOST + '/presignedUploadURL', params).done(function(data) {
				console.log('presignedUploadURL', data);
	
				if (!data.signedURL) {
					return cb('Failed to receive an upload url');
				}
				file.signedURL = data.signedURL;
				file.fileName = data.fileName
				// file.finalURL = data.downloadURL;
				cb();
			}).fail(function() {
			  	return cb('Failed to receive an upload url');
			});
		},
		sending: function(file, xhr) {	
			console.log('Uploading file to s3')
			var _send = xhr.send;
			xhr.setRequestHeader('x-amz-acl', 'public-read');
			xhr.send = function() {
				_send.call(xhr, file);
			}
	
		},
		processing:function(file){
			this.options.url = file.signedURL;
		},
		init: function() {
			this.on('addedfile', function() {
				if (typeof currentFile !== "undefined") {
					this.removeFile(currentFile);
				}
			});

			this.on('success', function(file, responseText) {
				console.log("File successfully uploaded to S3", file)
				currentFile = file;
			});
		},
	})

	var canvas = $('#myCanvas')[0];
	var matchedCanvas = $('#matchedCanvas')[0];

	$('#recognizeBtn').click(function(event) {
		event.preventDefault()
		if (!currentFile) {
			return
		} 
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		$('#response').empty().append("Searching...")
		var t0 = performance.now();
		$.get(API_HOST + '/face', { s3path: currentFile.fileName }).done(function(res) {
			var t1 = performance.now();
			console.log(res);
			if (res != null && res.rekognition.FaceMatches && res.rekognition.FaceMatches.length > 0) {
				ctx.beginPath();
				ctx.lineWidth = '2';
				ctx.strokeStyle = 'red';
				ctx.rect(
					res.rekognition.SearchedFaceBoundingBox.Left * canvas.width,
					res.rekognition.SearchedFaceBoundingBox.Top * canvas.height,
					res.rekognition.SearchedFaceBoundingBox.Width * canvas.width,
					res.rekognition.SearchedFaceBoundingBox.Height * canvas.height
				);
				ctx.stroke();
				var faceMatch = res.rekognition.FaceMatches[0]
				$('#response').empty().append("<p>Matched " + res.name + " (Similarity: " + faceMatch.Similarity.toFixed(2) + "%) " + ((t1 - t0)/1000).toFixed(2) +  "s </p>")
				var img = new Image();
				img.onload = function () {
					canvas.width = img.width;
    				canvas.height = img.height;
					ctx.drawImage(img, 0, 0, img.width, img.height);
					ctx.beginPath();
					ctx.lineWidth = '2';
					ctx.strokeStyle = 'green';
					ctx.rect(
						faceMatch.Face.BoundingBox.Left * canvas.width,
						faceMatch.Face.BoundingBox.Top * canvas.height,
						faceMatch.Face.BoundingBox.Width * canvas.width,
						faceMatch.Face.BoundingBox.Height * canvas.height
					);
					ctx.stroke();

				}
				img.src = res.imageURL;

			} else {
				$('#response').empty().append("<p>Cannot find matching face.</p>")
			}
		}).fail(function(err) {
			console.log("Error finding face", err)
			$('#response').empty().append("<p>Cannot find matching face.</p>")
		});
		return false
	});

	$('#addFaceBtn').click(function(event) {
		event.preventDefault()
		if (!currentFile) {
			return
		}
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		$('#response').empty().append("Adding...")
		var params = {
			s3path: currentFile.fileName, 
			name: $("#faceName").val()
		}
		$.post(API_HOST + '/face', params, 'json').done(function(res) {
			console.log(res);
			if (res && res.rekognition.FaceRecords && res.rekognition.FaceRecords.length > 0){
				faceRecord = res.rekognition.FaceRecords[0]
				var img = new Image();
				img.onload = function () {
					canvas.width = img.width;
    				canvas.height = img.height;
					ctx.drawImage(img, 0, 0, img.width, img.height);
					ctx.beginPath();
					ctx.lineWidth = '2';
					ctx.strokeStyle = 'red';
					ctx.rect(
						faceRecord.Face.BoundingBox.Left * canvas.width,
						faceRecord.Face.BoundingBox.Top * canvas.height,
						faceRecord.Face.BoundingBox.Width * canvas.width,
						faceRecord.Face.BoundingBox.Height * canvas.height
					);
					ctx.stroke();
				}
				img.src = res.imageURL;

				var faceDetail = faceRecord.FaceDetail
				$('#response').empty().append("Face added!</br>")
				$('#response').append("Age: " + faceDetail.AgeRange.Low + " - " + faceDetail.AgeRange.High +"</br>")
				if (faceDetail.Emotions.length > 0) {
					$('#response').append("Emotion: " + faceDetail.Emotions[0].Type +  " (Confidence: " + faceDetail.Emotions[0].Confidence.toFixed(2) +")</br>")
				}
				$('#response').append("Eyeglasses: " + faceDetail.Eyeglasses.Value + " (Confidence: " + faceDetail.Eyeglasses.Confidence.toFixed(2) +")</br>")
				$('#response').append("Gender: " + faceDetail.Gender.Value + " (Confidence: " + faceDetail.Gender.Confidence.toFixed(2) +")</br>")
				$('#response').append("Smile: " + faceDetail.Smile.Value + " (Confidence: " + faceDetail.Smile.Confidence.toFixed(2) +")</br>")

			} else {
				$('#response').empty().append("Error adding a face")
			}
		}).fail(function(err) {
			console.log("Error adding face", err)
			$('#response').empty().append("<p>Cannot add face.</p>")
		});
		return false
	});

});