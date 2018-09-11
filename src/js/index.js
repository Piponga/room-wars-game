import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import './fps';


const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

const createScene = function(){
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.showFps();

    const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 0, 0), scene);

    camera.fov = 1.2;
    camera.setTarget(BABYLON.Vector3.Zero());
    // camera.attachControl(canvas, false);

    // const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 10, 0), scene);

    let hero = new BABYLON.Mesh.CreateBox('hero', 34, scene);
    hero.speed = 15;
    hero.rotateSpeed = 2;
    hero.angularSensibility = 2000;
    hero.inertia = 0.9;
    // hero.previousPosition = new BABYLON.Vector2(0, 0);
    hero.heroDirection = new BABYLON.Vector3(0, 0, 0);
    hero.heroRotation = new BABYLON.Vector2(0, 0);
    hero.position.y = 200;
    // hero.rotation.x = Math.PI/2;
    hero.ellipsoid = new BABYLON.Vector3(40, 40, 40);
    hero.checkCollisions = true;
    camera.parent = hero;


    BABYLON.SceneLoader.Append("assets/", "room1.babylon", scene, function (newMeshes) {
        // scene.activeCamera = null;
        // scene.createDefaultCameraOrLight(true);
        // scene.activeCamera.attachControl(canvas, false);

        const meshes = scene.meshes;
        for (let m=0; m < meshes.length; m++) {
            if (meshes[m].name === 'room') {
                let children = meshes[m].getChildren();

                // for (let c=0; c < children.length; c++) {
                //
                //     let childChildren =children[c].getChildren();
                //     if (childChildren.length > 0) {
                //         for (let cc=0; cc < childChildren.length; cc++) {
                //             childChildren[cc].checkCollisions = true;
                //         }
                //     } else {
                //         children[c].checkCollisions = true;
                //     }
                // }
            }
        }
    });


    // BABYLON.SceneLoader.ImportMesh("", "assets/", "test.babylon", scene, function (newMeshes) {
    //     let mesh = newMeshes[1];
    //
    //     mesh.material.LightmapTextureEnabled = true;
    //     // mesh.material.ambientTexture = new BABYLON.Texture("assets/ao.png", scene);
    //     // mesh.material.ambientTexture.coordinatesIndex = 1;
    //     // console.log(44, mesh)
    // });


    // Mouse events
    scene.onPointerObservable.add(function(evt) {

        if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            try {
                evt.event.target.setPointerCapture(evt.event.pointerId);
            } catch (e) {
                //Nothing to do with the error. Execution will continue.
            }

            hero.previousPosition = {
                x: evt.event.clientX,
                y: evt.event.clientY
            };
        }
        if (evt.type === BABYLON.PointerEventTypes.POINTERUP) {
            try {
                evt.event.target.releasePointerCapture(evt.event.pointerId);
            } catch (e) {
                //Nothing to do with the error.
            }

            hero.previousPosition = null;
        }
        if (evt.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (!hero.previousPosition) {
                return;
            }

            let offsetX = evt.event.clientX - hero.previousPosition.x;
            hero.heroRotation.y += offsetX / hero.angularSensibility;

            let offsetY = evt.event.clientY - hero.previousPosition.y;
            hero.heroRotation.x += offsetY / hero.angularSensibility;

            hero.previousPosition = {
                x: evt.event.clientX,
                y: evt.event.clientY
            };
        }
    });

    // Keyboard events
    let inputMap ={};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
    }));

    // Game/Render loop
    scene.onBeforeRenderObservable.add(() => {

        if (inputMap["w"] || inputMap["ArrowUp"]) {
            hero.heroDirection.z = hero.speed;
        }

        if (BABYLON.isOnMobile) {
            hero.heroDirection.z = hero.speed;
        }

        let forwards = new BABYLON.Vector3(0, 0, 0);
        let needToMove = Math.abs(hero.heroDirection.z) > 0;
        let needToRotate = Math.abs(hero.heroRotation.x) > 0 || Math.abs(hero.heroRotation.y) > 0;

        if (needToMove) {
            let speedCorrected = hero.heroDirection.z + hero.rotation.x * 5;
            forwards.x = parseFloat(Math.sin(hero.rotation.y)) * speedCorrected;
            forwards.y = parseFloat(-Math.sin(hero.rotation.x)) * speedCorrected;
            forwards.z = parseFloat(Math.cos(hero.rotation.y)) * speedCorrected;
            forwards.negate();

            hero.moveWithCollisions(forwards);

            if (Math.abs(hero.heroDirection.z) < hero.speed * BABYLON.Epsilon) {
                hero.heroDirection.z = 0;
            }

            // hero.heroDirection.scaleInPlace(hero.inertia);
            hero.heroDirection.z *= hero.inertia;

        }

        if (needToRotate) {
            hero.rotation.x += hero.heroRotation.x;
            hero.rotation.y += hero.heroRotation.y;

            // inertia
            if (Math.abs(hero.heroRotation.x) < hero.rotateSpeed * BABYLON.Epsilon) {
                hero.heroRotation.x = 0;
            }

            if (Math.abs(hero.heroRotation.y) < hero.rotateSpeed * BABYLON.Epsilon) {
                hero.heroRotation.y = 0;
            }
            hero.heroRotation.scaleInPlace(hero.inertia);
        }

    });



    canvasResize();

    return scene;
};


// call the createScene function
const scene = createScene();
// run the render loop
engine.runRenderLoop(function(){

    scene.render();
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
    BABYLON.isOnMobile = false;

    BABYLON.isOnMobile = !!(navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i));
}