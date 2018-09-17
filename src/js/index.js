import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import './fps';
import Game from './Game';
import {socket} from './socket';


const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
canvasResize();
const scene = new BABYLON.Scene(engine);
engine.enableOfflineSupport = false;
// engine.setHardwareScalingLevel(2);

const assetsManager = new BABYLON.AssetsManager(scene);
assetsManager.isCompleted = false;

const meshTask1 = assetsManager.addMeshTask("room1", "", "assets/", "room1.babylon");
meshTask1.onSuccess = function (task) {
};
meshTask1.onError = function (task, message, exception) {
    console.log(message, exception);
};

const meshTask2 = assetsManager.addMeshTask("ship01", "", "assets/", "ship01.babylon");
meshTask2.onSuccess = function (task) {
    task.loadedMeshes[0].setEnabled(false);
};
meshTask2.onError = function (task, message, exception) {
    console.log(message, exception);
};

const meshTask3 = assetsManager.addMeshTask("bullet01", "", "assets/", "bullet01.babylon");
meshTask3.onSuccess = function (task) {
    task.loadedMeshes[0].setEnabled(false);
};
meshTask3.onError = function (task, message, exception) {
    console.log(message, exception);
};

const meshTask4 = assetsManager.addMeshTask("movePath01", "", "assets/", "movePath01.babylon");
meshTask4.onSuccess = function (task) {

};
meshTask4.onError = function (task, message, exception) {
    console.log(message, exception);
};

// const meshTask5 = assetsManager.addTextureTask("redShading", "assets/red_shading.png", false);
// meshTask5.onSuccess = function (task) {
//
// };
// meshTask5.onError = function (task, message, exception) {
//     console.log(message, exception);
// };

assetsManager.load();

assetsManager.onFinish = function(tasks) {
    assetsManager.isCompleted = true;
    if (!socket.isMyConnected) return;

    Game(engine);
};


socket.on('room-wars-connect', function (username) {
    socket.isMyConnected = true;
    socket.username = username;
    if (assetsManager.isCompleted) {
        Game(engine);
    }
});



// the canvas/window resize event handler
window.addEventListener('resize', function(){
    canvasResize();
});

function canvasResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    engine.resize();

    detectmob();
}

function detectmob() {
    Game.isOnMobile = false;

    Game.isOnMobile = !!(navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i));
}

// window.addEventListener('blur',function(){
//     engine.stopRenderLoop();
//     // _ANIMATABLE.pause();
//     console.log('paused');
// });
// window.addEventListener('focus',function(){
//     engine.runRenderLoop(function () {
//     // _ANIMATABLE.restart();
//         scene.render();
//     });
//     console.log('resumed')
// });