import {
  WebPlugin
} from "./chunk-TJAP632Z.js";
import {
  __async
} from "./chunk-WDMUDEB6.js";

// node_modules/@capacitor-community/camera-preview/dist/esm/web.js
var CameraPreviewWeb = class extends WebPlugin {
  start(options) {
    return __async(this, null, function* () {
      return new Promise((resolve, reject) => __async(this, null, function* () {
        var _a;
        yield navigator.mediaDevices.getUserMedia({
          audio: !options.disableAudio,
          video: true
        }).then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
        }).catch((error) => {
          reject(error);
        });
        const video = document.getElementById("video");
        const parent = document.getElementById(options.parent);
        if (!video) {
          const videoElement = document.createElement("video");
          videoElement.id = "video";
          videoElement.setAttribute("class", options.className || "");
          if (options.position !== "rear") {
            videoElement.setAttribute("style", "-webkit-transform: scaleX(-1); transform: scaleX(-1);");
          }
          const userAgent = navigator.userAgent.toLowerCase();
          const isSafari = userAgent.includes("safari") && !userAgent.includes("chrome");
          if (isSafari) {
            videoElement.setAttribute("autoplay", "true");
            videoElement.setAttribute("muted", "true");
            videoElement.setAttribute("playsinline", "true");
          }
          parent.appendChild(videoElement);
          if ((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia) {
            const constraints = {
              video: {
                width: { ideal: options.width },
                height: { ideal: options.height }
              }
            };
            if (options.position === "rear") {
              constraints.video.facingMode = "environment";
              this.isBackCamera = true;
            } else {
              this.isBackCamera = false;
            }
            navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
              videoElement.srcObject = stream;
              videoElement.play();
              resolve();
            }, (err) => {
              reject(err);
            });
          }
        } else {
          reject({ message: "camera already started" });
        }
      }));
    });
  }
  startRecordVideo() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
  stopRecordVideo() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
  stop() {
    return __async(this, null, function* () {
      const video = document.getElementById("video");
      if (video) {
        video.pause();
        const st = video.srcObject;
        const tracks = st.getTracks();
        for (const track of tracks) {
          track.stop();
        }
        video.remove();
      }
    });
  }
  capture(options) {
    return __async(this, null, function* () {
      return new Promise((resolve) => {
        const video = document.getElementById("video");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (!this.isBackCamera) {
          context.translate(video.videoWidth, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        let base64EncodedImage;
        if (options.quality != void 0) {
          base64EncodedImage = canvas.toDataURL("image/jpeg", options.quality / 100).replace("data:image/jpeg;base64,", "");
        } else {
          base64EncodedImage = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
        }
        resolve({
          value: base64EncodedImage
        });
      });
    });
  }
  captureSample(_options) {
    return __async(this, null, function* () {
      return this.capture(_options);
    });
  }
  getSupportedFlashModes() {
    return __async(this, null, function* () {
      throw new Error("getSupportedFlashModes not supported under the web platform");
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setFlashMode(_options) {
    return __async(this, null, function* () {
      throw new Error("setFlashMode not supported under the web platform");
    });
  }
  flip() {
    return __async(this, null, function* () {
      throw new Error("flip not supported under the web platform");
    });
  }
  setOpacity(_options) {
    return __async(this, null, function* () {
      const video = document.getElementById("video");
      if (!!video && !!_options["opacity"]) {
        video.style.setProperty("opacity", _options["opacity"].toString());
      }
    });
  }
  isCameraStarted() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
};
export {
  CameraPreviewWeb
};
//# sourceMappingURL=web-NGVQV55S.js.map
