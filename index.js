(function() {
    "use strict";

    const modelParams = {
        flipHorizontal: false,   // flip e.g for video 
        imageScaleFactor: 0.7,  // reduce input image size .
        maxNumBoxes: 2,        // maximum number of boxes to detect
        iouThreshold: 0.5,      // ioU threshold for non-max suppression
        scoreThreshold: 0.79,    // confidence threshold for predictions.
      }
      
    const img = document.getElementById('webcam');
 
    window.addEventListener("load", initialize);
 
   /**
    * Initializes the webpage by adding event listeners to each button.
    */
    function initialize() {
        handTrack.startVideo(img);
        console.log("initialized");
        handTrack.load(modelParams).then(model => {
            model.detect(img).then(predictions => {
                console.log('Predictions: ', predictions); 
            });
        });
    }
 
 })();
 