// import * as BABYLON from 'babylonjs';
import BABYLON from '../BABYLON';

export default BABYLON.Scene.prototype.showFps = function(args){
    args = args || {};
    let ioSpeed = args.ioSpeed || 30;
    let location = args.location || 'tl';
    let offset = {};
    args.offset = args.offset || {};
    offset.x = args.offset.x || 0;
    offset.y = args.offset.y || 0;

    let font = args.font || "Arial";
    let color = args.color || 'rgba(180,180,180,0.65)';
    let size = args.size || '12px';
    let padding = args.padding || '0.2em;';
    let background = args.background || 'rgba(10,10,10,0.65)';
    let n = document.createElement('div');
    n.setAttribute('id', 'fps-block');
    n.setAttribute('style',
        'position:absolute;'+
        'top: 10px;' +
        'left: 10px;' +
        'display:block;'+
        'z-index:10001;'+
        'font-family:Arial, Helvetica, sans-serif;'+
        'pointer-events:none;'+
        'color:'+color+';'+
        'font-size:'+size+';'+
        'padding:'+padding+';'+
        'background-color:' + background + ';' +
        'transform:translate(' + offset.x + ',' + offset.y + ');' );

    n.innerHTML = "##&nbsp;fps";

    document.body.appendChild(n);

    let self = this;
    let pE = self._engine;

    function getFps() {
        let meshesCount = self.hasOwnProperty('meshes') ? self.meshes.length : '-';
        let b = document.getElementById('fps-block');
        if (b) {
            b.innerHTML = pE.getFps().toFixed() + " fps" + ' objCount:' + meshesCount;
            setTimeout(function () { getFps() }, 1000 / ioSpeed);
        }
    }

    getFps();

    return n;
};