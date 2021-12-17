window.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed");

    var analyser = null;
    var audioCtx = null;
    var biquadFilter = null;
    var convolver = null;
    var distortion = null;
    var drawVisual = null;
    var gainNode = null;
    var isRecording = false;
    var localStream = null;
    var mediaRecorder = null;
    var recordedChunks = [];
    var recordedMimeType = "";
    var source = null;

    var intendedWidth = document.querySelector('.wrapper').clientWidth;
    var canvas = document.querySelector('.visualizer');
    var canvasCtx = canvas.getContext("2d");
    canvas.setAttribute('width', intendedWidth);


    function visualize() {
        WIDTH = canvas.width;
        HEIGHT = canvas.height;

        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);
        var dataArray = new Float32Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {
            drawVisual = requestAnimationFrame(draw);

            analyser.getFloatFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLength) * 2.5;
            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] + 140) * 2;

                canvasCtx.fillStyle = 'rgb(' + Math.floor(barHeight + 100) + ',50,50)';
                canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }
        };

        draw();
    }

    function mimetype2ext(audioType) {
        let extension = "";
        const matches = audioType.match(/audio\/([^;]+)/);

        if (matches) {
            extension = matches[1];
        }

        return "." + extension;
    }

    function startRecording() {
        if (navigator.mediaDevices) {
            console.log("mediaDevices supported");

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (stream) {
                    localStream = stream;

                    if (audioCtx == null) {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        source = audioCtx.createMediaStreamSource(stream);
                        analyser = audioCtx.createAnalyser();
                        analyser.minDecibels = -90;
                        analyser.maxDecibels = -10;
                        analyser.smoothingTimeConstant = 0.85;
                        distortion = audioCtx.createWaveShaper();
                        gainNode = audioCtx.createGain();
                        biquadFilter = audioCtx.createBiquadFilter();
                        convolver = audioCtx.createConvolver();
                        source.connect(analyser);
                        analyser.connect(distortion);
                        distortion.connect(biquadFilter);
                        biquadFilter.connect(convolver);
                        convolver.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        visualize();
                    }

                    if (mediaRecorder == null) {
                        console.log("mediaRecorder", null);
                        mediaRecorder = new MediaRecorder(stream, {
                            mimeType: "audio/webm" // "audio/ogg"
                        });
                        mediaRecorder.start();
                    } else {
                        console.log("mediaRecorder.state", mediaRecorder.state);

                        if (mediaRecorder.state == "paused") {
                            mediaRecorder.resume();
                        } else if (mediaRecorder.state == "inactive") {
                            mediaRecorder.start();
                        }
                    }

                    // mediaRecorderが録音中に変わったら
                    if (mediaRecorder.state == "recording") {
                        document.getElementById("record").innerHTML = "<i class=\"bi-pause-circle\"></i>";
                        document.getElementById("stop").removeAttribute("disabled");
                    }
                })
                .catch(function (e) {
                    console.log(e);
                });
        }
    }

    function pauseRecording() {
        if (mediaRecorder) {
            if (mediaRecorder.state == "recording") {
                mediaRecorder.pause();
            }

            // mediaRecorderが一時停止に変わったら
            if (mediaRecorder.state == "paused") {
                document.getElementById("record").innerHTML = "<i class=\"bi-record-circle\"></i>";
            }
        }
    }

    function stopRecording() {
        if (mediaRecorder) {
            if (mediaRecorder.state == "paused" || mediaRecorder.state == "recording") {
                mediaRecorder.stop();
                console.log("mediaRecorder.state", mediaRecorder.state);
                mediaRecorder.ondataavailable = function (e) {
                    if (e.data.size > 0) {
                        recordedMimeType = e.data.type;
                        recordedChunks.push(e.data);

                        document.getElementById("player").src = URL.createObjectURL(e.data);
                        document.getElementById("player").style["pointer-events"] = "auto";
                        document.getElementById("record").innerHTML = "<i class=\"bi-record-circle\"></i>";
                        document.getElementById("save").removeAttribute("disabled");

                        // window.cancelAnimationFrame(drawVisual);

                        const blob = new Blob(recordedChunks, { type: recordedMimeType });
                        let reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onload = () => {
                            console.log("Base64");
                            // console.log("Base64", reader.result);
                        };
                    }
                }
            }
        }
        // if (localStream) {
        //     localStream.getTracks().forEach(track => track.stop());
        //     localStream = null;
        //     audioCtx = null;
        // }
    }

    function saveFile() {
        var blob = new Blob(recordedChunks, {
            type: recordedMimeType
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "record" + mimetype2ext(recordedMimeType);
        a.click();
        window.URL.revokeObjectURL(url);
    }

    document.getElementById("record").addEventListener("click", function () {
        console.log("record/pause");

        if (isRecording) {
            pauseRecording();
            isRecording = false;
        } else {
            startRecording();
            isRecording = true;
        }
    });

    document.getElementById("stop").addEventListener("click", function () {
        console.log("stop");

        stopRecording();
    });

    document.getElementById("save").addEventListener("click", function () {
        console.log("save");

        saveFile();
    });
});
