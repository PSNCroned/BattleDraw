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
			var stats = {"units": 100, "money": 1500, "territory": 50, "supplies": 40, "actionsLeft": 3, "cards": []};
				
			for (var i = 0; i < Game.pList.length; i++) {
				UserInfo.update(UserInfo.find({"username": Game.pList[i]}).fetch()[0]._id, {
					$set: {
						"stats": stats
					}
				});
			}
			GameList.update(gameId, {
				$inc: {
					"round": 1
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
	},
	"draw": function(amt, action, admin) {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		var draw = function(amt, action) {
			console.log("Draw function called");
			var cardsDrawn = [];
			for (var i = 0; i < amt; i++) {
				var rand = Math.floor((Math.random() * 1000) + 1);
				console.log("Rand: " + rand);
				var cardList, randIndex;
				if (rand <= 500) {
					cardList = CardList.find({"rarity": 1}).fetch();
					randIndex = Math.floor(Math.random() * (cardList.length));
					cardsDrawn.push(cardList[randIndex]._id);
				}
				else if (rand <= 700) {
					cardList = CardList.find({"rarity": 2}).fetch();
					randIndex = Math.floor(Math.random() * (cardList.length));
					cardsDrawn.push(cardList[randIndex]._id);
				}
				else if (rand <= 850) {
					cardList = CardList.find({"rarity": 3}).fetch();
					randIndex = Math.floor(Math.random() * (cardList.length));
					cardsDrawn.push(cardList[randIndex]._id);
				}
				else if (rand <= 955) {
					cardList = CardList.find({"rarity": 4}).fetch();
					randIndex = Math.floor(Math.random() * (cardList.length));
					cardsDrawn.push(cardList[randIndex]._id);
				}
				else if (rand >= 995) {
					cardList = CardList.find({"rarity": 5}).fetch();
					randIndex = Math.floor(Math.random() * (cardList.length));
					cardsDrawn.push(cardList[randIndex]._id);
				}
			}
			console.log(cardsDrawn);
			
			var newStats;
			if (action) {
				newStats = userInfo.stats;
				for (var i = 0; i < cardsDrawn.length; i++) {
					newStats.cards.push(cardsDrawn[i]);
				}
				UserInfo.update({"username": user.username}, {
					$set: {
						"stats.cards": newStats.cards
					},
					$inc: {
						"stats.actionsLeft": -1
					}
				});
			}
			else {
				console.log("Not an action, username: " + userInfo.username);
				console.log(userInfo);
				newStats = userInfo.stats;
				for (var i = 0; i < cardsDrawn.length; i++) {
					newStats.cards.push(cardsDrawn[i]);
				}
				console.log(newStats.cards + " " + userInfo._id);
				UserInfo.update({"username": user.username}, {
					$set: {
						"stats.cards": newStats.cards
					}
				});
				var playerStats = UserInfo.find({"username": user.username}).fetch()[0];
				console.log("Name: " + playerStats.username + " and cards: " + playerStats.stats.cards);
			}
		};
		
		console.log("Is admin? " + admin);
		if (user.username == Game.pList[Game.turn] && false) {
			
		}
		else if (user.username == Game.pList[Game.turn] && false) {
			
		}
		else if (Game.round == 0 && Game.stats[user.username].cards.length == 0 && false) {
			draw(5, false);
		}
		else if (admin) {
			console.log("Admin: " + admin);
			draw(5, false);
		}
	}
});