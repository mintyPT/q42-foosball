var Tracker = require('./trackers/CamTracker');

/**
 * Server-side game engine implementation
 * @param {Socket.io} socket
 * @constructor
 */

var GameEngine = function ( socket ) {


    this.resetGame();

    this.socket = socket;
    this.tracker = new Tracker();

    this.bindSocketEvents();
    this.bindTrackerEvents();

    this.tracker.start();
};

GameEngine.prototype = {

    bindSocketEvents: function () {

        this.socket.on('connection', function ( client ) {

            console.log('connected!');

            // Admin
            client.on('request-hsv', this.handleRequestHSV.bind( this ) );
            client.on('table-bounds', this.handleTableBounds.bind( this ) );

            client.on('score-red', this.handleScoreRed.bind( this ) );
            client.on('score-blue', this.handleScoreBlue.bind( this ) );

        }.bind( this ) );

    },

    bindTrackerEvents: function () {

        this.tracker.on('frame', this.emitFrameGrab.bind( this ) );
        this.tracker.on('mask', this.emitMaskGrab.bind( this ) );
        this.tracker.on('ball-positions', this.handleBallPositions.bind( this ) );

    },

    emitFrameGrab: function ( frameBuffer ) {
        this.socket.emit('frame', frameBuffer );
    },

    emitMaskGrab: function ( frameBuffer ) {
        this.socket.emit('mask', frameBuffer );
    },

    handleBallPositions : function ( data ) {
        //console.log( 'ball-positions', data );

        this.state.positions = data;

        this.socket.emit( 'ball-positions', data );
    },

    handleRequestHSV: function ( position ) {

        this.tracker.getHSVForPosition( position ).then( function ( hsv ) {
            this.socket.emit('get-hsv', hsv);
        }.bind( this ) );
    },

    handleScoreBlue: function () {

        console.log('blue scored');
        this.state.score.blue++;

        this.socket.emit('score-update', this.state.score );
    },

    handleScoreRed: function () {
        console.log('red scored');
        this.state.score.red++;

        this.socket.emit('score-update', this.state.score );
    },

    handleTableBounds: function ( bounds ) {
        console.log('bounds');
        this.tracker.setTableBounds( bounds );
    },

    resetGame: function () {
        this.state = {
            positions: [],
            score: {
                red: 0,
                blue: 0
            }
        };
    }
};

module.exports = GameEngine;