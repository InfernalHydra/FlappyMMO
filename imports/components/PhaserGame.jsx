import React, {Component} from 'react';
import Phaser from 'phaser';
import {Scores} from '../api/Scores.js';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';

class PhaserGame extends Component
{
  constructor(props)
  {
    super(props);
  }

  createGame(width, height)
  {
    var config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      scene: [new StartMenu(width, height), new Game(width, height), new Leaderboard(width, height), new End(width, height, 0)],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: {y: 500}
        }
      },
      backgroundColor: '#71c5cf'
    };
    var game = new Phaser.Game(config);

    var name = prompt("Please enter your name", "Your Name");
    console.log(name);
    Session.set('playerName', name);
  }
  componentDidMount()
  {
    this.createGame(this.props.width, this.props.height);
    Session.set('soundEffectToggle', false);
  }

  render()
  {
    Session.set("isReady", this.props.isReady);
    Session.set('scores', this.props.scores);
    Session.set("local", this.props.local);
    Session.set('global', this.props.global);
    return <div id="game"></div>;
  }
}

export default withTracker(() => {
  const subscription = Meteor.subscribe('scores');
  var ID = Meteor.userId();
  return {
    isReady: subscription.ready(),
    scores: subscription.ready() && Scores.find({}, {sort: {scores : 1}}).fetch(),
    local: subscription.ready() && Scores.find({userID: ID}).fetch()[0],
    global: subscription.ready() && Scores.find().fetch()[0]
  };
})(PhaserGame);

class Game extends Phaser.Scene
{
  constructor(width, height)
  {
    super({key : 'game'});
    var player;
    var pipes;
    var score, scoreLabel, deathLabel;

    var width, height;
    this.width = width;
    this.height = height;
  }
  preload()
  {
    //this.load.image('bird', '/bird.png');
    this.load.spritesheet('bird', '/bird.png', {frameWidth: 54, frameHeight: 42, endFrame : 2});
    this.load.image('pipe', '/pipebody.png');
    this.load.image('pipeHead', '/pipehead.png');
    this.load.audio('jump', '/jump.wav');

  }
  create()
  {

    this.score = -1;
    this.scoreLabel = this.add.text(20, 20, "0", {fontSize: '32px', fill: '#000'});

    this.player = this.physics.add.sprite(this.width/4, this.height/2, 'bird');
    
    var birdAnimation = this.anims.generateFrameNumbers('bird', {start: 0, end: 2});
    this.anims.create({
      key: 'fly',
      frames: birdAnimation,
      frameRate: 10,
      repeat: -1  
    });
    //console.log(this.anims.get);
    this.player.anims.play('fly');

    this.pipes = this.add.group();
    this.physics.add.overlap(this.player, this.pipes, this.onDeath, null, this);
    this.timedEvent = this.time.addEvent({
      delay: 1500,
      callback: this.addPipe,
      callbackScope: this,
      loop: true
    });


    //this.add.image(100, 150, 'pipe');
  }
  update()
  {
    var spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    if(this.input.keyboard.checkDown(spaceBar, 10000))
    {
      this.jump();
    }
    this.input.on('pointerdown', ()=> {
      this.jump();
    }, this);

    if(this.player.angle < 20)
    {
      this.player.angle += 1;
    }
    if(this.player.y < 0 || this.player.y > this.height)
    {
      this.onDeath();
    }
    if(this.player.alive === false && this.player.y > this.height)
    {
      this.scene.start('end', {score : this.score});
    }
  }
  jump()
  {
    if(this.player.alive === false) {return;}
    //console.log("space bar down");
    this.player.setVelocityY(-250);
    //this.add.tween(this.player).to({angle: -20}, 100).start();
    this.tweens.add({
      targets: this.player,
      duration: 100,
      angle: -20
    });
    if(Session.get('soundEffectToggle'))
    this.sound.play('jump');
  }
  onDeath()
  {
    if(this.player.alive == false) {return;}
    var correctScore = this.score < 0 ? 0 : this.score;
    console.log("ID: " + Meteor.userId() + " SCORE: " + correctScore);
    Meteor.call('scores.updateOrInsert', Meteor.userId(), correctScore, Session.get('playerName'));
    this.player.alive = false;
    this.time.removeAllEvents();
    this.pipes.getChildren().forEach((block) =>{
      block.setVelocityX(0);
    });
    this.anims.get('fly').pause();
    this.anims.remove('fly');
    //console.log(this.anims.get('fly'));
  }
  addPipeBlock(x, y, type)
  {
    var correctImage = 'pipe';
    if(type === 'body')
    {
      correctImage = 'pipe';
    }
    else if(type === 'head' || type === 'headInverted')
    {
      correctImage = 'pipeHead';
    }

    var pipe = this.physics.add.image(x, y, correctImage);
    
    if(type === 'headInverted')
    {
      console.log('asdf');
      pipe.setRotation(Math.PI);
    }
    //pipe.setActive();
    pipe.setVelocityX(-200);
    //console.log(pipe);
    pipe.checkWorldBounds = true;
    pipe.outOfBoundsKill = true;
    pipe.body.allowGravity = false;
    this.pipes.add(pipe);

  }
  addPipe()
  {
    let hole = Math.floor(Math.random() *  5) + 1;
    for(let i = 0; i < this.height/40; i++)
    {
      if(i != hole && i != (hole+1) && i !=(hole+2))
      {
        this.addPipeBlock(this.width, i * 50, 'body');
      }
      if(i == (hole - 1))
      {
        this.addPipeBlock(this.width, i * 50, 'head');
      }
      if(i == (hole + 3))
      {
        this.addPipeBlock(this.width, i * 50, 'headInverted');
      }
    }
    this.score += 1;
    this.scoreLabel.setText('' + this.score);
  }
}
class StartMenu extends Phaser.Scene
{
  constructor(width, height)
  {
    super({key : 'startMenu'});
    var title, playButton, soundEffectToggle, scoreBoardLabel,input;

    var width, height;
    this.width = width;
    this.height = height;

  }
  preload()
  {
  }
  create()
  {

    this.title = this.add.text(this.width/2, this.height/8, "Flappy Bird Thingy", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);

    this.playButton = this.add.text(this.width/2, this.height/4, "Start", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    this.playButton.setInteractive();
    this.playButton.on('pointerover', () => {this.playButton.setStyle({fontSize: '32px', fill: '#F00'})});
    this.playButton.on('pointerout', () => {this.playButton.setStyle({fontSize: '32px', fill: '#000'})});
    this.playButton.on('pointerup', () => {this.scene.start('game')});


    this.soundEffectToggle = this.add.text(this.width/2, this.height * (3/8), "", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    var text = Session.get('soundEffectToggle') ? "Sound Effects: On" : "Sound Effects: Off";
    this.soundEffectToggle.setText(text);

    this.soundEffectToggle.setInteractive();
    this.soundEffectToggle.on('pointerover', () => {this.soundEffectToggle.setStyle({fontSize: '32px', fill: '#F00'})});
    this.soundEffectToggle.on('pointerout', () => {this.soundEffectToggle.setStyle({fontSize: '32px', fill: '#000'})});
    this.soundEffectToggle.on('pointerup', () => {
      Session.set('soundEffectToggle', !Session.get('soundEffectToggle'))
      this.soundEffectToggle.setText(Session.get('soundEffectToggle') ? "Sound Effects: On" : "Sound Effects: Off");
      //console.log(Session.get('soundEffectToggle'));
    });

    this.scoreBoardLabel = this.add.text(this.width/2, this.height/2, "Leaderboard", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    this.scoreBoardLabel.setInteractive();  
    this.scoreBoardLabel.on('pointerover', () => {this.scoreBoardLabel.setStyle({fontSize: '32px', fill: '#F00'})});
    this.scoreBoardLabel.on('pointerout', () => {this.scoreBoardLabel.setStyle({fontSize: '32px', fill: '#000'})});
    this.scoreBoardLabel.on('pointerup', () => {
      this.scene.start('leaderboard');
    });
  }
  update()
  {

  }
}
class Leaderboard extends Phaser.Scene
{
  constructor(width, height)
  {
    super({key: 'leaderboard'});
    var width, height;
    this.width = width;
    this.height = height;

    var title, back, local, sortedScores;
  }
  preload()
  {

  }
  create()
  {
    this.sortedScores = Session.get('scores');
    console.log(this.sortedScores);
    this.sortedScores.sort((a, b) => {
      if(a.score > b.score)
        return -1;
      if(a.score < b.score)
        return 1;
      return 0;
    });
    this.title = this.add.text(this.width/2, this.height/16, "Leaderboard", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);

    this.back = this.add.text(this.width/8, this.height/16, "Back", {fontSize: '20px', fill: '#000', align: 'center'}).setOrigin(.5);
    this.back.setInteractive();
    this.back.on('pointerover', () => {this.back.setStyle({fontSize: '20px', fill: '#F00'})});
    this.back.on('pointerout', () => {this.back.setStyle({fontSize: '20px', fill: '#000'})});
    this.back.on('pointerup', () => {
      this.scene.start('startMenu');
    });


    for(let i = 0; i < 10; i++)
    {
      if(i === this.sortedScores.length) break;
      if(this.sortedScores[i].userID === "foo") continue;

      var text = "" + (i+1) + ". " + this.sortedScores[i].playerName + " " + this.sortedScores[i].score;
      var correctFill = Meteor.userId() === this.sortedScores[i].userID ? '#F00' : "#000";
      this.add.text(this.width/2, this.height/16 + (this.height * (3/40 * (i+1))), text, {fontSize: '32px', fill: correctFill, align: 'center'}).setOrigin(.5);
    }
  }
  update()
  {
    //console.log(Session.get('local'));
  }
}
class End extends Phaser.Scene
{
  //TODO: FINISH THE GAME
  constructor(width, height, score)
  {
    super({key : 'end'});
    var width, height, score;
    this.width = width;
    this.height = height;
    this.score = score;

    var title, replay, menu, scoreLabel;
  }
  init(data)
  {
    this.score = data.score < 0 ? 0 : data.score;
  }
  preload()
  {

  }
  create()
  {
    this.title = this.add.text(this.width/2, this.height/8, "GAME OVER", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    this.scoreLabel = this.add.text(this.width/2, this.height * (3/16), "SCORE: " + this.score, {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    
    this.replay = this.add.text(this.width/4, this.height/4, "REPLAY", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    this.replay.setInteractive();
    this.replay.on('pointerover', () => {this.replay.setStyle({fontSize: '32px', fill: '#F00'})});
    this.replay.on('pointerout', () => {this.replay.setStyle({fontSize: '32px', fill: '#000'})});
    this.replay.on('pointerup', () => {
      this.scene.start('game');
    });

    this.menu = this.add.text(this.width * .75, this.height/4, "MENU", {fontSize: '32px', fill: '#000', align: 'center'}).setOrigin(.5);
    this.menu.setInteractive();
    this.menu.on('pointerover', () => {this.menu.setStyle({fontSize: '32px', fill: '#F00'})});
    this.menu.on('pointerout', () => {this.menu.setStyle({fontSize: '32px', fill: '#000'})});
    this.menu.on('pointerup', () => {
      this.scene.start('startMenu');
    });
  }
  update()
  {

  }
}