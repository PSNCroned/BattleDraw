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
	"draw": function (amt, action, isClient) {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		var drawCards = function (amt, action) {
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
				else if (rand >= 955) {
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
			return newStats.cards;
		};
		
		if (user.username == Game.pList[Game.turn] && !Game.drawPhase && userInfo.stats.actionsLeft > 0 && isClient) {
			//Regular card draw
			console.log("reg draw called");
			drawCards(1, true);
		}
		else if (user.username == Game.pList[Game.turn] && userInfo.playingDrawCard) {
			//Drawing through Draw card
			var newCards = drawCards(amt, false);
			UserInfo.update({"username": user.username}, {
				$set: {
					"playingDrawCard": false
				}
			});
			return newCards
		}
		else if (Game.round == 1 && userInfo.stats.cards.length < 5 && Game.drawPhase == true && !userInfo.stats.drawnFirstCards) {
			//Dealing 5 cards on initial spawn
			drawCards(5, false);
			console.log("initial card draw called");
		}
		else if (false) {
			//Testing the draw function
			drawCards(5, false);
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
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var recipInfo = UserInfo.find({"username": recipient}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		var cardPlayed = true;
		var hasCard;
		
		//Define functions for card actions here
		var attack = function (unitAmt, min, max) {
			var unitAmtPercent = unitAmt / 100;
			var randUnitAmt = Math.floor((Math.random() * (userInfo.stats.units * unitAmtPercent + 1)));
			var playerName;
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				//if (playerName == recipient || playerName == user.username) {} -- For later use when more than 2 players are supported
				if (UserInfo.find({"username": playerName}).fetch()[0].stats.units > randUnitAmt) {
					UserInfo.update({"username": playerName}, {
						$inc: {
							"stats.units": randUnitAmt * -1
						}
					});
				}
				else {
					UserInfo.update({"username": playerName}, {
						$set: {
							"stats.units": 0
						}
					});
				}
			}
			
			var randTerrAmt = Math.floor((Math.random() * ((max-min) + 1)) + min);
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				if (playerName == user.username) {
					UserInfo.update({"username": playerName}, {
						$inc: {
							"stats.territory": randTerrAmt
						}
					});
				}
				else {
					UserInfo.update({"username": playerName}, {
						$inc: {
							"stats.territory": randTerrAmt * -1
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
		
		var raid = function (unitAmt, supMin, supMax, monMin, monMax) {
			var unitAmtPercent = unitAmt / 100;
			var randUnitAmt = Math.floor((Math.random() * (userInfo.stats.units * unitAmtPercent + 1)));
			var playerName;
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				//if (playerName == recipient || playerName == user.username) {} -- For later use when more than 2 players are supported
				UserInfo.update({"username": playerName}, {
					$inc: {
						"stats.units": randUnitAmt * -1
					}
				});
			}
			
			var randSupplyPercent = Math.floor(Math.random() * ((supMax-supMin) + 1) + supMin) / 100;
			var randSupplyAmt = Math.round(recipInfo.stats.supplies * randSupplyPercent);
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				if (recipInfo.stats.supplies > randSupplyAmt) {
					if (playerName == user.username) {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.supplies": randSupplyAmt
							}
						});
					}
					else {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.supplies": randSupplyAmt * -1
							}
						});
					}
				}
				else {
					randSupplyAmt = recipInfo.stats.supplies;
					if (playerName == user.username) {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.supplies": randSupplyAmt
							}
						});
					}
					else {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.supplies": randSupplyAmt * -1
							}
						});
					}
				}
			}
			
			var randMoneyPercent = Math.floor(Math.random() * ((monMax-monMin) + 1) + monMin) / 100;
			var randMoneyAmt = Math.round(recipInfo.stats.supplies * randMoneyPercent);
			for (var i = 0; i < Game.pList.length; i++) {
				playerName = Game.pList[i];
				if (recipInfo.stats.money > randMoneyAmt) {
					if (playerName == user.username) {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.money": randMoneyAmt
							}
						});
					}
					else {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.money": -randMoneyAmt
							}
						});
					}
				}
				else {
					randMoneyAmt = recipInfo.stats.money;
					if (playerName == user.username) {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.money": randMoneyAmt
							}
						});
					}
					else {
						UserInfo.update({"username": playerName}, {
							$inc: {
								"stats.money": -randMoneyAmt
							}
						});
					}
				}
					
			}
			
			var msg = user.username + " has stolen " + randSupplyAmt + " supplies and $"  + randMoneyAmt + " from " + recipient + " at a cost of " + randUnitAmt + " units!";
			Meteor.call("sendChat", msg, {
				"game": Game,
				"color": "#800000"
			});
			
		};
		
		var bomb = function (min, max, cost) {
			if (userInfo.stats.supplies >= cost && userInfo.stats.money >= cost) {
				var randPercent = Math.floor(Math.random() * ((max-min) + 1) + min) / 100;
				var randAmt = Math.round(recipInfo.stats.units * randPercent);
				if (recipInfo.stats.units > randAmt) {
					UserInfo.update({"username": recipient}, {
						$inc: {
							"stats.units": randAmt * -1
						}
					});
				}
				else {
					randAmt = recipInfo.stats.units;
					UserInfo.update({"username": recipient}, {
						$dec: {
							"stats.units": randAmt * -1
						}
					});
				}
				UserInfo.update({"username": user.username}, {
					$inc: {
						"stats.supplies": cost * -1,
						"stats.money": cost * -1
					}
				});
				
				var msg = user.username + " has bombed " + recipient + "! They killed "  + randAmt + " units!";
				Meteor.call("sendChat", msg, {
					"game": Game,
					"color": "#800000"
				});
			}
			else {
				cardPlayed = false;
			}
		};
		
		var kill = function (amt, min, max) {
			var randPercent = Math.floor(Math.random() * ((max-min) + 1) + min) / 100;
			var randAmt = Math.round(recipInfo.stats.units * randPercent);
			if (recipInfo.stats.units > randAmt) {
				UserInfo.update({"username": recipient}, {
					$inc: {
						"stats.units": randAmt * -1
					}
				});
			}
			else {
				randAmt = recipInfo.stats.units;
				UserInfo.update({"username": recipient}, {
					$dec: {
						"stats.units": randAmt * -1
					}
				});
			}
			
			var unitAmtPercent = amt / 100;
			var randUnitAmt = Math.floor((Math.random() * (userInfo.stats.units * unitAmtPercent + 1)));
			UserInfo.update({"username": user.username}, {
				$inc: {
					"stats.units": randUnitAmt * -1
				}
			});
				
			var msg = user.username + " has assassinated " + randAmt + " of "  + recipient + "'s units at a cost of " + randUnitAmt + " of their own units!";
			Meteor.call("sendChat", msg, {
				"game": Game,
				"color": "#800000"
			});
		};
		
		var playDraw = function (amt) {
			cardPlayed = false;
			Meteor.call("draw", amt, false, false, function(error, result) {
				var cardList = result;
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
			});
			UserInfo.update({"username": user.username}, {
				$set: {
					"playingDrawCard": true
				}
			});
				
			var msg = user.username + " has drawn " + amt + " cards!";
			Meteor.call("sendChat", msg, {
				"game": Game,
				"color": "#800000"
			});
		};
		
		var buy = function (buyType, amt) {
			var cost;
			if (buyType == "units") {
				cost = 10 * amt; 
				if (userInfo.stats.money >= cost) {
					UserInfo.update({"username": user.username}, {
						$inc: {
							"stats.money": cost * -1,
							"stats.units": amt
						}
					});
				}
				else {
					cardPlayed = false;
				}
			}
			else if (buyType == "supplies") {
				cost = 2 * amt; 
				if (userInfo.stats.money >= cost) {
					UserInfo.update({"username": user.username}, {
						$inc: {
							"stats.money": cost * -1,
							"stats.supplies": amt
						}
					});
				}
				else {
					cardPlayed = false;
				}
			}
				
			var msg = user.username + " has bought " + amt + " " + buyType;
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
					
					switch (CardList.find(String(card)).fetch()[0].name) {
						case "Buy Units":
							buy("units", 50);
							break;
							
						case "Buy Supplies":
							buy("supplies", 50);
							break;
					}
					
					break;
				
				case "raid":
					
					switch (CardList.find(String(card)).fetch()[0].rarity) {
						case 1:
							raid(20, 0, 15, 0, 5);
							break;
							
						case 2:
							raid(50, 10, 50, 5, 10);
							break;
							
						case 3:
							raid(90, 50, 90, 7, 15);
							break;
							
						case 4:
							raid(20, 60, 80, 15, 20);
							break;
					}
					
					break;
				
				case "bomb":
					
					switch (CardList.find(String(card)).fetch()[0].rarity) {
						case 2:
							bomb(0, 10, 100);
							break;
							
						case 3:
							bomb(5, 30, 250);
							break;
							
						case 4:
							bomb(20, 50, 500);
							break;
							
						case 5:
							bomb(70, 90, 1000);
							break;
					}
					
					break;
				
				case "draw":
				
					switch (CardList.find(String(card)).fetch()[0].rarity) {
						case 2:
							playDraw(2);
							break;
							
						case 3:
							playDraw(3);
							break;
							
						case 4:
							playDraw(4);
							break;
							
						case 5:
							playDraw(5);
							break;
					}
					
					break;
				
				case "assassinate":
				
					switch (CardList.find(String(card)).fetch()[0].rarity) {
						case 3:
							kill(5, 10, 15);
							break;
							
						case 4:
							kill(10, 20, 30);
							break;
							
						case 5:
							kill(20, 40, 50);
							break;
					}
					
					break;
			
				default:
			}
			if (cardPlayed) {
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
				
		}
		else {
		}
	},
	"switchTurn": function () {
		var user = Meteor.users.findOne(this.userId);
		var userInfo = UserInfo.find({"username": user.username}).fetch()[0];
		var gameId = UserInfo.find({"username": user.username}).fetch()[0].gameId;
		var Game = GameList.find(gameId).fetch()[0];
		if (Game.countDown <= 0 && userInfo.stats) {
			if (Game.turn == Game.pList.indexOf(user.username) && userInfo.stats.actionsLeft <= 0) {
				if (Game.turn == Game.pList.length - 1) {
					var newMoney = userInfo.stats.territory * 10;
					UserInfo.update({"username": user.username}, {
						$set: {
							"stats.actionsLeft": 3
						},
						$inc: {
							"stats.money": newMoney
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
					newMoney = userInfo.stats.territory * 10;
					UserInfo.update({"username": user.username}, {
						$set: {
							"stats.actionsLeft": 3
						},
						$inc: {
							"stats.money": newMoney
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