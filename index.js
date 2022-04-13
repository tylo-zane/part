(function() {
    "use strict";

    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    let updateNote = document.getElementById("updatenote");

    let isVideo = false;
    let model = null;

    const modelParams = {
        flipHorizontal: true,   // flip e.g for video  
        maxNumBoxes: 3,        // maximum number of boxes to detect
        iouThreshold: 0.5,      // ioU threshold for non-max suppression
        scoreThreshold: 0.6,    // confidence threshold for predictions.
    }

    function startVideo() {
        handTrack.startVideo(video).then(function (status) {
            console.log("video started", status);
            if (status) {
                updateNote.innerText = "Video started. Now tracking"
                isVideo = true
                runDetection()
                setTimeout(hideLoad, 1000)
            } else {
                updateNote.innerText = "Please enable video"
            }
        });
    }

    function runDetection() {
        model.detect(video).then(predictions => {
            console.log("Predictions: ", predictions);
            model.renderPredictions(predictions, canvas, context, video);
            if (isVideo) {
                requestAnimationFrame(runDetection);
            }
        });
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

    // Load the model.
    handTrack.load(modelParams).then(lmodel => {
        // detect objects in the image.
        model = lmodel
        updateNote.innerText = "Loaded Model!"
    });

    window.addEventListener("load", initialize);
 
   /**
    * Initializes the webpage by starting webcam video.
    */
    function initialize() {
        console.log("initialized");
        startVideo();
    }
 
 })();
 