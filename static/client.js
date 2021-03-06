(function(){
    if(window["WebSocket"]){
        console.log("you are good to go");
        $(document).ready(function(){
            // initialize canvas
            var canvasBlocks = {X_MAXLENGTH: 80, Y_MAXLENGTH:60, width:9, height:9};
            var canvas = $('canvas#canvas')[0];
            var context = canvas.getContext('2d');
            var posX = 0, posY = 1;
            
            // draw one snake block
            var drawBlock = function(x, y){
                context.fillRect(x, y, 9, 9);
            }
            
            // draw the default gray playground 
            var clearMap = function(){
                var x, y;
                context.fillStyle = "#fff";
                context.fillRect(0, 0, 800, 600);
                context.fillStyle = "#efefef";
                for(x = 0; x < canvasBlocks.X_MAXLENGTH; x++){
                    for(y = 0; y < canvasBlocks.Y_MAXLENGTH; y++){
                        drawBlock(10*x, 10*y);
                    }
                }
            }
            clearMap();
            
            // update the wall
            var updateMap = function(walls){
                context.fillStyle = "#000";
                $(walls).each(function(index, elem){
                    drawBlock(10*block[posX], 10*block[poxY]);
                });
            };

            // draw one snake
            var drawOneSnake = function(snake){
                var snakeColor = {"#C00": "#ee0000", "#0C0": "#00ee00", "#00C":"#0000ee"};
                var nameStart = 5;
                $(snake.body).each(function(index, block){
                    if(index == 0){
                        context.fillStyle = snake.color;
                        //drawBlock(10*block[posX], 10*block[posY]);
                        
                        //context.fillRect(10*block[posX]-0.5, 10*block[posY]-0.5, 10, 10);
                        //context.fillStyle = "#fff";
                        //context.font         = '9px sans-serif';
                        context.font         = '9px silkscreen';
                        context.textBaseline = 'top';
                        //context.fillText  ('C', 10*block[posX], 10*block[posY]);                       
                        drawBlock(10*block[posX], 10*block[posY]);
                    }else{
                        if(index < nameStart || index >= (snake.nickname.length+nameStart)){
                            context.fillStyle = snakeColor[snake.color];
                            drawBlock(10*block[posX], 10*block[posY]);
                        } else {
                            context.fillStyle = snakeColor[snake.color];
                            var tempName = snake.nickname;
                            if(snake.direction == 'down' || snake.direction == 'right'){
                                context.fillText  (tempName[snake.nickname.length-(index-nameStart)-1], 10*block[posX], 10*block[posY]);                       
                            } else {
                                context.fillText  (tempName[index-nameStart], 10*block[posX], 10*block[posY]);                       
                            }
                        }
                    }
                });
            }
            // draw/update snakes
            var drawSnakes = function(snakes){
                var mySnake;
                _.each(snakes, function(snake){
                if(snake.id == SNAKE_ID){
                    mySnake = snake;
                }
                if(snake.state === "baby"){
                    //console.log("snake: " + snake.nickname + " was borned!");
                }else if(snake.state === "alive"){
                }else if(snake.state === "deathBySnake"){
                    console.log("snake: " + snake.nickname + "died of hitting another snake");
                }else if(snake.state ===" deathByBoundary"){
                    console.log("snake: " + snake.nickname + " died of hitting the wall.");
                }
                    drawOneSnake(snake);
                });
                return mySnake;
            }
        
            var drawOneCherry = function(cherry){
                context.fillStyle = '#AB0000';
                drawBlock(10*cherry.coord[0], 10*cherry.coord[1]);
                context.fillStyle = '#0A0';
                context.fillRect(10*cherry.coord[posX] + 4, 10*cherry.coord[posY] - 3, 2, 3);
            };

            var drawCherries = function(cherries){
                _.each(cherries, function(cherry){
                    drawOneCherry(cherry);
                    //drawOneBomb(cherry);
                    // don't use star yet, still figuring out how to draw it correctly
                    //drawOneStar(cherry);
                });
            };

            var drawOneBomb = function(cherry){
                var x = 10*cherry.coord[0], y = 10*cherry.coord[1];
                context.strokeStyle = "black";
                context.beginPath();
                context.arc(x+4, y+5, 4, 0, Math.PI*2, false);
                context.closePath();
                context.stroke();
                context.fillStyle = "#000";
                context.fill();
                context.moveTo(x+7, y-2);
                context.lineTo(x+6, y+2);
                context.stroke();
            };

            var drawOneStar = function(cherry){
                var star = cherry;
                context.fillStyle = "yellow";
                context.translate(10*star.coord[0], 10*star.coord[1]);
                context.save();
                context.beginPath();
                r = 10;
                context.moveTo(r, 0);
                for(var i = 0; i < 9 ; i++){
                    context.rotate(Math.PI/5);
                    if(i % 2 == 0){
                        context.lineTo((r/0.525731)*0.200811, 0);
                    } else {
                        context.lineTo(r, 0);
                    }
                }
                context.closePath();
                context.fill();
                context.restore();
            }
    
            var events = $("#panel .events");
            var score = $("#score");
            var drawMySnake = function(snake){
                //draw action panel
                if(snake && snake.action){
                    if(soundManager && soundManager.snakePlay){
                        soundManager.snakePlay(snake.action.type);
                        var type = snake.action.type;
                        events.html("");
                        if(type == "cherry"){
                            $('<img />').attr("src", "/cherry_v2.png").appendTo(events);
                        }else if(type == "deathByBoundary"){
                            $('<img />').attr("src", "/wall_v2.png").appendTo(events);
                        }else if(type == "deathBySnake"){
                            $('<img />').attr("src", "/snake_v2.png").appendTo(events);
                        }
                        $('<div />').attr("class", "msgtext").html(snake.action.message).appendTo(events);
                    }
                    if(snake.score){
                        var displayScore = ''+snake.score;
                        if(displayScore.length == 1){
                            displayScore = '000' + displayScore;
                        } else if(displayScore.length == 2){
                            displayScore = '00' + displayScore;
                        } else if(displayScore.length == 3){
                            displayScore = '0' + displayScore;
                        }
                        score.html(displayScore);    
                    }
                }
            };

            // connect
            socket = io.connect("/");
            socket.on('game state', function(data){
                //console.log(data.snakes);
                clearMap();
                var mySnake = drawSnakes(data.snakes);
                drawCherries(data.cherries);
                drawMySnake(mySnake);
            });
            socket.on('connected', function(snake){
                SNAKE_ID = snake.id;
                $('.profile .nickname')
                    .attr('value', snake.nickname)
                    .blur(function(){
                        var newName = $(this).attr('value');
                        if(newName !== ""){
                            socket.emit('set nickname', {nickname:newName});
                        }
                    });
                $('.profile .color').css("background-color", snake.color);
                socket.on('set nickname', function(newName){
                   console.log("i've got a new name!" + newName);
                   $('.profile .nickname').attr('value', newName); 
                });

                /*
                var globalStats = {
                    snakesSpawned : 0,
                    cherriesEaten : 0,
                    playersConnected : 0,
                    longestSnakeLength : 0,
                    longestSnakeName : ''
                };
                */
                socket.on('globalStats', function(globalStats){
                    var globalStat = $('#globalStats').html("");
                    $("<span class='stat'/>").html("total_snakes_born: " + globalStats.snakesSpawned).appendTo(globalStat);
                    $("<span class='stat'/>").html("total_cherries_Eaten: " + globalStats.cherriesEaten).appendTo(globalStat);
                    $("<span class='stat'/>").html("total_players_ever: " + globalStats.playersConnected).appendTo(globalStat);
                    $("<br/>").appendTo(globalStat);
                    $("<span class='stat'/>").html("longest_snake: " + globalStats.longestSnakeName + " [ length = " + globalStats.longestSnakeLength + " ] ").appendTo(globalStat);
                });

                $('.outgoing .chatBox').keyup(function(event){
                    if(event.keyCode == 13){
                        var msg = $(this).attr('value');
                        if(msg !== ""){
                            socket.emit('message', {message: $(this).attr('value')});
                            $(this).attr('value', '');
                        }
                    }
                }).focus(function(event){
                    if($(this).attr('value') == "Type here to chat with other snakes!"){
                        $(this).attr('value', '');
                    }
                });

                // welcome message
                var messageArea = $('.messages .incoming');
                var con = $('<div class="msgs"></div>');
                $('<span class="from"></span>').appendTo(con);
                $('<span class="msg"></span>').append("Welcome! Use arrow keys (&larr;&rarr;&uarr;&darr;) to control your snake.").appendTo(con);
                messageArea.append(con);
                socket.on('message', function(msg){
                    var con = $('<div class="msgs"></div>');
                    $('<span class="from"></span>').append(msg.from).append(": ").appendTo(con);
                    $('<span class="msg"></span>').append(msg.message).appendTo(con);
                    messageArea.append(con);
                    $('.incoming').each( function() 
                    {
                       var scrollHeight = Math.max(this.scrollHeight, this.clientHeight);
                       this.scrollTop = scrollHeight - this.clientHeight;
                    });
                });

            });
            // key events
            $(document).keydown(function(event){
                var keycode = event.keyCode?event.keyCode: event.which;
                switch(keycode){
                    case 37: 
                        event.preventDefault();
                        socket.emit('set direction', {direction:'left'});
                        break;
                    case 38: 
                        event.preventDefault();
                        socket.emit('set direction', {direction:'up'});
                        break;
                    case 39: 
                        event.preventDefault();
                        socket.emit('set direction', {direction:'right'});
                        break;
                    case 40: 
                        event.preventDefault();
                        socket.emit('set direction', {direction:'down'});
                        break;
                }
            });
        });
    }else{
        console.log("browser doesn't support websocket");
    }
})()
