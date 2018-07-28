import React, {Component} from 'react';
import Phaser from 'phaser';
import {Scores} from '../api/Scores.js';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';

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
      scene: [new Game(width, height)],
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
  }

  render()
  {
    return <div id="game"></div>;
  }
}

export default withTracker(() => {
  const subscription = Meteor.subscribe('scores');
  var ID = Meteor.userId();
  return {
    isReady: subscription.ready(),
    scores: subscription.ready() && Scores.find({}).fetch(),
    local: subscription.ready() && Scores.find({userID: ID}).fetch(),
    global: subscription.ready() && Scores.find().fetch()[0].score
  };
})(PhaserGame);

class Game extends Phaser.Scene
{
  constructor(width, height)
  {
    super({key : 'game'});
    var player;
    var pipes;
    var score, scoreLabel

    var width, height, gravity;
    this.width = width;
    this.height = height;
    this.gravity = gravity;
  }
  preload()
  {
    this.load.image('bird', '/bird.png');
    this.load.image('pipe', '/pipe.png');
  }
  create()
  {
    this.score = 0;
    this.scoreLabel = this.add.text(20, 20, "0", {fontSize: '32px', fill: '#000'});
    this.player = this.physics.add.sprite(100, 150, 'bird');
    this.pipes = this.add.group();
    this.physics.add.collider(this.player, this.pipes, this.restartGame, null, this);
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
      //console.log("space bar down");
      this.player.setVelocityY(-160);
    }
    if(this.player.y < 0 || this.player.y > this.height)
    {
      this.restartGame();
    }
    //console.log(this.height);
  }
  restartGame()
  {
    Meteor.call('scores.updateOrInsert', Meteor.userId(), this.score);
    this.scene.restart();
  }
  addPipeBlock(x, y)
  {
    var pipe = this.physics.add.image(x, y, 'pipe');
    //pipe.setActive();
    pipe.setVelocityX(-200);
    pipe.setGravity(0, -500);
    //console.log(pipe);
    pipe.checkWorldBounds = true;
    pipe.outOfBoundsKill = true;

    this.pipes.add(pipe);
  }
  addPipe()
  {
    let hole = Math.floor(Math.random() *  5) + 1;
    for(let i = 0; i < 9 ; i++)
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
