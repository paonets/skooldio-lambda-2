var API_HOST = 'http://localhost:8081'
var S3_BUCKET = ''

//Function Environment Checker and Control Browser ( Chrome or Mozilla )
$(function() {
	// Put variables in global scope to make them available to the browser console.
	var video = document.querySelector('video');
	var canvas = $('#myCanvas')[0];
	var matchedCanvas = $('#matchedCanvas')[0];
	canvas.width = 400;
	canvas.height = 300;
	var photo = document.getElementById('photo');
	var result = document.getElementById('reponse');
	//Event For Click Recognize Button
	$('#captureBtn').click(function() {
		$('#response').empty().append("<p>Processing...</p>")
		var ctx = canvas.getContext('2d');
		var mCtx = matchedCanvas.getContext('2d');
		mCtx.clearRect(0, 0, matchedCanvas.width, matchedCanvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		//Take image base64 for PutOject from S3
		var base64 = canvas.toDataURL('image/jpeg');
		//Facecount for Amazon Result
		var faceCount = 0;
		//Json Body for Post Amazon
		var jsondata = { photo: base64 };
		var t0 = performance.now();
		$.post('http://localhost:8081/addPhotoDetectFace', jsondata, function(res) {
			var t1 = performance.now();
			console.log(res);
			if (res != null && res.FaceMatches && res.FaceMatches.length > 0) {
				ctx.beginPath();
				ctx.lineWidth = '2';
				ctx.strokeStyle = 'red';
				ctx.rect(
					res.SearchedFaceBoundingBox.Left * canvas.width,
					res.SearchedFaceBoundingBox.Top * canvas.height,
					res.SearchedFaceBoundingBox.Width * canvas.width,
					res.SearchedFaceBoundingBox.Height * canvas.height
				);
				ctx.stroke();
				
				$('#response').empty().append("<p>Matched " + res.FaceMatches[0].Face.ExternalImageId.replace('.jpg','') + " (Similarity: " + res.FaceMatches[0].Similarity.toFixed(2) + "%) " + ((t1 - t0)/1000).toFixed(2) +  "s </p>")
				var img = new Image();
				img.onload = function () {
						mCtx.drawImage(img, 0, 0, matchedCanvas.width, matchedCanvas.height);
						mCtx.beginPath();
						mCtx.lineWidth = '2';
						mCtx.strokeStyle = 'green';
						mCtx.rect(
							res.FaceMatches[0].Face.BoundingBox.Left * matchedCanvas.width,
							res.FaceMatches[0].Face.BoundingBox.Top * matchedCanvas.height,
							res.FaceMatches[0].Face.BoundingBox.Width * matchedCanvas.width,
							res.FaceMatches[0].Face.BoundingBox.Height * matchedCanvas.height
						);
						mCtx.stroke();

				}
				img.src = "https://s3-ap-northeast-1.amazonaws.com/indiedish-face-recog-test/demo01/" + res.FaceMatches[0].Face.ExternalImageId;

			} else {
				$('#response').empty().append("<p>Cannot find matching face.</p>")
			}
		});
	});

	$('#addFaceBtn').click(function(event) {
		event.preventDefault();
		$('#response').empty().append("<p>Processing...</p>")
		var ctx = canvas.getContext('2d');
		var mCtx = matchedCanvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		mCtx.clearRect(0, 0, matchedCanvas.width, matchedCanvas.height);
		//Take image base64 for PutOject from S3
		var base64 = canvas.toDataURL('image/jpeg');
		//Facecount for Amazon Result
		var faceCount = 0;
		//Json Body for Post Amazon
		var jsondata = { photo: base64, key: $("#faceName").val() + ".jpg" };
		$.post('http://localhost:8081/addFaceToCollection', jsondata, function(res) {
			console.log(res);
			if (res && res.FaceRecords && res.FaceRecords.length > 0){
				ctx.beginPath();
				ctx.lineWidth = '2';
				ctx.strokeStyle = 'red';
				ctx.rect(
					res.FaceRecords[0].Face.BoundingBox.Left * canvas.width,
					res.FaceRecords[0].Face.BoundingBox.Top * canvas.height,
					res.FaceRecords[0].Face.BoundingBox.Width * canvas.width,
					res.FaceRecords[0].Face.BoundingBox.Height * canvas.height
				);
				ctx.stroke();

				var faceDetail = res.FaceRecords[0].FaceDetail
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
		});

	});



	//End Button Click
	//Settings For Stream on Website
	var constraints = {
		audio: false,
		video: true,
	};
	//Start a stream
	function handleSuccess(stream) {
		window.stream = stream;
		video.srcObject = stream;
	}
	//Give error for a not allow webcam
	function handleError(error) {
		alert('To continue exercise please refresh the page and allow your webcam!');
	}
	navigator.mediaDevices.getUserMedia(constraints)
		.then(handleSuccess).catch(handleError);
});