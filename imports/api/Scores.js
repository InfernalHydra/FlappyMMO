import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
import {Random} from 'meteor/random';
import {check} from 'meteor/check';

export const Scores = new Mongo.Collection('scores');

if(Scores.find({}).fetch().length === 0)
{
  Scores.insert({userID: "foo", score: 0});
}

if(Meteor.isServer)
{
  Meteor.publish('scores', () => {
    return Scores.find({});
  });
}

Meteor.methods({
  'scores.updateOrInsert'(userID, score) {
    var exists = Scores.find({userID}).fetch().length === 0 ? false : true;
    //console.log(exists);
    //console.log(Scores.find({userID}));
    if(exists)
    {
      var entryID = Scores.find({userID}).fetch()[0]._id;
      var currHighScore = Scores.find({userID}).fetch()[0].score;
      if(score > currHighScore)
      {
          //console.log("Score: " + score + " currHighScore: " + currHighScore);
          Scores.update(entryID, {$set : {score}});
      }
    }
    else
    {
      Scores.insert({userID, score});
    }
  }
});
