Meteor.methods({
	"createGame": function (infoObj) {
		var host = infoObj.host;
		var maxPlayers = infoObj.maxPlayers;
		var pList = [];
		var numPlayers = 1;
		var hasStarted = false;
		var gameId = GameList.insert({
			"host": host,
			"maxPlayers": maxPlayers,
			"pList": pList,
			"numPlayers": numPlayers,
			"hasStarted": hasStarted
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
		GameList.update(gameId, {
			"host": Game.host,
			"maxPlayers": Game.maxPlayers,
			"pList": Game.pList,
			"numPlayers": Game.numPlayers,
			"hasStarted": Game.hasStarted
		});
	},
	"addUser": function (userObj) {
		var exists = UserInfo.find({username: userObj.username}).fetch().length > 0;
		if (!exists) {
			UserInfo.insert(userObj);
			console.log("Inserted " + userObj + " into UserInfo");
		}
	},
	"removeUser": function (name) {
		UserInfo.remove({ "username": { $eq: name } });
	}
});