import Rnd from './lib/Rnd';
import { Vector3, TouchCamera} from 'babylonjs';
import {config} from './config';
import './lib/fps';

export class Game {
    constructor(app) {
        this.app = app;

    }

    create() {
        const scene = this.app.scene;

        const touchCamera = new TouchCamera("TouchCamera", new Vector3(0, 0, 0), scene);
        touchCamera.fov = config.world.fov;
        scene.activeCamera = touchCamera;

        // ROOM ------------------------------------------------------------------------
        const room = scene.getMeshByName('room');

        // SPAWN POINTS ----------------------------------------------------------------
        const spawnContainer = scene.getMeshByName('spawn_container');
        spawnContainer.setEnabled(false);

        let spawnPoint = Game.ChooseSpawnPoint(spawnContainer, 1);
        touchCamera.position = spawnPoint.absolutePosition;
        touchCamera.rotation = spawnPoint.rotationQuaternion.toEulerAngles();

        scene.showFps();

        this.app.engine.runRenderLoop(() => {
            this.update();
        });
    }

    update() {
        this.app.scene.render();
    }

    static ChooseSpawnPoint(spawnContainer, ind) {
        let spawnArr = spawnContainer.getChildren();

        if (ind === undefined) {
            ind = Rnd.integer(0, spawnArr.length);
        }

        return spawnArr[ind];
    }
}

