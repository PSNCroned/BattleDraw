Meteor.methods({
	"createGame": function (maxPlayers) {
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
			"countDown": countDown
		});
		console.log(gameId);
		return gameId;
	},
	"joinGame": function (gameId) {
		var user = Meteor.users.findOne(this.userId);
		var username = user.username;
		var Game = GameList.find({ _id: gameId }).fetch()[0];
		
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
			UserInfo.insert({"username": user.username, "inGame": false});
			console.log("Inserted " + user.username + " into UserInfo");
		}
		else {
			console.log("Stopped repeated insertion");
		}
	},
	"removeUser": function (name) {
		UserInfo.remove({ "username": { $eq: name } });
	},
	"startGame": function(gameId) {
		var Game = GameList.find({"_id": gameId}).fetch()[0];
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
	"updateCountDown": function(gameId) {
		var Game = GameList.find({"_id": gameId}).fetch()[0];
		if (Game.hasStarted) {
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
	}
});