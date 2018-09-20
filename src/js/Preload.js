import {AssetsManager} from 'babylonjs';
import 'babylonjs-loaders';

export default class Preload {
    constructor(app) {
        this.app = app;
    }

    create() {
        const assetsManager = new AssetsManager(this.app.scene);


        const meshTask1 = assetsManager.addMeshTask("room1", "", "assets/", "room1.babylon");
        meshTask1.onSuccess = function (task) {
        };
        meshTask1.onError = function (task, message, exception) {
            console.log(message, exception);
        };

        assetsManager.load();

        assetsManager.onFinish = (tasks) => {
            this.app.state.start('Game');
        };

    }

}