import {Socket} from './socket';

class Launcher {
    constructor(guestName, userUID) {
        this.username = guestName;
        this.userUID = userUID;

        this.start();
    }

    start() {
        const socket = new Socket(this.username, this.userUID);
        socket.connect();

        socket.on('room-wars-connect', userUID => {
            socket.isMyConnected = true;

            console.log('---------------- room-wars-connect', userUID);
        });

        let data = {
            user: socket.userUID,
            pos: {x: 0.111, y: 0.222, z: 0.333},
            rot: {x: 1, y: 2, z: 3}
        };

        socket.emit('ship-join', data);
    }
}


export default Launcher;