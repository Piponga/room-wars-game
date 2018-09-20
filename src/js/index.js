import { Engine, Scene} from 'babylonjs';
import StateManager from './StateManager';
import Preload from './Preload';
import Menu from './Game';


class App {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new Engine(this.canvas, false, {preserveDrawingBuffer: true, stencil: true});

        this.scene = new Scene(this.engine);
        this.engine.enableOfflineSupport = false;

        this.state = new StateManager(this);

        this.canvasResize();
        window.addEventListener('resize', () => {
            this.canvasResize();
        });
    }

    canvasResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.engine.resize();
    }
}

export default App;



const app = new App();


app.state.add('Preload', Preload);
app.state.add('Menu', Menu);

app.state.start('Preload');







