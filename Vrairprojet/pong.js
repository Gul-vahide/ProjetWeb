//On va sélectionner l'élément du canvas (doc html correspondant)
const canvas = document.getElementById("pong");

// getContext c'est pour les méthodes et les propriétés (dessin etc)
const ctx = canvas.getContext('2d');

////////////////////// Téléchargement des sons //////////////////////
let hit = new Audio();
let wall = new Audio();
let userScore = new Audio();
let comScore = new Audio();

hit.src = "sounds/hit.mp3";
wall.src = "sounds/wall.mp3";
comScore.src = "sounds/comScore.mp3";
userScore.src = "sounds/userScore.mp3";


////////////////////////// Dessin du canvas ///////////////////////

// BALLE
const ball = {
    x : canvas.width/2,
    y : canvas.height/2, // on divise par deux pour qu'elle soit au centre
    radius : 10, // comme c'est une balle on veut un rayon de 10px
    velocityX : 5, //cela permet de définir d'où va se lancer la balle pour la première fois
    velocityY : 5, // il y a donc des coordonnées qui vont définir la trajectoire
    speed : 7, //on définit la vitesse de la balle
    color : "WHITE"
}

// JOYSTICK JOUEUR (NOUS)
const user = {
    x : 0, // celui de gauche
    y : (canvas.height - 100)/2, // On veut une longueur de 100px et on veut le positionner au centre du canvas donc on divise par 2
    width : 10,
    height : 100,
    score : 0,
    color : "WHITE"
}

// JOYSTICK ADVERSAIRE
const com = {
    x : canvas.width - 10, // on veut un rectangle d'une largeur de 10px donc on commence à dessiner 10px avant la fin du canvas
    y : (canvas.height - 100)/2, // On veut une longueur de 100px et on veut le positionner au centre du canvas donc on divise par 2
    width : 10,
    height : 100,
    score : 0,
    color : "WHITE"
}

// SEPARATION AU CENTRE DU JEU
const net = {
    x : (canvas.width - 2)/2, //Meme logique que pour le joystick de l'adversaire puis on divise par deux car on veut etre au centre du canvas
    y : 0,
    height : 10,
    width : 2,
    color : "WHITE"
}

// fonction qui dessine des rectangles : fond et joysticks
function drawRect(x, y, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// fonction qui dessine un rond : balle
function drawArc(x, y, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fill();
}

///////// POUR SUIVRE LA SOURIS DE L'UTILISATEUR ////////////////////
canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt){
    let rect = canvas.getBoundingClientRect();
    
    user.y = evt.clientY - rect.top - user.height/2;
}

// POUR REINITIALISER LE JEU ET REMETTRE LA BALLE AU CENTRE APRES UN POINT
function resetBall(){
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

// fonction qui dessine la séparation au centre du jeu
function drawNet(){
    for(let i = 0; i <= canvas.height; i+=15){
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// fonction qui dessine le score avec en paramètre le score et les coordonnées de celui-ci
function drawText(text,x,y){
    ctx.fillStyle = "#FFF";
    ctx.font = "75px fantasy";
    ctx.fillText(text, x, y);
}

///////////////////// DETECTEUR DE COLLISION///////////////////////////
//Cette fonction permet de savoir si un des joueurs a touche la balle ou non
//b représente la balle et p représente le joueur
function collision(b,p){
    p.top = p.y;            //on définit les différentes zones possible de contact du joystick
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;
    
    b.top = b.y - b.radius;    // les différentes zones de contact de la balle
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;
    
    //ici on définit les différentes zones de contact entre la balle et le joystick
    //Dans l'ordre : quand la balle arrive par la gauche, par le bas, par la gauche, et enfin par le haut
    //Si un des cas est vrai, il y a une collision entre la balle est le joystick
    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

///////////////////////////////////UPDATE//////////////////////////////////
//ici on va faire tous les mouvements des éléments pour animer le jeu
function update(){
    
    // on ajoute un point à l'adversaire si la balle est totalement à gauche (dans nos cages) (ball.x<0) 
        if( ball.x - ball.radius < 0 ){
        com.score++;
        comScore.play();
        resetBall();
        //Sinon si la balle part totalement à droite (ball.x > canvas.width) on ajoute un point à l'utilisateur
    }else if( ball.x + ball.radius > canvas.width){
        user.score++;
        userScore.play();
        resetBall();
    }
    
    //////////LA BALLE ///////////
    //Pour définir la vélocité de la balle (la position x prend la valeur de notre variable velocityX définie dans le dessin de la balle)
    ball.x += ball.velocityX;
    ball.y += ball.velocityY; //pareil pour y
    
    // computer plays for itself, and we must be able to beat it
    // simple AI
    com.y += ((ball.y - (com.y + com.height/2)))*0.1;
    
    //Quand la balle touche le bas ou le haut du terrain, on inverse la vitesse de y pour que la balle parte de l'autre sens
    if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height){
        ball.velocityY = -ball.velocityY;
        wall.play();
    }
    
    //on vérifie si la balle a frappé l'utilisateur ou l'adversaire
    let player = (ball.x + ball.radius < canvas.width/2) ? user : com;
    
    // Si la balle touche le joystick d'un joueur
    if(collision(ball,player)){
        //on ajoute la musique
        hit.play();
        // On regarde où la balle touche le joystick
        let collidePoint = (ball.y - (player.y + player.height/2));
        // normalement on obtient un chiffre entre -1 et 1 pour le point de collision
        // car -player.height/2 < collide Point < player.height/2
        collidePoint = collidePoint / (player.height/2);
        
        // Quand la balle touche le dessus du joystick, on veut que la balle prenne un angle de -45°
        // Quand la balle touche le centre du joystick, on veut que la balle prenne un angle de 0°
        // Quand la balle touche le dessous du joystick, on veut que la balle prenne un angle de 45°
        // Donc comme on a -1, 0, ou 1 (dans l'ordre pour des chiffres ronds)
        // on passe donc par le pi avec pi/4 = 45° et on obtient tous les angles possibles
        let angleRad = (Math.PI/4) * collidePoint;
        
        // on change la direction de la balle avec velocit X ou Y
        let direction = (ball.x + ball.radius < canvas.width/2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        
        // on donne plus de vitesse à chaque fois que la balle est touchée pour plus de difficulté
        ball.speed += 0.1;
    }
}

// cette fonction permet de dessiner chaque partie du jeu
function render(){
    
    //on rafraichit le canvas
    drawRect(0, 0, canvas.width, canvas.height, "#000");
    
    // on écrit le nouveau score du joueur à gauche après le point
    drawText(user.score,canvas.width/4,canvas.height/5);
    
    // on écrit le nouveau score de l'adversaire à droite après le point
    drawText(com.score,3*canvas.width/4,canvas.height/5);
    
    // on dessine la frontière
    drawNet();
    
    // on dessine les joysticks des joueurs
    //joueur :
    drawRect(user.x, user.y, user.width, user.height, user.color);
    //adversaire :
    drawRect(com.x, com.y, com.width, com.height, com.color);
    
    //on dessine la balle
    drawArc(ball.x, ball.y, ball.radius, ball.color);
}
//c'est cette fonction qui sera rappellée à chaque fois, elle représente le jeu
function game(){
    update();
    render();
}
// nombre de mise à jour par seconde (fois par seconde)
let framePerSecond = 50;

//cela permet de rappeler la fonction game 50 par seconde (on refresh le jeu 50 fois par seconde pour un jeu fluide)
let loop = setInterval(game,1000/framePerSecond); //la fonction setIntervalle se note en millisecondes donc 1000 ms = 1s

