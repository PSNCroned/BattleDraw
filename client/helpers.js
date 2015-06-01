Template.body.helpers({
	"showLeave": function() {
		var inGame;
		if (Meteor.user()) {
			inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			inGame = false;
		}
		
		if (inGame) {
			return true;
		}
		else {
			return false;
		}
	}
});

Template.form.helpers({
	"display": function () {
		var inGame;
		if (Meteor.user()) {
			inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			inGame = true;
		}
		
		if (inGame) {
			return false;
		}
		else {
			return true;
		}
	}
});

Template.game.helpers({
	"display": function () {
		var inGame;
		if (Meteor.user()) {
			inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			inGame = false;
		}
		if (inGame) {
			return true;
		}
		else {
			return false;
		}
	},
	"hostName": function() {
		return GameList.find(UserInfo.find({ "username": Meteor.user().username }).fetch()[0].gameId).fetch()[0].host;
	},
	"countDown": function() {
		return GameList.find(UserInfo.find({ "username": Meteor.user().username }).fetch()[0].gameId).fetch()[0].countDown;
	},
	"subHeader": function() {
		var Game = GameList.find(UserInfo.find({ "username": Meteor.user().username }).fetch()[0].gameId).fetch()[0];
		if (Game.hasStarted == true && Game.countDown > 0) {
			return "Time Until Game Starts: " + Game.countDown;
		}
		else if (Game.hasStarted == false) {
			return "Join Game Code: " + Game._id;
		}
		else {
			var turn = Game.turn;
			return Game.pList[turn] + "'s Turn";
		}
	},
	"theirStats": function() {
		var Game = GameList.find(UserInfo.find({ "username": Meteor.user().username }).fetch()[0].gameId).fetch()[0];
		if (Game.hasStarted == true) {
			 var players = Game.pList;		 
			 for (var i = 0; i < players.length; i++) {
				 if (players[i] == Meteor.user().username) {
					 players.splice(i, 1);
				 }
			 }
			 return UserInfo.find({"username": players[0]}).fetch()[0].stats;
		}
	},
	"yourStats": function() {
		var Game = GameList.find(UserInfo.find({ "username": Meteor.user().username }).fetch()[0].gameId).fetch()[0];
		if (Game.hasStarted) {
			var stats = UserInfo.find({"username": Meteor.user().username}).fetch()[0].stats;
			return stats;
		}
	}
});