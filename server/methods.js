Meteor.methods({
	"createGame": function (infoObj) {
		var host = infoObj.host;
		var maxPlayers = infoObj.maxPlayers;
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
	"joinGame": function (infoObj) {
		var gameId = infoObj.gameId;
		var username = infoObj.username;
		var Game = GameList.find({ _id: gameId }).fetch()[0];

		UserInfo.update({"username": username}, {
			"username": username,
			"inGame": true,
			"gameId": gameId
		});
		Game.pList.push(username);
		Game.numPlayers++;
		GameList.update(gameId, {
			"host": Game.host,
			"maxPlayers": Game.maxPlayers,
			"pList": Game.pList,
			"numPlayers": Game.numPlayers,
			"hasStarted": Game.hasStarted,
			"countDown": Game.countDown
		});
	},
	"addUser": function (userObj) {
		var exists = UserInfo.find({username: userObj.username}).fetch().length > 0;
		if (!exists) {
			UserInfo.insert(userObj);
			console.log("Inserted " + userObj + " into UserInfo");
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
		var startedAt = new Date();
		if (this.userId) {
			var user = Meteor.users.findOne(this.userId);
			if (user.username == Game.host) {
				Game.hasStarted = true;
				GameList.update(gameId, {
					"host": Game.host,
					"maxPlayers": Game.maxPlayers,
					"pList": Game.pList,
					"numPlayers": Game.numPlayers,
					"hasStarted": Game.hasStarted,
					"countDown": Game.countDown,
					"startedAt": startedAt
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