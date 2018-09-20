export default class StateManager {
    constructor(app) {
        this.app = app;

        this._curState = null;
        this.states = {};
    }

    add(name, state) {
        this.states[name] = new state(this.app);
    }

    start(name) {
        this._curState = name;
        this.states[this._curState].create();
    }

    update() {
        let stateUpdate = this.states[this._curState].update;
        if (stateUpdate) {
            stateUpdate.call(this);
        }
    }
}