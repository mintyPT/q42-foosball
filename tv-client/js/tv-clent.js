var backgroundLayer = project.activeLayer;
var fieldLayer = new Layer();
var hitLayer = new Layer();
var trailBallLayer = new Layer();
var ballLayer = new Layer();
var frenzyLayer = new Layer();
var scoreLayer = new Layer();
var overlayLayer = new Layer();

var ball;
var background;
var game;
var goal;
var hits = [];

var backgroundTheme = 0;

var frenzy;
var frenzyTeam = undefined;

var useMousePos = false;
var currentPos;

var teamColors = ["red", "blue"];
var ownerColor = "white";

var replayBalls = [];
var replaySeconds = 3;
var replayPositions = [];

var size = view.size;
var screenSize = {
    x : 120,
    y : 68
};


var socket = io( "http://10.42.38.110:9090" );


// SOUNDS
var soundPlaying;

var ost = new buzz.sound( "sounds/soundtrack", { formats : ["mp3"] } );
var frenzyTrack = new buzz.sound( "sounds/frenzy-track-short", { formats : ["mp3"] } );
var frenzySound = new buzz.sound( "sounds/frenzy", { formats : ["mp3"] } );

ost.play();
ost.loop();

var goalSound = new buzz.sound( "sounds/goal1", { formats : ["wav"] } );
var explosionLongSound = new buzz.sound( "sounds/explosion-long", { formats : ["wav"] } );


var fussBallSounds = new buzz.group( [goalSound, explosionLongSound] );

fussBallSounds.bind( "ended", function ( e ) {
    soundPlaying = false;
} );

fussBallSounds.bind( "play", function ( e ) {
    soundPlaying = true;
} );


function handleSocketEvents () {

    socket.on( 'reset-game', function ( event ) {
        console.log( "reset game:", event );

        background = new Background();
        pitch = new Pitch();
        ball = new Ball();
        game = new GameGraphics();
    } );

    socket.on( 'end-frenzy', function () {
        frenzyTeam = undefined;
    } );

    socket.on( 'frenzy', function ( team, state ) {

        if ( team == 'left' ) {
            frenzyTeam = 1;
        }

        if ( team == 'right' ) {
            frenzyTeam = 0;
        }

        if ( ! state ) {
            frenzyTeam = undefined;
        }
    } );

    socket.on( 'get-current-theme', function ( theme ) {
        console.log( "get current theme ", theme );

        backgroundTheme = theme;

        if ( background ) {
            background.change( backgroundTheme );
        }

    } );

    socket.on( 'change-theme', function ( theme ) {
        console.log( "theme event:", theme );

        backgroundTheme = theme;
        if ( background ) {
            background.change( backgroundTheme );
        }
    } );

    socket.on( 'ball-positions', function ( positions ) {
        if ( ! useMousePos ) {
            currentPos = positions.shift();
        }
    } );

    socket.on( 'score-left', function ( event ) {
        console.log( event );
        game.goalScored( 0 );
    } );

    socket.on( 'score-right', function ( event ) {
        console.log( event );
        game.goalScored( 1 );
    } );

}


var Hit = function ( posX, posY ) {

    hitLayer.activate();

    this.radius = 200;
    this.lifespan = 60;

    this.item = new Shape.Ellipse( {
        center : [posX, posY],
        size : [this.radius, this.radius],
        fillColor : 'rgba(0,0,0,0)',
        strokeColor : ownerColor,
        strokeWidth : 10
    } );

};

Hit.prototype.iterate = function () {

    this.item.size = this.lifespan * 4;

    if ( this.lifespan == 0 ) {
        var i = hits.indexOf( this );
        hits.splice( i, 1 );
    }

    this.lifespan --;
};


function ReplayBall () {

    if ( ball && ball.item ) {
        ball.item.remove();
    }
    ball.removeStills();

    ball = undefined;

    this.radius = 50;

    this.item = new Shape.Ellipse( {
        center : [0, 0],
        size : [this.radius, this.radius],
        fillColor : ownerColor
    } );

    this.replayText1 = new PointText( {
        point : [250, 250],
        justification : 'center',
        fontSize : 50,
        fillColor : ownerColor
    } );

    this.replayText1.style = {
        fontFamily : 'Exo', fontWeight : 'bold'
    };

    this.replayText2 = new PointText( {
        point : [size.width - 250, size.height - 250],
        justification : 'center',
        fontSize : 50,
        fillColor : ownerColor
    } );

    this.replayText2.style = {
        fontFamily : 'Exo', fontWeight : 'bold'
    };
    this.replayText1.content = "REPLAY";
    this.replayText2.content = "REPLAY";
    this.replayText2.rotate( 180 );

}

ReplayBall.prototype.iterate = function () {

    if ( replayPositions.length > 0 ) {
        var pos = replayPositions.shift();
        this.item.position.x = pos[0];
        this.item.position.y = pos[1];
    } else {
        this.item.remove();
        var i = replayBalls.indexOf( this );
        replayBalls.splice( i, 1 );
        ball = new Ball();

        this.replayText1.remove();
        this.replayText2.remove();
    }

};

var endFrenzy = function () {
    frenzyLayer.removeChildren();
    frenzy = undefined;
    frenzySound.stop();
    frenzyTrack.stop();
    ost.unmute();
    //ost.loop();
    background.currentplaybackrate = 1;
    background.currentVideo.playbackRate = background.currentplaybackrate;
};

var Frenzy = function ( owner ) {

    var ownerColor = teamColors[owner];
    frenzyLayer.activate();

    //this.lifespan = 280;
    this.lifespan = 0;
    this.frenzyTextGroup = [];

    //
    ost.mute();
    frenzyTrack.play();
    frenzyTrack.loop();
    background.currentplaybackrate = 3;
    background.currentVideo.playbackRate = background.currentplaybackrate;
    frenzySound.play();

    //if ( ! soundPlaying ) {
    //
    //}

    for ( var i = 0; i < 20; i ++ ) {
        var text = new PointText( {
            point : [i * 100, size.height / 2],
            justification : 'center',
            fontSize : 100,
            strokeColor : 'white'
        } );
        text.style = {
            fontFamily : 'Exo', fontWeight : 'bold'
        };
        text.content = "FRENZY FRENZY FRENZY   ";

        if ( i % 2 == 0 ) {
            text.content = "   FRENZY FRENZY FRENZY";
        }
        text.strokeColor.hue = Math.floor( Math.random() * 30 );
        text.opacity = 0;
        text.rotate( 60 );
        this.frenzyTextGroup.push( text );
    };

};

Frenzy.prototype.iterate = function () {

    // Iterate through the items contained within the array:
    for ( var i = 0; i < this.frenzyTextGroup.length; i ++ ) {
        var child = this.frenzyTextGroup[i];


        if ( this.lifespan % 10 == 0 ) {
            child.strokeColor.hue = Math.floor( Math.random() * 60 );
        }

        if ( this.lifespan % 3 == 0 ) {

            var opt = Math.floor( Math.random() * 4 );
            if ( opt == 0 ) {
                child.opacity = 1;
            } else {
                child.opacity = 0;
            }
        }

        //if ( this.lifespan == 0 ) {
        //    child.remove();
        //}
    }
    this.lifespan ++;

    //if ( this.lifespan == 0 ) {
    //    this.frenzyTextGroup = [];
    //    endFrenzy();
    //}
    //
    //this.lifespan --;

};

var trailBalls = [];
var TrailBall = function ( posX, posY, size ) {

    var maxSize = 20;
    trailBallLayer.activate();

    if ( size > maxSize ) {
        size = maxSize;
    }

    this.radius = size * 5;
    this.lifespan = 120;

    this.item = new Path.Circle( {
        center : [posX, posY],
        radius : this.radius
    } );

    this.item.fillColor = {
        stops : ['rgba(0,255,200,0.5)', 'rgba(0,255,255,0.5)', 'rgba(0,0,255,0.5)', 'rgba(0,0,255,0)'],
        radial : true,
        origin : [posX, posY],
        destination : this.item.bounds.rightCenter
    }

};

TrailBall.prototype.iterate = function () {

    this.item.scale( this.lifespan / 120 );

    this.item.opacity = this.lifespan / 240;

    if ( this.lifespan == 0 ) {
        var i = trailBalls.indexOf( this );
        trailBalls.splice( i, 1 );
    }

    this.lifespan --;
};

var Ball = function () {

    ballLayer.activate();

    this.radius = 50;

    this.item = new Shape.Ellipse( {
        center : [0, 0],
        size : [this.radius, this.radius],
        fillColor : 'rgba(0,0,255,0)'
    } );

    this.destination = Point.random() * (view.size + 100);
    this.stillCounter = 0;

    this.maxReplayPositions = replaySeconds * 60;

};


Ball.prototype.removeStills = function () {
    if ( this.still ) {
        this.still.remove();
    }
    if ( this.still2 ) {
        this.still2.remove();
    }

    this.stillCounter = 0;
    this.still2 = undefined;
    this.still = undefined;
};

Ball.prototype.iterate = function ( position ) {

    if ( ! useMousePos ) {
        this.item.position.x = position.x / screenSize.x * size.width;
        this.item.position.y = position.y / screenSize.y * size.height;
    } else {
        this.item.position.x = position.x;
        this.item.position.y = position.y;
    }

    replayPositions.push( [this.item.position.x, this.item.position.y] );

    if ( replayPositions.length >= this.maxReplayPositions ) {
        replayPositions.shift();
    }

    if ( 0 > (this.item.position.x - this.radius / 2) ) {
        if ( this.allowNewHit ) {
            hits.push( new Hit( this.item.position.x - this.radius, this.item.position.y ) );
            this.allowNewHit = false;
        }
    } else if ( (this.item.position.x + this.radius / 2) > size.width ) {
        if ( this.allowNewHit ) {
            hits.push( new Hit( this.item.position.x + this.radius, this.item.position.y ) );
            this.allowNewHit = false;
        }
    } else if ( 0 > (this.item.position.y - this.radius / 2) ) {
        if ( this.allowNewHit ) {
            hits.push( new Hit( this.item.position.x, this.item.position.y - this.radius ) );
            this.allowNewHit = false;
        }
    } else if ( (this.item.position.y + this.radius / 2) > size.height ) {
        if ( this.allowNewHit ) {
            hits.push( new Hit( this.item.position.x, this.item.position.y + this.radius ) );
            this.allowNewHit = false;
        }
    } else {
        this.allowNewHit = true;
    }

    var speed = this.item.pre - this.item.position;

    if ( speed.length > 50 && speed.length > this.preSpeed ) {
        if ( ! soundPlaying ) {
            explosionLongSound.play();
        }
    }


    if ( speed.length > 2 ) {

        this.removeStills();

        var newPosX = Math.floor( Math.random() * ((this.item.pre.x - this.item.position.x) + 1) + this.item.position.x );
        var newPosY = Math.floor( Math.random() * ((this.item.pre.y - this.item.position.y) + 1) + this.item.position.y );

        trailBalls.push( new TrailBall(
            newPosX + Math.floor( Math.random() * 20 ),
            newPosY + Math.floor( Math.random() * 20 ), speed.length ) );

    } else if ( speed.length == 0 ) {

        //if ( this.still ) {
        //
        //    this.stillCounter = this.stillCounter + 1;
        //
        //    if ( this.still.size.width >= 160 ) {
        //        this.still.size = 5;
        //    }
        //    this.still.size = this.still.size + 1;
        //
        //
        //    if ( this.still2 && this.still2.size.width >= 160 ) {
        //        this.still2.size = 5;
        //    }
        //    if ( this.still2 ) {
        //        this.still2.size = this.still2.size + 1;
        //    }
        //    if ( this.stillCounter == 60 ) {
        //
        //        this.still2 = new Shape.Ellipse( {
        //            center : [this.item.position.x, this.item.position.y],
        //            size : [50, 50],
        //            fillColor : 'rgba(0,0,0,0)',
        //            strokeColor : ownerColor,
        //            strokeWidth : 5
        //        } );
        //    }
        //
        //} else {
        //    this.stillCounter = 0;
        //    this.still = new Shape.Ellipse( {
        //        center : [this.item.position.x, this.item.position.y],
        //        size : [50, 50],
        //        fillColor : 'rgba(0,0,0,0)',
        //        strokeColor : ownerColor,
        //        strokeWidth : 5
        //    } );
        //}


    }

    this.preSpeed = speed.length;
    this.item.pre = this.item.position;

};

var Pitch = function () {

    fieldLayer.activate();

    this.fieldLines = new Group();

    this.centerLine = new Path( {
        strokeColor : "white",
        strokeWidth : 7,
        shadowColor : "white",
        shadowBlur : 15,
        shadowOffset : new Point( 0, 0 )
    } );

    this.centerLine.add( new Point( size.width / 2, 0 ) );
    this.centerLine.add( new Point( size.width / 2, 0 ) );
    this.fieldLines.addChild( this.centerLine );

    this.centerCircle = new Shape.Ellipse( {
        center : [size.width / 2, size.height / 2],
        size : [size.width / 4, size.width / 4],
        strokeColor : 'white',
        strokeWidth : 7,
        shadowColor : "white",
        shadowBlur : 15,
        shadowOffset : new Point( 0, 0 )
    } );
    this.centerCircle.scale( 0.1 );
    this.centreScale = 0.1;

    this.fieldLines.addChild( this.centerCircle );

    this.goalRight = new Path( {
        strokeColor : "white",
        strokeWidth : 7,
        shadowColor : "white",
        shadowBlur : 15,
        shadowOffset : new Point( 0, 0 )
    } );

    this.goalRight.add( new Point( size.width, size.height / 3 ) );
    this.goalRight.add( new Point( size.width, size.height / 3 ) );
    this.fieldLines.addChild( this.goalRight );


    this.goalLeft = new Path( {
        strokeColor : "white",
        strokeWidth : 7,
        shadowColor : "white",
        shadowBlur : 15,
        shadowOffset : new Point( 0, 0 )
    } );

    this.goalLeft.add( new Point( 0, size.height / 3 ) );
    this.goalLeft.add( new Point( 0, size.height / 3 ) );
    this.fieldLines.addChild( this.goalLeft );

    this.count = 0;
    this.step = 5;
    this.drawing = true;
};

Pitch.prototype.build = function () {

    //console.log( this.count
    this.count ++;

    if ( this.drawing ) {

        if ( this.count <= size.height / this.step + 2 ) {
            this.centerLine.segments[1].point += new Point( 0, this.step + 2 );
        }

        if ( this.centreScale < 2.3 ) {
            this.centreScale = this.centreScale + 0.1;

            this.centerCircle.scale( 1.1 );
        }

        if ( this.count > size.height / this.step ) {
            this.drawing = false;
        }

        if ( this.count <= 100 / this.step ) {
            this.goalRight.segments[1].point += new Point( - 1 * this.step, 0 );
            this.goalLeft.segments[1].point += new Point( this.step, 0 );
        }

        if ( this.count == 100 / this.step ) {
            this.goalRight.add( new Point( this.goalRight.segments[1].point ) );
            this.goalLeft.add( new Point( this.goalLeft.segments[1].point ) );
        }

        if ( this.goalRight.segments[2] && this.count <= (100 + (size.height / 3)) / this.step ) {
            this.goalRight.segments[2].point += new Point( 0, this.step );
            this.goalLeft.segments[2].point += new Point( 0, this.step );
        }

        if ( this.goalRight.segments[2] && this.count == Math.floor( (100 + (size.height / 3)) / this.step ) ) {
            this.goalRight.add( new Point( this.goalRight.segments[2].point ) );
            this.goalLeft.add( new Point( this.goalLeft.segments[2].point ) );
        }

        if ( this.goalRight.segments[3] && this.count < (200 + (size.height / 3)) / this.step ) {
            this.goalRight.segments[3].point += new Point( this.step, 0 );
            this.goalLeft.segments[3].point += new Point( - 1 * this.step, 0 );
        }

    }


};

Pitch.prototype.change = function ( color ) {
    this.fieldLines.strokeColor = color;
    this.fieldLines.shadowColor = color;

    game.scoreTextRight.strokeColor = color;
    game.scoreTextRight.strokeColor = color;
    game.scoreTextLeft.shadowColor = color;
    game.scoreTextLeft.shadowColor = color;
};

var Background = function () {

    this.backgroundPrefix = '#background-';
    this.currentplaybackrate = 1;
    backgroundLayer.activate();

    this.change( backgroundTheme );

};

Background.prototype.change = function ( index ) {

    if ( this.currentVideo ) {
        this.currentVideo.pause();
    }

    $( '.show' ).removeClass( 'show' );
    $( this.backgroundPrefix + index ).addClass( 'show' );

    this.currentVideo = $( "#video-" + index )[0];

    this.currentVideo.play();
    this.currentVideo.playbackRate = this.currentplaybackrate;

    if ( this.backdrop ) {
        this.backdrop.remove();
    }

};

function Goal ( team ) {

    this.goalColor = teamColors[team];
    pitch.change( this.goalColor );

    this.lifespan = 0;

    overlayLayer.activate();

    this.backdrop = new Shape.Rectangle( {
        center : [size.width / 2, size.height / 2],
        size : [size.width, size.height],
        fillColor : 'black'
    } );

    this.scoreText = new PointText( {
        point : [size.width / 2, (size.height / 2 + 50)],
        justification : 'center',
        fontSize : 200,
        fillColor : 'white'
    } );

    this.scoreText.content = "GOAL!!!";
    if ( team == 1 ) {
        this.scoreText.rotation = 180;
    }

    this.scoreText.style = {
        fontFamily : 'Exo', fontWeight : 'bold'
    };

    goalSound.play();
    background.change( Math.floor( Math.random() * 4 ) );
}

Goal.prototype.iterate = function () {

    this.lifespan ++;

    if ( this.lifespan % 10 == 0 ) {

        if ( this.backdrop.fillColor == this.goalColor ) {
            this.backdrop.fillColor = "white";
            this.scoreText.fillColor = this.goalColor;
        } else {
            this.backdrop.fillColor = this.goalColor;
            this.scoreText.fillColor = "white";
        }
    }

    if ( this.lifespan == 180 ) {
        this.scoreText.remove();
        this.backdrop.remove();


        if ( frenzyTeam ) {
            frenzy = new Frenzy( frenzyTeam );
        } else {
            replayBalls.push( new ReplayBall() );
        }

        goalEnd();
    }
};

var goalEnd = function () {
    goal = undefined;
};

function GameGraphics () {
    this.score = [0, 0];

    scoreLayer.activate();

    this.scoreTextLeft = new PointText( {
        point : [size.width / 4, size.height / 2 + 30],
        justification : 'center',
        fontSize : 120,
        fillColor : 'white',
        shadowColor : "white",
        shadowBlur : 15,
        shadowOffset : new Point( 0, 0 )
    } );

    this.scoreTextRight = new PointText( {
        point : [size.width / 4 + size.width / 2, size.height / 2 - 60],
        justification : 'center',
        fontSize : 120,
        fillColor : 'white',
        shadowColor : "white",
        shadowBlur : 15,
        shadowOffset : new Point( 0, 0 )
    } );

    this.scoreTextRight.rotate( 180 );

    this.scoreTextLeft.style = {
        fontFamily : 'Exo', fontWeight : 'bold'
    };
    this.scoreTextRight.style = {
        fontFamily : 'Exo', fontWeight : 'bold'
    };

    this.scoreTextLeft.content = this.score[0];
    this.scoreTextRight.content = this.score[1];

};

GameGraphics.prototype = {

    goalScored : function ( team ) {

        this.score[team] = this.score[team] + 1;
        this.scoreTextLeft.content = this.score[0];
        this.scoreTextRight.content = this.score[1];

        if ( ! goal ) {
            goal = new Goal( team );
        }

    }


};


// Dummy events
function onKeyUp ( event ) {

    if ( event.key == '1' ) {
        background.change( 0 );
    }
    if ( event.key == '2' ) {
        background.change( 1 );
    }
    if ( event.key == '3' ) {
        background.change( 2 );
    }
    if ( event.key == '4' ) {
        background.change( 3 );
    }

    if ( event.key == '5' ) {
        game.goalScored( 0 );
    }
    if ( event.key == '6' ) {
        game.goalScored( 1 );
    }

    if ( event.key == 'f' ) {
        frenzy = new Frenzy( 1 );
    }

    if ( event.key == 'd' ) {
        endFrenzy();
    }

    if ( event.key == 'p' ) {
        $( '.show video' )[0].pause();
    }

    if ( event.key == '0' ) {
        useMousePos = ! useMousePos;
    }

    if ( event.key == 'g' ) {
        background = new Background();
        pitch = new Pitch();
        ball = new Ball();
        game = new GameGraphics();
    }

}


function onFrame ( event ) {

    if ( game ) {
        for ( var i = 0; i < hits.length; i ++ ) {
            hits[i].iterate();
        }

        for ( var y = 0; y < trailBalls.length; y ++ ) {
            trailBalls[y].iterate();
        }

        if ( goal ) {
            goal.iterate();
        }

        pitch.build( event.count );

        if ( replayBalls.length ) {
            replayBalls[0].iterate();
        }

        if ( ball && currentPos && ! goal ) {
            ball.iterate( currentPos );
        }

        if ( frenzy ) {
            frenzy.iterate();
        }

    }
}


function onMouseMove ( event ) {
    if ( useMousePos )
        currentPos = event.point;
}

Number.prototype.map = function ( in_min, in_max, out_min, out_max ) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};


handleSocketEvents();

socket.emit( 'get-current-theme' );
socket.emit( 'reset-game' );

