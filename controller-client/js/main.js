/**
 * Created by markd on 27/11/15.
 */
var MAIN = (function () {


    // globals
    var
        socket = null,
        $ddThemes = null,
        theming = [],
        currentTheme = 0;


    // initialize
    function init(){
        console.log(socket);

        // dirty way of getting server path without changing it twice
        socket = io($('#script-socket').attr('src').split('/socket.io')[0]);

        //button listeners
        $('#btn-reset-game').on('click', resetGame);
        $('#btn-score-left').on('click', scoreLeft);
        $('#btn-score-right').on('click', scoreRight);
        $('#btn-subtract-score-left').on('click', subtractScoreLeft);
        $('#btn-subtract-score-right').on('click', subtractScoreRight);


        // init themes
        $ddThemes = $('#dd-change-theme');
        socket.emit('get-themes');
        $ddThemes.on('change', changeTheme);
    }

    init ();

    socket.on('get-themes', function (themes) {
        theming = themes;
        $.each(themes, function(i) {
           $ddThemes.append(
                $('<option></option>').text(this).val(i)
           );
        });

        // event listener created within this method cause of dependency
        socket.on('get-current-theme', function (theme) {
            console.log( 'theme:' + theme);
            $ddThemes.val(theme);
            currentTheme = theme;
            $('#btn-change-theme').html(theming[theme]);
        });

        $('#btn-change-theme').on('click', changeTheme);

        socket.emit('get-current-theme');

    });


    function scoreLeft(){
        socket.emit('score-left');
    }

    function scoreRight(){
        socket.emit('score-right');
    }

    function subtractScoreLeft(){
        socket.emit('subtract-score-left');
    }

    function subtractScoreRight(){
        socket.emit('subtract-score-right');
    }

    function resetGame(){
        socket.emit('reset-game');
    }


    function changeTheme(){
        currentTheme++;
        if (currentTheme == theming.length){
            currentTheme = 0;
        }
        $('#btn-change-theme').html(theming[currentTheme]);
        socket.emit('change-theme', currentTheme);
    }


    // public API
    return {

    }

}());