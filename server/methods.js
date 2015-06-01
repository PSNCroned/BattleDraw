Meteor.methods({
	"createGame": function (maxPlayers) {
		maxPlayers = Math.round(maxPlayers);
		if (maxPlayers > 0 && maxPlayers <= 2) {
			var host = Meteor.users.findOne(this.userId).username;
			var pList = [];
			var numPlayers = 0;
			var hasStarted = false;
			var countDown = 10;
			var gameId = GameList.insert({
				"host": host,
				"maxPlayers": maxPlayers,
				"pList": pList,
				"numPlayers": numPlayers,
				"hasStarted": hasStarted,
				"countDown": countDown,
				"round": 0,
				"turn": 0
			});
			console.log("Created game: " + gameId);
			return gameId;
		}
	},
	"joinGame": function (gameId) {
		var user = Meteor.users.findOne(this.userId);
		var username = user.username;
		var Game = GameList.find(gameId).fetch()[0];
		
		if (Game.numPlayers != Game.maxPlayers) {
			Game.pList.push(username);
			Game.numPlayers++;
			
			GameList.update(gameId, {
				$set: {
					"pList": Game.pList,
					"numPlayers": Game.numPlayers
				}
			});
			UserInfo.update({"username": username}, {
				$set: {
					"inGame": true,
					"gameId": gameId
				}
			});
		}
	},
	"addUser": function (userObj) {
		var user = Meteor.users.findOne(this.userId);
		var exists = UserInfo.find({username: user.username}).fetch().length > 0;
		if (!exists) {
			UserInfo.insert({
				"username": user.username,
				"inGame": false
			});
			
			console.log("Inserted " + user.username + " into UserInfo");
		}
	},
	"removeUser": function (name) {
		UserInfo.remove({ "username": { $eq: name } });
	},
	"beginCount": function(gameId) {
		var Game = GameList.find(gameId).fetch()[0];
		if (this.userId) {
			var user = Meteor.users.findOne(this.userId);
			if (user.username == Game.host) {
				Game.hasStarted = true;
				var startedAt = new Date();
				GameList.update(gameId, {
					$set: {
						"hasStarted": Game.hasStarted,
						"startedAt": startedAt
					}
				});
			}
		}
	},
	"updateCountDown": function() {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = userInfo.gameId;
		var Game = GameList.find(gameId).fetch()[0];
		if (Game.hasStarted && user.username == Game.host) {
			var currentTime = new Date();
			var diff = currentTime.getSeconds() - Game.startedAt.getSeconds();
			if (Game.countDown > 0 && diff < 11) {
				var newCount = 10 - diff;
				if (newCount >= 60) {
					newCount -= 60;
				}
				GameList.update(gameId, {
					$set: {
						"countDown": newCount
					}
				});
			}
		}
	},
	"startGame": function () {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = userInfo.gameId;
		var Game = GameList.find(gameId).fetch()[0];
		if (Game.hasStarted && user.username == Game.host) {
			var stats = {};
			for (var i = 0; i < Game.maxPlayers; i++) {
				//sets default stats below
				stats[Game.pList[i]] = {"units": 100, "money": 1500, "territory": 50, "supplies": 40};
			}
			GameList.update(gameId, {
				$set: {
					"stats": stats
				}
			});
		}
	},
	"leaveGame": function () {
		var user = Meteor.users.findOne(this.userId);
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		console.log(user.username + " is leaving game " + gameId);
		var Game = GameList.find(gameId).fetch()[0];
		var pList = Game.pList;
		for (var i = 0; i < pList.length; i++) {
			console.log("Comparing " + user.username + " to " + pList[i]);
			if (pList[i] == user.username) {
				console.log("Spliced " + pList.splice(i, 1));
			}
		}
		console.log(user.username + " left game " + gameId);
		GameList.update(gameId, {
			$set: {
				"pList": pList
			},
			$inc: {
				"numPlayers": -1
			}
		});
		
		UserInfo.update({"username": user.username}, {
			$set: {
				"inGame": false
			},
			$unset: {
				"gameId": ""
			}
		});
	}
});