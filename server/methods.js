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
				"turn": 0,
				"drawPhase": false,
				"chatList": []
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
				"inGame": false,
				"gameId": user.username
			});
			
			console.log("Inserted " + user.username + " into UserInfo");
		}
	},
	"removeUser": function (name) {
		//Not used
		//UserInfo.remove({ "username": { $eq: name } });
	},
	"beginCount": function (gameId) {
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
	"updateCountDown": function () {
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
			var stats = {"units": 100, "money": 1500, "territory": 50, "supplies": 40, "actionsLeft": 3, "cards": [], "drawnFirstCards": false};
				
			for (var i = 0; i < Game.pList.length; i++) {
				UserInfo.update(UserInfo.find({"username": Game.pList[i]}).fetch()[0]._id, {
					$set: {
						"stats": stats
					}
				});
			}
			GameList.update(gameId, {
				$set: {
					"drawPhase": true
				},
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
				"inGame": false,
				"gameId": user.username
			},
			$unset: {
				"stats": ""
			}
		});
	},
	"draw": function (amt, action) {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		var draw = function (amt, action) {
			var cardsDrawn = [];
			for (var i = 0; i < amt; i++) {
				var rand = Math.floor((Math.random() * 1000) + 1);
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
				newStats = userInfo.stats;
				for (var i = 0; i < cardsDrawn.length; i++) {
					newStats.cards.push(cardsDrawn[i]);
				}
				UserInfo.update({"username": user.username}, {
					$set: {
						"stats.cards": newStats.cards
					}
				});
				for (var i = 0, usersDrawn = 0; i < Game.pList.length; i++) {
					if (UserInfo.find({"username": Game.pList[i]}).fetch()[0].stats.cards.length >= 5) {
						usersDrawn++;
					}
					if (usersDrawn >= Game.maxPlayers) {
						GameList.update(gameId, {
							$set: {
								"drawPhase": false
							}
						});
					}
				}
			}
			if (userInfo.stats.cards.length >= 5 && Game.round == 1) {
				UserInfo.update({"username": user.username}, {
					$set: {
						"stats.drawnFirstCards": true
					}
				});
			}
		};
		
		if (user.username == Game.pList[Game.turn] && !Game.drawPhase && userInfo.stats.actionsLeft > 0) {
			//Regular card draw
			console.log("reg draw called");
			draw(1, true);
		}
		else if (user.username == Game.pList[Game.turn] && false) {
			//Drawing through Draw card
		}
		else if (Game.round == 1 && userInfo.stats.cards.length < 5 && Game.drawPhase == true && userInfo.stats.drawnFirstCards == false) {
			//Dealing 5 cards on initial spawn
			draw(5, false);
		}
		else if (false) {
			//Testing the draw function
			draw(5, false);
		}
	},
	"sendChat": function (msg, server) {
		if (!server) {
			var user = Meteor.users.findOne(this.userId);
			var Game = GameList.find(UserInfo.find({"username": user.username}).fetch()[0].gameId).fetch()[0];
			var chatObj = {"sender": user.username, "msg": msg, "time": new Date()};
			GameList.update(Game._id, {
				$push: {
					"chatList": chatObj
				}
			});
		}
		else {
			Game = server.game;
			chatObj = {"sender": "@", "msg": msg, "time": new Date(), "color": server.color};
			GameList.update(Game._id, {
				$push: {
					"chatList": chatObj
				}
			});
		}
			
	},
	"playCard": function (card, recipient) {
		console.log("Card: " + card + " at " + recipient);
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		var hasCard;
		
		//Define functions for card actions here
		var attack = function (unitAmt, min, max) {
			var unitAmtPercent = unitAmt / 100;
			var randUnitAmt = Math.floor((Math.random() * (userInfo.stats.units * unitAmtPercent + 1)));
			var playerName, newAmt;
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				//if (playerName == recipient || playerName == user.username) {} -- For later use when more than 2 players are supported
				newAmt = UserInfo.find({"username": playerName}).fetch()[0].stats.units - randUnitAmt;
				UserInfo.update({"username": playerName}, {
					$set: {
						"stats.units": newAmt
					}
				});
			}
			
			var randTerrAmt = Math.floor((Math.random() * (max + 1)) + min);
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				if (playerName == user.username) {
					newAmt = UserInfo.find({"username": playerName}).fetch()[0].stats.territory + randTerrAmt;
					UserInfo.update({"username": playerName}, {
						$set: {
							"stats.territory": newAmt
						}
					});
				}
				else {
					newAmt = UserInfo.find({"username": playerName}).fetch()[0].stats.territory - randTerrAmt;
					UserInfo.update({"username": playerName}, {
						$set: {
							"stats.territory": newAmt
						}
					});
				}
			}
			
			var msg = user.username + " has captured " + randTerrAmt + " territories from " + recipient + " at a cost of " + randUnitAmt + " units!";
			Meteor.call("sendChat", msg, {
				"game": Game,
				"color": "#800000"
			});
		};
		
		for (var i = 0; i < userInfo.stats.cards.length; i++) {
			if (userInfo.stats.cards[i] == card) {
				hasCard = true;
			}
		}
		
		if (hasCard && Game.turn == Game.pList.indexOf(user.username)) {
			console.log("User has card!");
			switch (CardList.find(String(card)).fetch()[0].class) {
				case "attack":
					
					switch (CardList.find(String(card)).fetch()[0].rarity) {
						case 1:
							attack(20, 0, 3);
							break;
							
						case 2:
							attack(50, 1, 6);
							break;
							
						case 3:
							attack(90, 5, 8);
							break;
					}
					
					break;
				
				case "buy":
					
					break;
				
				case "raid":
					
					break;
				
				case "bomb":
					
					break;
				
				case "draw":
					
					break;
				
				case "assassinate":
					
					break;
			
				default:
					console.log("Card does not exist!");
			}
			var cardList = userInfo.stats.cards;
			var index = cardList.indexOf(card);
			cardList.splice(index, 1);
			UserInfo.update({"username": user.username}, {
				$set: {
					"stats.cards": cardList
				},
				$inc: {
					"stats.actionsLeft": -1
				}
			});
		}
		else {
			console.log("User does not have the card or it is not their turn!");
		}
	},
	"switchTurn": function () {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		if (Game.countDown <= 0 && userInfo.stats) {
			if (Game.turn == Game.pList.indexOf(user.username) && userInfo.stats.actionsLeft <= 0) {
				console.log("method call is valid");
				if (Game.turn == Game.pList.length - 1) {
					UserInfo.update({"username": user.username}, {
						$set: {
							"stats.actionsLeft": 3
						}
					});
					GameList.update(Game._id, {
						$set: {
							"turn": 0
						}
					});
					console.log("It is now " + Game.pList[Game.turn] + "'s turn");
				}
				else {
					UserInfo.update({"username": user.username}, {
						$set: {
							"stats.actionsLeft": 3
						}
					});
					GameList.update(Game._id, {
						$inc: {
							"turn": 1
						}
					});
					console.log("It is now " + Game.pList[Game.turn] + "'s turn");
				}
			}
		}
	}
});