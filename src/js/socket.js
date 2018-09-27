import Rnd from './lib/Rnd';
import {config} from './config';
import io from 'socket.io-client';
// const url = PRODUCTION ? 'https://arcane-lowlands-79462.herokuapp.com/' : 'http://localhost:5000';
// const url = config.host.url;
// const socket = io(url, {
//     reconnection: true,
//     reconnectionAttempts: 1,
//     reconnectionDelay: 1000,
//     timeout: 5000,
//     query: {
//         token: 'Guest' + Rnd.integer(100000)
//     }
// });


class Socket {
    constructor(username, userUID) {
        this.username = username;
        this.userUID = userUID;
        this.socket = null;
        this.isMyConnected = false;
    }

    connect() {
        this.socket = io(config.host.url, {
            reconnection: true,
            reconnectionAttempts: 1,
            reconnectionDelay: 1000,
            timeout: 5000,
            query: {
                token: this.userUID
            }
        });

        this.socket.on('connect_error', (err) => {
            console.log('connect_error', err);
            this.socket.close();
        });
        this.socket.on('reconnect_failed', () => {
            console.log('reconnect_failed');
            this.socket.close();
        });
        // check client is offline
        this.socket.on('server-ping', () => {
            // console.log('ping');
            this.socket.emit('client-pong');
        });
    }

    on(evtname, callback) {
        this.socket.on(evtname, callback);
    }

    emit(evtname, data) {
        this.socket.emit(evtname, data);
    }
}


/*socket.on('connect_error', (err) => {
    console.log('connect_error', err)
    socket.close();
});
// socket.on('connect_timeout', () => {
//     console.log('connect_timeout');
//     socket.close();
// });
socket.on('reconnect_failed', () => {
    console.log('reconnect_failed')
    socket.close();
});

// check client is offline
socket.on('server-ping', () => {
    // console.log('ping');
    socket.emit('client-pong');
});*/


export {Socket};

