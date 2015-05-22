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
		console.log(Game);
		Game.pList.push(username);
		console.log(Game.pList);
		GameList.update(gameId, {
			"host": Game.host,
			"maxPlayers": Game.maxPlayers,
			"pList": Game.pList,
			"numPlayers": Game.numPlayers,
			"hasStarted": Game.hasStarted
		});
	}
});