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
      scene: [new StartMenu(width, height), new Game(width, height), new Leaderboard(width, height)],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: {y: 500}
        }
      },
      backgroundColor: '#71c5cf',
    };
    var game = new Phaser.Game(config);
  }
  componentDidMount()
  {
    this.createGame(this.props.width, this.props.height);
    Session.set('soundEffectToggle', true);
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
    var gameOver = false;

    var width, height;
    this.width = width;
    this.height = height;
  }
  preload()
  {
    this.load.image('bird', '/bird.png');
    this.load.image('pipe', '/pipe.png');
    this.load.audio('jump', '/jump.wav');
  }
  create()
  {
    this.score = -1;
    this.scoreLabel = this.add.text(20, 20, "0", {fontSize: '32px', fill: '#000'});

    this.player = this.physics.add.sprite(this.width/4, this.height/2, 'bird');


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
    if(this.player.angle < 20)
    {
      this.player.angle += 1;
    }
    if(this.player.y < 0 || this.player.y > this.height)
    {
      this.onDeath();
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
    Meteor.call('scores.updateOrInsert', Meteor.userId(), this.score);
    this.player.alive = false;
    this.time.removeAllEvents();
    this.pipes.getChildren().forEach((block) =>{
      block.setVelocityX(0);
    });
    this.gameOver = true;
    //this.scene.restart();
  }
  addPipeBlock(x, y)
  {
    var pipe = this.physics.add.image(x, y, 'pipe');
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
    for(let i = 0; i < this.height/55; i++)
    {
      if(i != hole && i != (hole+1))
      {
        this.addPipeBlock(this.width, i * 60 + 10);
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
    var title, playButton, soundEffectToggle, scoreBoardLabel;

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
      console.log(Session.get('soundEffectToggle'));
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

      var text = "" + (i+1) + ". " + this.sortedScores[i].score;
      var correctFill = Meteor.userId() === this.sortedScores[i].userID ? '#F00' : "#000";
      this.add.text(this.width/2, this.height/16 + (this.height * (3/40 * (i+1))), text, {fontSize: '32px', fill: correctFill, align: 'center'}).setOrigin(.5);
    }
  }
  update()
  {
    //console.log(Session.get('local'));
  }
}
