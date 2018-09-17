import Rnd from './lib/Rnd';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import './fps';
import {config} from './config';
import {CatmullRomCurve3} from './lib/CatmullRomCurve3';

import {socket} from './socket';


export default function Game(engine) {
    const PI = Math.PI;
    const halfPI = PI / 2;

    const createScene = function(scene){
        Game.bulletStream = [];
        Game.shipStream = [];
        Game.shotTimer = null;
        Game.inputMap = {};
        Game.ships = {};

        // Game.freeCamera = new BABYLON.FreeCamera('FreeCamera', new BABYLON.Vector3(0, 0, 0), scene);
        // Game.freeCamera.fov = config.world.fov;
        Game.touchCamera = new BABYLON.TouchCamera("TouchCamera", new BABYLON.Vector3(0, 0, 0), scene);
        Game.touchCamera.fov = config.world.fov;
        // Game.followCamera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), scene);
        // Game.followCamera.fov = config.world.fov;
        // Game.followCamera.radius = -200;
        // Game.followCamera.heightOffset = 100;
        // Game.followCamera.rotationOffset = 0;
        // Game.followCamera.cameraAcceleration = 0.1;
        // Game.followCamera.maxCameraSpeed = 100;
        scene.activeCamera = Game.touchCamera;

        Game.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1");

        // const roof = BABYLON.Mesh.CreatePlane("ground", 500, scene);
        const roofMat = new BABYLON.StandardMaterial("roofMat", scene);
        // roofMat.diffuseColor = new BABYLON.Color3(1.0, 0.1, 0.1);
        roofMat.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        const roof = BABYLON.Mesh.CreateGround("ground", 5000, 8000, 1, scene);
        roof.checkCollisions = true;
        roof.isPickable = true;
        roof.position.y = 3000;
        roof.rotation.x = PI;
        roof.material = roofMat;
        const room = scene.getMeshByName('room');
        // let roomChildren = room.getChildren();
        // for (let i = 0; i < roomChildren.length; i++) {
        //     if (roomChildren[i].material) {
        //         if (roomChildren[i].material.ambientTexture) {
        //             roomChildren[i].material.ambientTexture = null;
        //         }
        //     }
        // }
        // const floor = scene.getMeshByName('floor');
        // floor.isPickable = true;

        // const box012 = scene.getMeshByName('Box012');
        // box012.material.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5);

        // create move spline for BOT ------------------------------------------------------------------
        Game.movePath01 = scene.getMeshByName('movePath01');
        let pathChildrenArr = Game.movePath01.getChildren();
        let points = [];
        for (let i = 0; i < pathChildrenArr.length; i++) {
            let p = new BABYLON.Vector3(pathChildrenArr[i].absolutePosition.x, pathChildrenArr[i].absolutePosition.y, pathChildrenArr[i].absolutePosition.z);
            points.push(p);
        }
        const spline = new CatmullRomCurve3(points);
        spline.getLength();
        //----------------------------------------------------------------------------------------------

        Game.ship = scene.getMeshByName('ship01');
        Game.ship.rotationQuaternion = undefined;
        Game.ship.body = Game.scene.getMeshByName('ship01_body');

        Game.bullet = scene.getMeshByName('bullet01_body');
        Game.bullet.rotationQuaternion = undefined;
        Game.bullet.checkCollisions = false;

        Game.spawnContainer = scene.getMeshByName('spawn_container');
        Game.spawnContainer.setEnabled(false);

        // create HERO --------------------------------------------------------------------------------------
        let username = socket.username || 'hero';
        Game.hero = Game.spawnNewPlayer(username, {spawnPointIndex: undefined, isHero: true});
        Game.camera = scene.activeCamera;
        if (Game.camera === Game.followCamera) {
            Game.camera.lockedTarget = Game.hero;
        } else {
            Game.camera.parent = Game.hero;
        }

        let data = {
            user: username,
            pos: Game.hero.position,
            rot: Game.hero.rotation
        };
        Game.onFirstTap = false;

        socket.emit('ship-join', data);
        socket.emit('room-get');
        // --------------------------------------------------------------------------------------------------


        // CREATE ENEMY SHIP --------------------------------------------------------------------------------
        // Game.spawnNewPlayer('id1', {spawnPointIndex: undefined});
        let botCount = 20;
        let botInterval = spline.getLength() / botCount;
        for (let i = 0; i < botCount; i++) {
            // let bot = Game.spawnNewBot('bot' + i, botInterval * i);
            // bot.isMoving = false;
        }
        // GUI RED ------------------------------------------------------------------------------------------
        let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");
        Game.redShading = new GUI.Image('redShading', '/assets/red_shading.png');
        Game.redShading.alpha = 0.0;
        advancedTexture.addControl(Game.redShading);

        //---------------------------------------------------------------------------------------------------
        Game.clientJoin = new BABYLON.Sound("clientJoin", "assets/buy_voice1.wav", scene, null, { loop: false, autoplay: false });
        //---------------------------------------------------------------------------------------------------


        // function YourOptimizer() {
        //     var result = new BABYLON.SceneOptimizerOptions(40, 3000);
        //     result.optimizations.push(new BABYLON.TextureOptimization(0, 256));
        //     result.optimizations.push(new BABYLON.PostProcessesOptimization(1));
        //     result.optimizations.push(new BABYLON.LensFlaresOptimization(2));
        //     result.optimizations.push(new BABYLON.ShadowsOptimization(3));
        //     result.optimizations.push(new BABYLON.RenderTargetsOptimization(4));
        //     result.optimizations.push(new BABYLON.ParticlesOptimization(5));
        //     result.optimizations.push(new BABYLON.RenderTargetsOptimization(6));
        //     result.optimizations.push(new BABYLON.HardwareScalingOptimization(7, 4));
        //     return result;
        // }
        // BABYLON.SceneOptimizer.OptimizeAsync(scene, YourOptimizer());
        //
        // setTimeout(() => {
        //     optimizer.start();
        //
        // }, 5000);


        // Mouse events
        scene.onPointerObservable.add(function(evt) {

            if (evt.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                try {
                    evt.event.target.setPointerCapture(evt.event.pointerId);
                } catch (e) {
                    //Nothing to do with the error. Execution will continue.
                }

                Game.hero.previousPosition = {
                    x: evt.event.clientX,
                    y: evt.event.clientY
                };
                // Game.inputMap[38] = true;
                // Game.inputMap[32] = true;
                Game.onFirstTap = true;
            }
            if (evt.type === BABYLON.PointerEventTypes.POINTERUP) {
                try {
                    evt.event.target.releasePointerCapture(evt.event.pointerId);
                } catch (e) {
                    //Nothing to do with the error.
                }

                Game.hero.previousPosition = null;
                // Game.inputMap[38] = false;
                // Game.inputMap[32] = false;
            }
            if (evt.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                if (!Game.hero.previousPosition) {
                    // Game.hero.previousPosition = {
                    //     x: evt.event.clientX,
                    //     y: evt.event.clientY
                    // };
                    return;
                }

                let offsetX = evt.event.clientX - Game.hero.previousPosition.x;
                Game.hero.heroRotation.y += offsetX / Game.hero.angularSensibility;

                let offsetY = evt.event.clientY - Game.hero.previousPosition.y;
                Game.hero.heroRotation.x += offsetY / Game.hero.angularSensibility;

                Game.hero.previousPosition = {
                    x: evt.event.clientX,
                    y: evt.event.clientY
                };
            }
        });

        // Keyboard events
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            Game.inputMap[evt.sourceEvent.keyCode] = evt.sourceEvent.type === "keydown";
            // console.log(evt.sourceEvent.keyCode)
            // if (evt.sourceEvent.keyCode === 81) {
            //     scene.getMeshByName('bot1').onDeath();
            // }
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            Game.inputMap[evt.sourceEvent.keyCode] = evt.sourceEvent.type === "keydown";
            clearTimeout(Game.shotTimer);
            Game.shotTimer = null;
            Game.hero.isMoving = false;
            Game.hero.isShooting = false;
        }));



        scene.onBeforeRenderObservable.add(() => {
            let time = Date.now();
            let dt = scene._engine.getDeltaTime() * 0.001;

            if (Game.onFirstTap) {
                if (PRODUCTION || Game.isOnMobile) {
                    Game.inputMap[87] = true;
                    Game.inputMap[32] = true;
                }
            }
            if (Game.inputMap[87] || Game.inputMap[38]) {              // 87 - w, 38 - up arrow
                Game.hero.heroDirection.z = Game.hero.speed;
                Game.hero.isMoving = true;
            }
            if (Game.inputMap[32]) {                                    // 32 - space
                Game.hero.isShooting = true;
            }


            // ships ----------------------------------
            for (let i = 0; i < Game.shipStream.length; i++) {
                let ship = Game.shipStream[i];
                if (!ship || !ship.active) {
                    continue;
                }

                if (ship.isBot && ship.isMoving) {
                    // animate ship along spline
                    if (!ship.looptime) ship.looptime = (spline.getLength() / (ship.speed * 1)) * 1000;
                    let t = ( (time + ship.startBotTime) % ship.looptime ) / ship.looptime;

                    ship.position = spline.getPoint(t);
                    let lookAt = spline.getPoint( ( t - 10 / spline.getLength() ) % 1 );
                    ship.lookAt(lookAt);
                }

                let forwards = new BABYLON.Vector3(0, 0, 0);
                // let needToMove = Math.abs(ship.heroDirection.z) > 0;
                let needToMove = Math.abs(ship.heroDirection.z) > 0 || ship.isMoving;
                let needToRotate = Math.abs(ship.heroRotation.x) > 0 || Math.abs(ship.heroRotation.y) > 0;

                if (needToMove) {
                    let speedCorrected = ship.heroDirection.z * dt + ship.rotation.x * 0;
                    forwards.x = parseFloat(Math.sin(ship.rotation.y)) * speedCorrected;
                    forwards.y = parseFloat(-Math.sin(ship.rotation.x)) * speedCorrected;
                    forwards.z = parseFloat(Math.cos(ship.rotation.y)) * speedCorrected;
                    forwards.negate();

                    ship.moveWithCollisions(forwards);

                    if (Math.abs(ship.heroDirection.z) < ship.speed * BABYLON.Epsilon) {
                        ship.heroDirection.z = 0;
                    }

                    // ship.heroDirection.scaleInPlace(ship.inertia);
                    if (!ship.isMoving) {
                        ship.heroDirection.z *= ship.inertia;
                    }
                }

                if (needToRotate) {
                    ship.rotation.x += ship.heroRotation.x;
                    ship.rotation.y += ship.heroRotation.y;

                    if (ship.rotation.x < -halfPI) {
                        ship.rotation.x = -halfPI;
                    }
                    if (ship.rotation.x > halfPI) {
                        ship.rotation.x = halfPI;
                    }

                    // inertia
                    if (Math.abs(ship.heroRotation.x) < ship.rotateSpeed * BABYLON.Epsilon) {
                        ship.heroRotation.x = 0;
                    }

                    if (Math.abs(ship.heroRotation.y) < ship.rotateSpeed * BABYLON.Epsilon) {
                        ship.heroRotation.y = 0;
                    }
                    ship.heroRotation.scaleInPlace(ship.inertia);
                }

                // hit RED coloring
                if (ship.hitFadeTimer > 0) {
                    let gb = BABYLON.Scalar.Lerp(1, 0, ship.hitFadeTimer);
                    ship.body.material.diffuseColor = new BABYLON.Color3(1, gb, gb);
                    if (ship.isHero) Game.redShading.alpha = ship.hitFadeTimer;

                    ship.hitFadeTimer -= dt * 3;
                }

                // shooting
                let onShotForSocket = false;
                if (ship.isShooting) {                                    // 32 - space
                    let diff = time - ship.startShootTime;
                    if (diff > ship.shotDelay) {
                        Game.shotBullets(ship);
                        onShotForSocket = true;
                        ship.startShootTime = time;
                    }
                }

                if (!ship.isBot) {
                    let data = {};
                    if (needToMove) {
                        data.pos = ship.position;
                    }
                    if (needToRotate) {
                        data.rot = ship.rotation;
                    }
                    if (onShotForSocket) {
                        data.shot = true;
                    }
                    if (data.pos || data.rot || data.shot) {
                        socket.emit('ship-move', data);
                        onShotForSocket = false;
                    }
                }

            }


            // bullets ----------------------------------
            for (let i = 0; i < Game.bulletStream.length; i++) {
                let bullet = Game.bulletStream[i];
                if (!bullet || !bullet.active) {
                    continue;
                }

                if (bullet.curShotDist > bullet.shotDistance) {
                    bullet.active = false;
                    bullet.setEnabled(false);
                    continue;
                }

                let origin = bullet.position;

                let forward = new BABYLON.Vector3(0,0,1);
                forward = BABYLON.Vector3.TransformCoordinates(forward, bullet.trunkWorldMatrix);

                let direction = forward.subtract(origin);
                direction = BABYLON.Vector3.Normalize(direction);

                let length = bullet.bulletSpeed * dt;

                let ray = new BABYLON.Ray(origin, direction, length);

                let hit = Game.scene.pickWithRay(ray, null);

                if (hit.pickedMesh){
                    // console.log(444, hit.pickedMesh);

                    // bullets hit ship collider, NOT a ship. We must take parent of collider and this will be ship
                    //!!! 'shipId' has only ship.heroCollider.shipId = ship.name
                    if (hit.pickedMesh.hasOwnProperty('shipId')) {
                        let ship = hit.pickedMesh.parent;
                        ship.onDemaged(bullet.parentShip.name, bullet.bulletPower);         // you got damage from someone
                        bullet.parentShip.onHitOpponent(ship.name, bullet.bulletPower);     // you hit someone

                        ship.hitFadeTimer = 1;
                    }

                    bullet.active = false;
                    bullet.setEnabled(false);
                    // hit.pickedMesh
                    // hit.pickedPoint
                    continue;
                } else {
                    bullet.position.x += direction.x * bullet.bulletSpeed * dt;
                    bullet.position.y += direction.y * bullet.bulletSpeed * dt;
                    bullet.position.z += direction.z * bullet.bulletSpeed * dt;
                    bullet.curShotDist += bullet.bulletSpeed * dt;

                    bullet.trunkWorldMatrix = bullet.getWorldMatrix();
                }

                if (Math.abs(bullet.position.x) > 2600 || Math.abs(bullet.position.y) > 3000 || Math.abs(bullet.position.z) > 4100) {
                    console.log('bullet is went beyond range');
                    bullet.active = false;
                    bullet.setEnabled(false);
                }
            }

        });


        scene.collisionsEnabled = true;
        scene.showFps();

        return scene;
    };


    Game.scene = engine.scenes[0];
    Game.scene = createScene(Game.scene);

    engine.runRenderLoop(function(){

        Game.scene.render();
    });
};

Game.shotBullets = function (ship) {
    let r = ship.rotation;

    Game.createBullet(ship, ship.trunkLeft.absolutePosition, {x: r.x, y: r.y+ship.shotDevistionRad, z: r.z}, ship.trunkLeft, ship.weaponType, ship.bulletSpeed, ship.bulletPower, ship.shotDistance);
    Game.createBullet(ship, ship.trunkRight.absolutePosition, {x: r.x, y: r.y-ship.shotDevistionRad, z: r.z}, ship.trunkRight, ship.weaponType, ship.bulletSpeed, ship.bulletPower, ship.shotDistance);
};

Game.createBullet = function (ship, position, rotation, trunk, type, speed, power, shotDistance) {
    let bullet = Game.bulletStream[Game.getBullet()];	// take bullet from pool
    bullet.parentShip = ship;
    bullet.bulletSpeed = speed;
    bullet.bulletPower = power;
    bullet.trunkWorldMatrix = trunk.getWorldMatrix().clone();
    bullet.curShotDist = 0;
    bullet.shotDistance = shotDistance;

    bullet.position.x = position.x;
    bullet.position.y = position.y;
    bullet.position.z = position.z;

    bullet.rotation.x = rotation.x;
    bullet.rotation.y = rotation.y;
    bullet.rotation.z = rotation.z;

    bullet.active = true;
    bullet.setEnabled(true);
    // bullet.visibility = 0.1;
};
Game.getBullet = function() {
    let i = 0;
    let len = Game.bulletStream.length;

    //pooling approach
    if (len === 0) {
        Game.bulletStream[0] = Game.bullet.clone('bullet');

        Game.bulletStream[0].material.alphaMode = BABYLON.Engine.ALPHA_ADD;
        // console.log(33)
    } else if (len > 700) {
        Game.bulletStream[i].active = true;
        Game.bulletStream[i].setEnabled(true);
        console.log('bullets pool exceeded');
    } else {
        while (i <= len) {
            if (!Game.bulletStream[i]) {
                Game.bulletStream[i] = Game.bullet.clone('bullet');

                Game.bulletStream[i].material.alphaMode = BABYLON.Engine.ALPHA_ADD;
                // console.log(11)
                break;
            } else if (!Game.bulletStream[i].active) {
                Game.bulletStream[i].active = true;
                Game.bulletStream[i].setEnabled(true);
                // console.log(22)
                break;
            } else {
                i++;
            }
        }
    }

    return i;
};


Game.spawnNewBot = function (botIdStr, startBotPoint) {
    let movePointsArr = Game.movePath01.getChildren();
    // if (!startBotPoint) startBotPoint = Rnd.integer(movePointsArr.length);
    // startBotPoint = startBotPoint%100;
    let spawnPoint = movePointsArr[0];
    let position = spawnPoint.absolutePosition;
    let rotation = spawnPoint.rotationQuaternion.toEulerAngles();

    return Game.createShip(botIdStr, position, rotation, {
        shipType: 'newbie',
        weaponType: 'newbie',
        isBot: true,
        startBotPoint: startBotPoint
    });
};

Game.spawnNewPlayer = function (shipIdStr, params) {
    let {spawnPointIndex, position, rotation, ...param} = params;
    let spawnPoint = Game.ChooseSpawnPoint(Game.spawnContainer, spawnPointIndex);
    if (position === undefined) position = spawnPoint.absolutePosition;
    if (rotation === undefined) rotation = spawnPoint.rotationQuaternion.toEulerAngles();

    return Game.createShip(shipIdStr, position, rotation, {
        shipType: 'newbie',
        weaponType: 'newbie',
        ...param
    });
};

Game.createShip = function (shipIdStr, position, rotation, params) {
    let {shipType='newbie', weaponType='newbie', isBot=false, startBotPoint, isHero=false} = params;

    let ship = Game.shipStream[Game.getShip()];
    if (!Game.ships[shipIdStr]) Game.ships[shipIdStr] = {};
    Game.ships[shipIdStr] = ship;

    ship.name = shipIdStr;
    ship.position.x = position.x;
    ship.position.y = position.y;
    ship.position.z = position.z;

    ship.rotation.x = rotation.x;
    ship.rotation.y = rotation.y;
    ship.rotation.z = rotation.z;

    ship.heroDirection = new BABYLON.Vector3(0, 0, 0);
    ship.heroRotation = new BABYLON.Vector2(0, 0);
    ship.isMoving = false;
    ship.isShooting = false;
    ship.startShootTime = 0;
    ship.isHero = isHero;
    if (ship.isHero) ship.ellipsoid = new BABYLON.Vector3(72, 50, 52.5);
    ship.active = true;
    ship.setEnabled(true);
    ship.hitFadeTimer = 0;
    ship.body.material.diffuseColor = new BABYLON.Color3(1, 1, 1);

    // ship.body = Game.scene.getMeshByName(ship.cloneId + '.ship01_body');
    ship.trunkLeft = Game.scene.getMeshByName(ship.cloneId + '.ship01_left_trunk');
    ship.trunkRight = Game.scene.getMeshByName(ship.cloneId + '.ship01_right_trunk');
    ship.heroCollider = Game.scene.getMeshByName(ship.cloneId + '.ship01_collider');
    // ship.heroCollider.dispose();
    ship.heroCollider.shipId = ship.name;
    ship.heroCollider.visibility = 0.0;
    ship.heroCollider.checkCollisions = false;
    ship.heroCollider.isPickable = true;

    ship.shipType = shipType;
    ship.speed = config.ships[ship.shipType].speed;
    ship.healthPoints = config.ships[ship.shipType].hp;
    ship.rotateSpeed = config.ships[ship.shipType].rotateSpeed;
    ship.angularSensibility = config.ships[ship.shipType].angularSensibility;
    ship.inertia = config.ships[ship.shipType].inertia;

    ship.weaponType = weaponType;
    ship.bulletSpeed = config.weapons[ship.weaponType].bulletSpeed;
    ship.bulletPower = config.weapons[ship.weaponType].bulletPower;
    ship.shotDelay = config.weapons[ship.weaponType].shotDelay;
    ship.shotDistance = config.weapons[ship.weaponType].shotDistance;
    ship.shotDevistionRad = Math.atan(ship.trunkRight.position.x / ship.shotDistance);
    ship.shotTimer = null;

    ship.isBot = isBot;
    ship.startBotPoint = startBotPoint;
    ship.startBotTime = startBotPoint === undefined ? Rnd.integer(40000) : startBotPoint;
    if (ship.isBot) ship.heroDirection.z = ship.speed*0.25;
    if (ship.isBot) ship.isMoving = true;
    if (ship.isBot) ship.isShooting = false;

    ship.onCollide = function (e) {
        // console.log(6666, e);
    };
    ship.onHitOpponent = function (opponentId, demage) {
        if (this.isHero) {
            console.log('+ вы нанесли ' + opponentId + '  ' + demage + ' урона');
        }
    };
    ship.onDemaged = function (whoDemaged, demage) {
        this.healthPoints -= demage;

        if (this.isHero) {
            console.log('----- ' + whoDemaged + ' нанёс вам урон ' + demage);
        }

        if (this.healthPoints <= 0) {
            if (this.isHero) {
                console.log('------------------------ вы убиты ');
                // this.healthPoints = config.ships[this.shipType].hp;
                // return;

                Game.redShading.alpha = 1.0;
                this.isShooting = false;
                this.isMoving = false;
                this.active = false;
                this.setEnabled(false);
                delete Game.ships[this.name];

                // Game.camera.parent = Game.ships[whoDemaged];
                Game.camera.parent = null;
                setTimeout(() => {
                    let username = socket.username || 'hero';
                    Game.hero = Game.spawnNewPlayer(username, {spawnPointIndex: undefined, isHero: true});
                    Game.camera.parent = Game.hero;
                    Game.onFirstTap = false;
                    Game.redShading.alpha = 0.0;

                    let data = {
                        user: username,
                        pos: Game.hero.position,
                        rot: Game.hero.rotation
                    };
                    socket.emit('ship-respawn', data);
                }, 3000);

                socket.emit('ship-died');
            }

            // this.onDeath();
        }
    };
    ship.onDeath = function () {
        this.isShooting = false;
        this.isMoving = false;
        this.active = false;
        this.setEnabled(false);
        delete Game.ships[this.name];

        console.log('******* ' + this.name + ' убит *******');

        if (this.isBot) {
            setTimeout(() => {
                Game.spawnNewBot('bot1', 15);
            }, 1000);
        }
    };

    if (!ship.isHero) ship.drawlabelName();

    return ship;
};
Game.getShip = function () {
    let i = 0;
    let len = Game.shipStream.length;

    //pooling approach
    if (len === 0) {
        Game.shipStream[0] = Game.ship.clone('0');
        Game.shipStream[0].cloneId = '0';
        Game.shipStream[0].body = Game.scene.getMeshByName(Game.shipStream[0].cloneId + '.ship01_body');
        Game.shipStream[0].body.material = Game.ship.body.material.clone();
        Game.createShipLabel(Game.shipStream[0]);
        // console.log(33)
    } else if (len > 20) {
        Game.shipStream[i].active = true;
        Game.shipStream[i].setEnabled(true);
        console.log('shops pool exceeded');
    } else {
        while (i <= len) {
            if (!Game.shipStream[i]) {
                Game.shipStream[i] = Game.ship.clone(i + '');
                Game.shipStream[i].cloneId = i + '';
                Game.shipStream[i].body = Game.scene.getMeshByName(Game.shipStream[i].cloneId + '.ship01_body');
                Game.shipStream[i].body.material = Game.ship.body.material.clone();
                Game.createShipLabel(Game.shipStream[i]);
                // console.log(11)
                break;
            } else if (!Game.shipStream[i].active) {
                Game.shipStream[i].active = true;
                Game.shipStream[i].setEnabled(true);
                // console.log(22)
                break;
            } else {
                i++;
            }
        }
    }

    return i;
};
Game.createShipLabel = function(mesh) {
    const scene = mesh.getScene();

    mesh.labelName = BABYLON.Mesh.CreatePlane("outputplane", 70, scene, false);
    mesh.labelName.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
    mesh.labelName.material = new BABYLON.StandardMaterial("outputplane", scene);
    mesh.labelName.position = new BABYLON.Vector3(0, 150, 0);
    mesh.labelName.scaling.x = 8.5;
    mesh.labelName.parent = mesh;

    mesh.labelNameTexture = new BABYLON.DynamicTexture("outputplaneTexture", {width: 256, height: 30}, scene, true);
    mesh.labelNameTexture.getContext().textAlign = 'center';
    // mesh.labelNameTexture.drawText(mesh.name, 128, 22, "bold 25px arial", "white", "transparent", true);   // 20 symbols MAX
    mesh.labelNameTexture.hasAlpha = true;
    mesh.labelName.material.diffuseTexture = mesh.labelNameTexture;
    mesh.labelName.material.specularColor = new BABYLON.Color3(0, 0, 0);
    mesh.labelName.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    mesh.labelName.material.backFaceCulling = false;

    mesh.drawlabelName = function () {
        this.labelNameTexture.drawText(this.name, 128, 22, "bold 25px arial", "white", "transparent", true);   // 20 symbols MAX
    }
};


Game.ChooseSpawnPoint = function (spawnContainer, ind) {
    let spawnArr = spawnContainer.getChildren();

    if (ind === undefined) {
        ind = Rnd.integer(0, spawnArr.length);
    }

    return spawnArr[ind];
};

Game.setChildrenVisibility = function (mesh, value) {
    mesh.isVisible = value;

    let children = mesh.getChildren();

    for (let i = 0; i < children.length; i++) {
        let child = children[i];

        Game.setChildrenVisibility(child, value);
    }
};

// Ellipsoid
Game.drawEllipsoid = function(mesh) {
    mesh.computeWorldMatrix(true);
    let ellipsoidMat = mesh.getScene().getMaterialByName("__ellipsoidMat__");
    if (! ellipsoidMat) {
        ellipsoidMat = new BABYLON.StandardMaterial("__ellipsoidMat__", mesh.getScene());
        ellipsoidMat.wireframe = true;
        ellipsoidMat.emissiveColor = BABYLON.Color3.Green();
        ellipsoidMat.specularColor = BABYLON.Color3.Black();
    }
    let ellipsoid = BABYLON.Mesh.CreateSphere("__ellipsoid__", 9, 1, mesh.getScene());
    ellipsoid.scaling = mesh.ellipsoid.clone();
    ellipsoid.scaling.y *= 2;
    ellipsoid.scaling.x *= 2;
    ellipsoid.scaling.z *= 2;
    ellipsoid.material = ellipsoidMat;
    ellipsoid.parent = mesh;
    ellipsoid.computeWorldMatrix(true);
};

function vecToLocal(vector, mesh){
    let m = mesh.getWorldMatrix();
    let v = BABYLON.Vector3.TransformCoordinates(vector, m);
    return v;
}
//======================================================================================
//======================================================================================
//======================================================================================
socket.on('room-get', function (state) {
    if (!state.ships) return;

    for (let key in state.ships) {
        if (key !== socket.username) {
            Game.spawnNewPlayer(key, {
                position: state.ships[key].pos,
                rotation: state.ships[key].rot
            });
        }
    }
});

socket.on('ship-move', function (username, data) {
    // console.log(555, username, data, Game.ships[username])
    if (!socket.isMyConnected) return;
    if (!Game.ships || !Game.ships[username]) return;

    let ship = Game.ships[username];
    if (!ship) return;

    if (data.pos) ship.position = data.pos;
    if (data.rot) ship.rotation = data.rot;
    if (data.shot) Game.shotBullets(ship);
});

socket.on('ship-died', function (username) {
    if (!socket.isMyConnected) return;
    if (!Game.ships || !Game.ships[username]) return;

    let ship = Game.ships[username];
    if (!ship) return;

    ship.onDeath();
});

socket.on('ship-join', function (data) {

    // if (!Game.scene.getMeshByName(username)) {
        console.log('user joined +++ ' + data.user);
        Game.spawnNewPlayer(data.user, {
            position: data.pos,
            rotation: data.rot
        });
    // }
    Game.clientJoin.play();
    // if (!socket.isMyConnected) return;
    // appendUl(username + ' вошёл в чат', 'gray');
});

socket.on('ship-respawn', function (data) {
    Game.spawnNewPlayer(data.user, {
        position: data.pos,
        rotation: data.rot
    });
});

socket.on('leave', function (username) {
    if (!socket.isMyConnected) return;
    console.log('user disconnected --- ' + username);
    let ship = Game.scene.getMeshByName(username);

    if (!ship) return;
    // ship.dispose();
    ship.isShooting = false;
    ship.isMoving = false;
    ship.active = false;
    ship.setEnabled(false);
    delete Game.ships[ship.name];
});

socket.on('disconnect', function () {
    socket.isMyConnected = false;
});
