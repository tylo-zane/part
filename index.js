(function() {
    "use strict";

    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const webcam = new Webcam(video, 'user', canvas);
    let globalScore = null;
    let updateNote = document.getElementById("updatenote");
    let cursor = document.getElementById("cursor");
    let handposition = null;
    let handstate = null;

    let isVideo = false;
    let model = null;

    const modelParams = {
        flipHorizontal: true,   // flip e.g for video  
        maxNumBoxes: 2,        // maximum number of boxes to detect
        iouThreshold: 0.5,      // ioU threshold for non-max suppression
        scoreThreshold: 0.75,    // confidence threshold for predictions.
    }

    function startVideo() {
        webcam.start()
            .then(result =>{
                console.log(result);
                updateNote.innerText = "Loading model...";
                isVideo = true;
                startHandMagic();
            })
            .catch(err => {
                console.log(err);
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
                console.log(result);
                loadModel().then(res => {
                    console.log(res);
                    updateNote.innerText = "Video started. Now tracking";
                    runDetection();
                    setTimeout(hideLoad, 1000);
                    // cursor.classList.remove("hidden");
                    showGuides();
                })
                .catch(err => {
                    console.log(err);
                    updateNote.innerText = "Fail to load hand tracking model, please refresh the page to try again";
                });
            })
            .catch(err => {
                console.log(err);
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

    async function loadModel() {
        return new Promise((resolve, reject) => {
    
            handTrack.load(modelParams).then(lmodel => {
                // detect objects in the image.
                model = lmodel;
                updateNote.innerText = "Loaded Model!";
                resolve();
            }).catch(err => {
                console.log(err);
                reject(err);
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
        adjustHandOverlay(w);
        adjustPosition(x, y);
        updateScore(x);
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
    }

    function hideLoad() {
        let updateNote = document.getElementById("updatenote");
        let loading = document.getElementById("loading");
        document.querySelector("h2").classList.remove("fadeIn");
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

    function adjustHandOverlay(width) {
        let hand = document.getElementById("hand");
        let bbox = hand.getBoundingClientRect();
        let o_width = bbox.width * .54;
        if (width > o_width) {
            if(width - o_width > 25) {
                overlaySize('increase');
            }
        } else if (width < o_width) {
            if(o_width - width > 27) {
                overlaySize('decrease');
            }
        }
    }

    function adjustPosition(pos_x, pos_y) {
        let leftAdjustment = 0;
        if (window.innerWidth/window.innerHeight >= video.width/video.height) {
            leftAdjustment = 0;
        }else{
            leftAdjustment = ((video.width/video.height) * canvas.clientHeight - window.innerWidth)/2;
        }
        pos_x = pos_x - (0.78 * leftAdjustment);
        let hand = document.getElementById("hand");
        let pos = window.getComputedStyle(hand).left;
        pos = pos.replace('px', '');
        if ((pos_x - pos) < -25) {
            pos = parseFloat(pos) - 12;
        } else if ((pos_x - pos) > 25) {
            pos = parseFloat(pos) + 12;
        }
        let yy = window.getComputedStyle(hand).top;
        yy = yy.replace('px', '');
        pos_y = pos_y + (.75 * pos_y);
        if ((pos_y - yy) < -25) {
            yy = parseFloat(yy) - 12;
        } else if ((pos_y - yy) > 25) {
            yy = parseFloat(yy) + 12;
        }
        hand.style.left = pos + 'px';
        hand.style.top = yy + 'px';
    }

    function overlaySize(option) {
        let hand = document.getElementById("hand");
        let num = window.getComputedStyle(hand).width;
        let pos = window.getComputedStyle(hand).left;
        let pos_y = window.getComputedStyle(hand).top;
        num = num.replace('px', '');
        pos = pos.replace('px', '');
        pos_y = pos_y.replace('px', '');
        if (option == 'increase') {
            num = parseFloat(num) + 48;
            pos = parseFloat(pos) - 16;
            pos_y = parseFloat(pos_y) + 4;
        } else if (option == 'decrease') {
            num = parseFloat(num) - 12;
            pos = parseFloat(pos) + 4;
            pos_y = parseFloat(pos_y) - 1;
        }  
        hand.style.width = num + 'px';
        hand.style.left = pos + 'px';
        hand.style.top = pos_y + 'px';
        //console.log(window.getComputedStyle(hand).width);
    }

    function updateScore(position) {
        let hand = document.getElementById("hand");
        let bbox = hand.getBoundingClientRect();
        let o_width = bbox.width * .25;
        let num = window.getComputedStyle(hand).left;
        num = num.replace('px', '');
        num = parseFloat(num) + o_width;
        if (position > num) {
            if(position - num <= 100) {
                goodShow();
            } else {
                badShow();
            }
        } else if (position < num) {
            if(num - position <= 100) {
                goodShow();
            } else {
                badShow();
            }
        }
    }

    function goodShow(){
        if (globalScore != "GOOD") {
            let h2 = document.querySelector("h2");
            h2.style.color = '#6dccdf';
            h2.innerText = "GOOD";
            h2.classList.add("score");
            globalScore = "GOOD";
            setTimeout(endShow, 1000);
        }      
    }
    
    function badShow(){
        if (globalScore != "BAD") {
            let h2 = document.querySelector("h2");
            h2.style.color = '#ffb58b';
            h2.innerText = "RE-ALIGN HAND";
            h2.classList.add("score");
            globalScore = "BAD";
            setTimeout(endShow, 1000);
        }  
    }

    function endShow() {
        let h2 = document.querySelector("h2");
        h2.classList.remove("score");
    }

    function openFullscreen() {
        let docElm = document.documentElement;
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        }
        else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        }
        else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        }
        else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
        }

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
        document.getElementById("full-button").addEventListener("click", openFullscreen);
        startVideo();
    }
 
 })();
 