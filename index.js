(function() {
    "use strict";

    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const webcam = new Webcam(video, 'user', canvasElement);
    let updateNote = document.getElementById("updatenote");
    let cursor = document.getElementById("cursor");
    let handposition = null;
    let cameraFrame = null;
    let handstate = null;

    let isVideo = false;
    let model = null;

    const modelParams = {
        flipHorizontal: true,   // flip e.g for video  
        maxNumBoxes: 2,        // maximum number of boxes to detect
        iouThreshold: 0.5,      // ioU threshold for non-max suppression
        scoreThreshold: 0.6,    // confidence threshold for predictions.
    }

    function startVideo() {
        webcam.start()
            .then(result =>{
                updateNote.innerText = "Webcam started.";
                isVideo = true;
                startHandMagic();
            })
            .catch(err => {
                    updateNote.innerText = "Please enable video"; 
            });
        /* handTrack.startVideo(video).then(function (status) {
            console.log("video started", status);
            if (status) {
                updateNote.innerText = "Video started. Now tracking"
                isVideo = true
                runDetection()
                setTimeout(hideLoad, 1000)
                cursor.classList.remove("hidden");
                document.getElementById("hand").classList.remove("hidden")
                showGuides()
            } else {
                updateNote.innerText = "Please enable video"
            }
        }); */
    }

    function startHandMagic() {
        webcam.stream()
            .then(result => {
                loadModel().then(res => {
                    updateNote.innerText = "Video started. Now tracking";
                    cameraFrame = runDetection();
                    setTimeout(hideLoad, 1000);
                    cursor.classList.remove("hidden");
                    showGuides();
                })
                .catch(err => {
                    updateNote.innerText = "Fail to load hand tracking model, please refresh the page to try again";
                });
            })
            .catch(err => {
                updateNote.innerText = "Fail to access camera, please refresh the page to try again"
            });
    }

    function runDetection() {
        model.detect(video).then(predictions => {
            updateHand(predictions);
            model.renderPredictions(predictions, canvas, context, video);
            if (isVideo) {
                requestAnimationFrame(runDetection);
            }
        });
    }

    function loadModel() {
        return new Promise((resolve, reject) => {
    
            handTrack.load(modelParams).then(lmodel => {
                // detect objects in the image.
                model = lmodel
                updateNote.innerText = "Loaded Model!"
            }).catch(err => {
                reject(error);
            });
        });
    }

    function updateHand(predictions) {
        //console.log("Predictions: ", predictions);
        let hand = null;
        for (let i = 0; i < predictions.length; i++) {
            // console.log(predictions[i]);
            if (predictions[i].label != "face") {
                hand = predictions[i];
            }
        }
        if (hand != null) {
            handposition = updateHandPoint(hand);
            console.log(handposition);
        }
    }

    function updateHandPoint(hand) {
        let ratio = canvas.clientHeight/video.height;
        let leftAdjustment = 0;
        if (window.innerWidth/window.innerHeight >= video.width/video.height) {
            leftAdjustment = 0;
        }else{
            leftAdjustment = ((video.width/video.height) * canvas.clientHeight - window.innerWidth)/2;
        }
        handstate = hand.label;
        let bbox = hand.bbox;
        let x = bbox[0];
        let y = bbox[1];
        let w = bbox[2];
        let h = bbox[3];
        let hand_center_left = x*ratio + (w*ratio/2) - leftAdjustment;
        let hand_center_top = y*ratio + (h*ratio/2);
        cursor.style.left = hand_center_left + "px";
        cursor.style.top = hand_center_top + "px";
        return [hand_center_top, hand_center_left];
    }

    function showGuides() {
        let h1 = document.querySelector("h1");
        let h2 = document.querySelector("h2");
        let hand = document.getElementById("hand");
        hand.classList.remove("hidden");
        h1.classList.remove("hidden");
        h2.classList.remove("hidden");
        h1.classList.add("fadeIn");
        h2.classList.add("fadeIn");
        hand.classList.add("fadeIn");
    }

    function hideLoad() {
        let updateNote = document.getElementById("updatenote");
        let loading = document.getElementById("loading");
        updateNote.classList.add("fadeOut");
        loading.classList.add("fadeOut");
        setTimeout(hiddenLoad, 1000);
    }

    function hiddenLoad() {
        let updateNote = document.getElementById("updatenote");
        let loading = document.getElementById("loading");
        updateNote.classList.add("hidden");
        loading.classList.add("hidden");
    }

/*     // Load the model.
    handTrack.load(modelParams).then(lmodel => {
        // detect objects in the image.
        model = lmodel
        updateNote.innerText = "Loaded Model!"
    }); */

    window.addEventListener("load", initialize);
 
   /**
    * Initializes the webpage by starting webcam video.
    */
    function initialize() {
        console.log("initialized");
        startVideo();
    }
 
 })();
 