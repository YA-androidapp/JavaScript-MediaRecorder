window.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed");

    var isRecording = false;
    var localStream;
    var mediaRecorder = null;
    var recordedChunks = [];
    var recordedMimeType = "";

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
                    mediaRecorder = new MediaRecorder(stream, {
                        mimeType: "audio/webm" // "audio/ogg"
                    });
                    mediaRecorder.start();
                })
                .catch(function (e) {
                    console.log(e);
                });
        }
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    recordedMimeType = e.data.type;
                    recordedChunks.push(e.data);

                    document.getElementById("player").src = URL.createObjectURL(e.data);

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
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
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
        console.log("record");

        if (isRecording) {
            stopRecording();
            isRecording = false;
        } else {
            startRecording();
            isRecording = true;
        }
    });

    document.getElementById("save").addEventListener("click", function () {
        console.log("save");

        saveFile();
    });
});
