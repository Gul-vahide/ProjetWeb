////////////////////////////////// SELECTION CVS ////////////////////////
const cvs = document.getElementById("bird"); //on sélectionne le canvas
const ctx = cvs.getContext("2d");
//on prend le contexte pour retourner les méthodes et les propriétés

//VARIABLES ET CONSTANTES DU JEU

let frames = 0; //pour compter le nombre de cadre dessiné sur le canvas
const DEGREE = Math.PI/180; 

//TELECHARGEMENT IMAGE SPRITE
const sprite = new Image(); // on crée une image en objet en utilisant le constructeur Image()
sprite.src = "img1/sprite.png"; //on va chercher l'image dans nos fichiers
//pour récuperer la bonne image et la dessiner dans le canvas


//////////////////////////////////// AUDIO /////////////////////////////////
const SCORE_S = new Audio();
SCORE_S.src = "audio1/sfx_point.wav";

const FLAP = new Audio();
FLAP.src = "audio1/sfx_flap.wav";

const HIT = new Audio();
HIT.src = "audio1/sfx_hit.wav";

const SWOOSHING = new Audio();
SWOOSHING.src = "audio1/sfx_swooshing.wav";

const DIE = new Audio();
DIE.src = "audio1/sfx_die.wav";

/////////////////////// Etats du Jeu/////////////////////////
//On a trois etats du jeu : le début, pendant le jeu et quand on est mort
const state = 
{
    current : 0, // l'état current va enregistrer l'état dans lequel nous sommes actuellement dans le jeu
    getReady : 0,
    game : 1,
    over : 2
}

// BOUTON START
//pour passer de l'état 2 (mort) à l'état 0 (début)
const startBtn = 
{
    x : 120,
    y : 263,
    w : 83,
    h : 29
}

//////////////////////////// POUR CONTROLER LE JEU /////////////////////////////////
//Cette fonction va pouvoir détecter les clics de l'utilisateur
cvs.addEventListener("click", function(evt)
{
    switch(state.current)            //à chaque fois que l'utilisateur va cliquer, on va regarder dans quel état du jeu nous sommes
    {
        case state.getReady:               //Dans le cas où on est au début du jeu, on commerce à jouer donc l'état devient l'état game.
            state.current = state.game;
            SWOOSHING.play();
            break;                    //Je sais que vous n'aimez pas les break monsieur mais les autres moyens ne fonctionnaient pas
        case state.game:
            if(bird.y - bird.radius <= 0) return;        //Dans le cas où on est dans le jeu, lorsque l'on clique on fait bouger les ailes de l'oiseau, on utilise donc la fonction flap
            bird.flap();
            FLAP.play();
            break;
        case state.over:                                // /Dans le cas où on est mort, lorsque l'on clique on doit retourner dans l'étaut du départ (getReady)
            let rect = cvs.getBoundingClientRect();
            let clickX = evt.clientX - rect.left;
            let clickY = evt.clientY - rect.top;
            

            //On vérifie si on clique sur le bouton start avec toutes les coordonnées du click
            if(clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h)
            {
                pipes.reset();
                bird.speedReset();
                score.reset();
                state.current = state.getReady;
            }
            break;
    }
});


/////////////////////////////////////// DESSIN DANS LE CANVAS ///////////////////////////////////


// L'ARRIERE PLAN (ciel et ville)
const bg = 
{
    sX : 0,
    sY : 0,
    w : 275,
    h : 226,
    x : 0,
    y : cvs.height - 226,
    
    draw : function()
    {
        //on a plusieurs paramètres : la position dans le dossier Source (sX et sY), la taille dans le dossier source (w, h), la position dans le Canvas (w, h) (on choisit d'avoir les mêmes tailles car les images sont adaptées à la taille du canvas)
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        //on est obligé de le dessiner deux fois car il est trop petit, c'est pour ça qu'on rajoute une nouvelle fois l'image (ici on a x + w car la nouvelle position de x est w (la largeur de l'ancienne image) et on ajoute une nouvelle fois l'image) 
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
    
}

// PREMIER PLAN (sol)
const fg = 
{
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: cvs.height - 112,
    
    dx : 2,
    
    draw : function()
    {
        //de la même façon, il faut dessiner deux fois l'image pour qu'elle fasse tout l'écran
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },
    
    update: function()
    {
        if(state.current == state.game)
        {
            this.x = (this.x - this.dx)%(this.w/2);
        }
    }
}

// OISEAU
const bird = 
{
    //parce que l'oiseau est une suite de plusieurs images (bat des ailes) donc c'est une animation
    animation : 
    [
    //car il y a plusieurs images de l'oiseau dans l'image source donc on crée comme un tableau d'image pour crée l'animation
        {sX: 276, sY : 112}, //ailes hautes qui | représente dans draw : this.animation[0]
        {sX: 276, sY : 139}, //ailes au milieu | qui représente dans draw : this.animation[1]
        {sX: 276, sY : 164}, //ailes basses | qui représente dans draw : this.animation[2]
        {sX: 276, sY : 139}, //ailes au milieu | qui représente dans draw : this.animation[3]
        //ca forme l'animation des battements d'ailes
    ],
    x : 50,
    y : 150,
    w : 34,
    h : 26,
    
    radius : 12,
    
    frame : 0,  //pour compter battement d'aile et faire voler oiseau en incrémentant
    
    gravity : 0.25,  //la gravité, le saut et la vitesse seront modifiés par la suite selon les évènements
    jump : 4.6,
    speed : 0,    //au départ la vitesse en nulle (elle sera incrémentée ensuite)
    rotation : 0,
    
    draw : function()
    {
        //on créée une variable qui va donner l'image voulue parmi les 3 images grâce à frame
        let bird = this.animation[this.frame];
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        //this.y-this.h/2, this.x - this.w/2 : c'est pour que l'oiseau soit au milieu
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h,- this.w/2, - this.h/2, this.w, this.h);
        
        ctx.restore();
    },
    
    flap : function()   // on va faire voler l'oiseau
    {
        this.speed = - this.jump;    //si la vitesse est positive, l'oiseau tombe et si la vitesse est négative, l'oiseau va vers le haut
        // donc si on fait voler l'oiseau, on va forcément vers le haut alors on rend la vitesse négative.
    },
    
    update: function()
    {
        // Si on est au début du jeu (getReady), alors l'oiseau vole doucement (on a aussi période = 10)
        this.period = state.current == state.getReady ? 10 : 5;
        //On met un modulo 5 à frame mais on a aussi un modulo sur this.frame qui permet de faire bouger l'aile de l'oiseau tous les 5 frame
        // Si frame%5==0, on incrémente this.frame par 1 | si c'est faux, on ne l'incrémente pas
        this.frame += frames%this.period == 0 ? 1 : 0;
        
        this.frame = this.frame%this.animation.length; //ici on a le modulo de this.frame à %5 pour retourner aux ailes en bas
        
        if(state.current == state.getReady)   //Si on est au début du jeu, on place l'oiseau au milieu en train de voler
        {
            this.y = 150; //on replace l'oiseau à sa place de départ après le game over
            this.rotation = 0 * DEGREE;
        }else{                             //SINON (pendant le jeu où période = 5), l'oiseau va voler plus vite
            this.speed += this.gravity;     // on augmente la vitesse selon la gravité de l'oiseau
            // a chaque frame, la vistesse est augmentée de 0.25 -> plus l'oiseau est haut, plus il ira vite
            this.y += this.speed;           // on change la position de l'oiseau lorsque l'on joue : si la vitesse est positive, l'oiseau tombe et si la vitesse est négative, l'oiseau va vers le haut
            


            //On vérifie s'il y a collision entre l'oiseau et le sol
            // avec this.y + this.h/2 position de l'oiseau et cvs.height - fg.h position du sol
            if(this.y + this.h/2 >= cvs.height - fg.h)
            {
                this.y = cvs.height - fg.h - this.h/2; // s'il est tombe, l'oiseau ne bouge plus
                if(state.current == state.game){  //Si on est encore dans le jeu
                    state.current = state.over;    //alors on passe à l'état de game over
                    DIE.play();
                }
            }
            
            //Si la vitesse est plus grande que le saut, l'oiseau est tombé
            if(this.speed >= this.jump)
            {
                this.rotation = 90 * DEGREE;
                this.frame = 1;
            }else{
                this.rotation = -25 * DEGREE;
            }
        }
        
    },
    speedReset : function()
    {
        this.speed = 0;
    }
}

// MESSAGE GET READY (début)
const getReady = 
{
    sX : 0,
    sY : 228,
    w : 173,
    h : 152,
    //centre du canvas - la moitié de la hauteur
    x : cvs.width/2 - 173/2,
    y : 80,
    
    draw: function()
    {
        if(state.current == state.getReady)       //si on est dans l'état du départ (getReady), alors on affiche le message get ready dans le canvas
        {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
    
}


// MESSAGE GAME OVER (fin)
const gameOver = 
{
    sX : 175,
    sY : 228,
    w : 225,
    h : 202,
    x : cvs.width/2 - 225/2,
    y : 90,
    
    draw: function(){
        if(state.current == state.over) //si on est mort (état game over), alors on affiche le message game over dans le canvas
        {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);   
        }
    }  
}

// TUYEAUX
const pipes = 
{
    position : [],
    
    top : 
    {
        sX : 553,
        sY : 0
    },
    bottom:
    {
        sX : 502,
        sY : 0
    },
    
    w : 53,
    h : 400,
    gap : 85,
    maxYPos : -150,
    dx : 2,
    
    draw : function()
    {
        for(let i  = 0; i < this.position.length; i++)
        {
            let p = this.position[i];
            
            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;
            
            //  haut du tuyeau
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);  
            
            // bas du tuyeau
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);  
        }
    },
    
    update: function()
    {
        if(state.current !== state.game) return;
        
        if(frames%100 == 0)
        {
            this.position.push({
                x : cvs.width,
                y : this.maxYPos * ( Math.random() + 1)
            });
        }
        for(let i = 0; i < this.position.length; i++)
        {
            let p = this.position[i];
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // DETECTION DE COLLISION
            // HAUT DU TUYEAU
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h)
            {
                state.current = state.over;
                HIT.play();
            }
            // BAS DU TUYEAU
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h)
            {
                state.current = state.over;
                HIT.play();
            }
            
            // MPOUR BOUGER LE TUYEAU VERS LA GAUCHE
            p.x -= this.dx;
            
            // si les tuyaux dépassent le canvas, nous les supprimons du tableau
            if(p.x + this.w <= 0)
            {
                this.position.shift();
                score.value += 1;
                SCORE_S.play();
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },
    
    reset : function()
    {
        this.position = [];
    }
    
}

// SCORE
const score= 
{
    best : parseInt(localStorage.getItem("best")) || 0,
    value : 0,
    
    draw : function(){
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        if(state.current == state.game)
        {
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, cvs.width/2, 50);
            ctx.strokeText(this.value, cvs.width/2, 50);
            
        }else if(state.current == state.over){
            // VALEUR DU SCORE
            ctx.font = "25px Teko";
            ctx.fillText(this.value, 225, 186);
            ctx.strokeText(this.value, 225, 186);
            // MEILLEUR SCORE
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },
    
    reset : function()
    {
        this.value = 0;
    }
}



////////////////////////////////////////////////// POUR FAIRE TOURNER LE JEU ///////////////////////////////////////////////////////
// DRAW
//on veut effacer le canvas avant de dessiner à nouveau dessus pour éviter d'avoir plusieurs oiseaux
//Donc on crée un carré bleu de la couleur du ciel
function draw()
{
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height); //pour on utilise une fonction filtre qui prend la même taille que la taille de notre canvas
    //cela forme le fond bleu du jeu

    //On appelle la fonction draw pour dessiner tous nos éléments
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    getReady.draw();
    gameOver.draw();
    score.draw();
}

// UPDATE
//Pour mettre à jour le jeu toutes les secondes
function update()
{
    bird.update();   //On remet à jour l'oiseau le premier plan et les tuyeayx qui sont les éléments en mouvement du jeu
    fg.update();
    pipes.update();
}

// BOUCLE QUI LANCE TOUT LE JEU
function loop()
{
    update();
    draw();
    frames++; //on l'incrémente à chaque fois qu'on appelle la fonction loop car on ajoute un nouveau cadre
    
    requestAnimationFrame(loop); //on rappelle la fonction loop pour n'appeler loop qu'une seule fois
}   //on rafraichit la page 50 fois par seconde

loop();



////TEMOIN DESSIN
/*const name = {
    sX : 276,
    sY : 112,
    w : 34,
    h : 26,
    x : 0,
    y : 0,

    draw : function(){
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y);
    }

}
*/