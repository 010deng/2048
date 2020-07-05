// 以canvas的模式创建游戏场景
// 第四个参数是DOM的id
var game = new Phaser.Game(240, 400, Phaser.CANVAS, 'game');

// 对应Phaser.Game中的state参数，在最后的时候会通过add方法添加
game.States = {};

// 该模块用于加载用于提示加载的gif
game.States.boot = function() {
	this.preload = function() {
		game.load.image('loading', 'assets/preloader.gif');
	};
	this.create = function() {
		game.state.start('preload');
	};
};

// 该模块在游戏加载的时候自动调用，并加载一些静态资源
game.States.preload = function() {
	this.preload = function() {
		// 上面加载这里展示
		var preloadSprite = game.add.sprite(10, game.height / 2, 'loading');
		game.load.setPreloadSprite(preloadSprite);
		// 注意这里是加载不是显示
		game.load.image('background', 'assets/bg.png');
		game.load.image('btnStart', 'assets/btn-start.png');
		game.load.image('btnRestart', 'assets/btn-restart.png');
		game.load.image('logo', 'assets/logo.png');
		game.load.image('btnTryagain', 'assets/btn-tryagain.png');
	};
	this.create = function() {
		game.state.start('main');
	};
};

// 这里已经游戏场景展示出来了，将加载好的静态资源展示在初始场景中
game.States.main = function() {
	this.create = function() {
		// 背景 -- 赋予了物理属性要使用Sprite
		game.add.tileSprite(0, 0, game.width, game.height, 'background');
		// logo
		var logo = game.add.image(0, 0, 'logo');
		logo.reset((game.width - logo.width) / 2, (game.height - logo.height) / 2 - 50);
		// 点击的时候调用 this.startGame
		var startBtn = game.add.button(0, 0, 'btnStart', this.startGame, this);
		startBtn.reset((game.width - startBtn.width) / 2, (game.height - startBtn.height) / 2 + 100);
	};
	this.startGame = function() {
		game.state.start('start');
	};
};

// 该模块是点击开始按钮后进入的模块
game.States.start = function() {
	this.create = function() {
		// 背景 -- 这里的也有背景，要显示同样要add
		game.add.tileSprite(0, 0, game.width, game.height, 'background');
		this.score = 0;
		// 最佳成绩从 localstorage 中取
		this.best = localStorage.getItem('best');
		var titleStyle = {
			font: 'bold 12px Arial',
			fill: '#4DB3B3',
			boundsAlignH: 'center'
		};
		var scoreStyle = {
			font: 'bold 20px Arial',
			fill: '#FFFFFF',
			boundsAlignH: 'center'
		};
		// 这里是计分板初始化逻辑 --这一块就是典型的canvas封装逻辑，通过画笔来绘制图形
		var scoreSprite = game.add.sprite(10, 10);
		var scoreGraphics = game.add.graphics(0, 0);
		scoreGraphics.lineStyle(5, 0xa1c5c5);
		scoreGraphics.beginFill(0x308c8c);
		scoreGraphics.drawRoundedRect(0, 0, 70, 50, 10);
		scoreGraphics.endFill();
		scoreSprite.addChild(scoreGraphics);
		var scoreTitle = game.add.text(0, 5, 'SCORE', titleStyle);
		scoreTitle.setTextBounds(0, 0, 70, 50);
		scoreSprite.addChild(scoreTitle);
		this.scoreText = game.add.text(0, 20, this.score, scoreStyle);
		this.scoreText.setTextBounds(0, 0, 70, 50);
		scoreSprite.addChild(this.scoreText);
		// 绘制逻辑与上面类似
		var bestSprite = game.add.sprite(90, 10);
		var bestGraphics = game.add.graphics(0, 0);
		bestGraphics.lineStyle(5, 0xa1c5c5);
		bestGraphics.beginFill(0x308c8c);
		bestGraphics.drawRoundedRect(0, 0, 70, 50, 10);
		bestGraphics.endFill();
		bestSprite.addChild(bestGraphics);
		var bestTitle = game.add.text(0, 5, 'BEST', titleStyle);
		bestTitle.setTextBounds(0, 0, 70, 50);
		bestSprite.addChild(bestTitle);
		this.bestText = game.add.text(0, 20, this.best, scoreStyle);
		this.bestText.setTextBounds(0, 0, 70, 50);
		bestSprite.addChild(this.bestText);
		// 绑定restart的逻辑
		var restartBtn = game.add.button(180, 15, 'btnRestart', this.rerunGame, this);
		// mainarea绘制
		var mainAreaSprite = game.add.sprite(10, 80);
		var mainAreaBackGraphics = game.add.graphics(0, 0);
		mainAreaBackGraphics.beginFill(0xbbada0, 1);
		mainAreaBackGraphics.drawRoundedRect(0, 0, 220, 220, 10);
		mainAreaBackGraphics.endFill();
		mainAreaSprite.addChild(mainAreaBackGraphics);
		// 引入phaser_swipe.js中的class
		this.swipe = new Swipe(this.game, this.swipeCheck);
		// 定义一组color 0x表示十六进制 --颜色科普一下
		this.colors = {
			2: 0x49b4b4,
			4: 0x4db574,
			8: 0x78b450,
			16: 0xc4c362,
			32: 0xcea346,
			64: 0xdd8758,
			128: 0xbf71b3,
			256: 0x9f71bf,
			512: 0x7183bf,
			1024: 0x71bfaf,
			2048: 0xff7c80
		};
		// 初始化
		this.rerunGame();
	};
	this.update = function() {
		if (this.canSwipe) {
			this.swipe.check();
		}
	};
	// 重来
	this.rerunGame = function() {
		this.score = 0;
		this.scoreText.text = this.score;
		if (this.array) {
			for (var i = 0; i < 4; i++) {
				for (var j = 0; j < 4; j++) {
					// 清空所有的现有对象
					if (this.array[i][j].sprite) {
						this.array[i][j].sprite.kill();
					}
				}
			}
		}
		// 4x4 array  -- {value:,x:,y:}
		this.array = [];
		for (var i = 0; i < 4; i++) {
			this.array[i] = [];
			for (var j = 0; j < 4; j++) {
				this.array[i][j] = {};
				this.array[i][j].value = 0;
				this.array[i][j].x = i;
				this.array[i][j].y = j;
			}
		}
		// 是否响应swipe
		this.canSwipe = true;
		// 初始化方块
		this.generateSquare();
	};
	// 坐标转换 --将(2,2)这种理想坐标，转换为游戏通用坐标
	this.transX = function(x) {
		return 10 + 8 * (x + 1) + x * 45 + 45 / 2;
	};
	this.transY = function(y) {
		return 80 + 8 * (y + 1) + y * 45 + 45 / 2;
	};
	// 随机产生一个方块
	this.generateSquare = function() {
		// 提示一下 Math.random()的取值范围为 0-1
		var x = Math.floor(Math.random() * 4);
		var y = Math.floor(Math.random() * 4);
		// 方块只能生成在没有value===0的地方
		while (this.array[x][y].value != 0) {
			x = Math.floor(Math.random() * 4);
			y = Math.floor(Math.random() * 4);
		}

		// 初始值为2或者4，概率各为50%
		var value = 2;
		if (Math.random() > 0.5) {
			value = 4;
		}
		this.placeSquare(x, y, value);
	};
	// 在x,y位置放置一个值为value的方块
	this.placeSquare = function(x, y, value) {
		var squareStyle = {
			font: 'bold 20px Arial',
			fill: '#FFFFFF',
			boundsAlignH: 'center',
			boundsAlignV: 'middle'
		};
		var square = game.add.sprite();
		// 转换坐标
		square.reset(this.transX(x), this.transY(y));
		var squareBackground = game.add.graphics(-45 / 2, -45 / 2);
		squareBackground.beginFill(this.colors[value]);
		squareBackground.drawRoundedRect(0, 0, 45, 45, 5);
		squareBackground.endFill();
		square.addChild(squareBackground);
		var squareText = game.add.text(-45 / 2, -45 / 2, value, squareStyle);
		squareText.setTextBounds(0, 0, 45, 45);
		square.addChild(squareText);
		this.array[x][y].value = value;
		this.array[x][y].sprite = square;
		square.anchor.setTo(0.5, 0.5);
		square.scale.setTo(0.0, 0.0);
		// 动画
		var tween = game.add.tween(square.scale).to({ x: 1.0, y: 1.0 }, 100, Phaser.Easing.Sinusoidal.InOut, true);
		tween.onComplete.add(function() {
			if (this.checkGameover()) {
				this.gameOver();
			}
		}, this);
	};
	// swipe的公共逻辑抽出
	this.swipeCommon = function(i, j, arrNode, posJson, condition, nextArrNode, nextPosJson) {
		var that = this;
		var duration = 100;
		// 遇到了可以合并的
		if (!arrNode.newNode && arrNode.value == this.array[i][j].value) {
			arrNode.value = arrNode.value * 2;
			arrNode.newNode = true;
			this.array[i][j].value = 0;
			this.score = this.score + arrNode.value;
			this.scoreText.text = this.score;
			if (this.score > this.best) {
				this.best = this.score;
				this.bestText.text = this.best;
				localStorage.setItem('best', this.best);
			}
			// 渐渐透明后被kill掉
			var t1 = game.add.tween(arrNode.sprite).to({ alpha: 0 }, duration, Phaser.Easing.Linear.None, true);
			t1.onComplete.add(function() {
				this.sprite.kill();
				that.placeSquare(this.x, this.y, this.value);
				if (!that.canSwipe) {
					that.canSwipe = true;
					that.generateSquare();
				}
			}, arrNode);
			var t2 = game.add.tween(this.array[i][j].sprite).to({ alpha: 0 }, duration, Phaser.Easing.Linear.None, true);
			t2.onComplete.add(function() {
				this.kill();
				if (!that.canSwipe) {
					that.canSwipe = true;
					that.generateSquare();
				}
			}, this.array[i][j].sprite);
			game.add.tween(this.array[i][j].sprite).to(posJson, duration, Phaser.Easing.Linear.None, true);
			arrNode.sprite = this.array[i][j].sprite;
			this.array[i][j].sprite = undefined;
		} else if (arrNode.value == 0) {
			arrNode.value = this.array[i][j].value;
			this.array[i][j].value = 0;
			var t = game.add.tween(this.array[i][j].sprite).to(posJson, duration, Phaser.Easing.Linear.None, true);
			t.onComplete.add(function() {
				if (!that.canSwipe) {
					that.canSwipe = true;
					that.generateSquare();
				}
			});
			arrNode.sprite = this.array[i][j].sprite;
			this.array[i][j].sprite = undefined;
		} else if (condition) {
			nextArrNode.value = this.array[i][j].value;
			this.array[i][j].value = 0;
			var t = game.add.tween(this.array[i][j].sprite).to(nextPosJson, duration, Phaser.Easing.Linear.None, true);
			t.onComplete.add(function() {
				if (!that.canSwipe) {
					that.canSwipe = true;
					that.generateSquare();
				}
			});
			nextArrNode.sprite = this.array[i][j].sprite;
			this.array[i][j].sprite = undefined;
		}
	};
	// swipe的初始逻辑抽出
	this.swipeInit = function() {
		this.canSwipe = false;
		game.time.events.add(
			Phaser.Timer.SECOND * 0.5,
			function() {
				if (!this.canSwipe) {
					this.canSwipe = true;
				}
			},
			this
		);
	};
	// swipe的结尾逻辑抽出
	this.swipeDone = function() {
		for (var i = 0; i < this.array.length; i++) {
			for (var j = 0; j < this.array.length; j++) {
				this.array[i][j].newNode = undefined;
			}
		}
	};
	this.swipeLeft = function() {
		this.swipeInit();
		for (var i = 1; i < this.array.length; i++) {
			for (var j = 0; j < this.array.length; j++) {
				if (this.array[i][j].value != 0) {
					var index = i - 1;
					while (index > 0 && this.array[index][j].value == 0) {
						index--;
					}
					this.swipeCommon(
						i,
						j,
						this.array[index][j],
						{ x: this.transX(index), y: this.transY(j) },
						index + 1 != i,
						this.array[index + 1][j],
						{ x: this.transX(index + 1), y: this.transY(j) }
					);
				}
			}
		}
		this.swipeDone();
	};
	this.swipeUp = function() {
		this.swipeInit();
		for (var i = 0; i < this.array.length; i++) {
			for (var j = 1; j < this.array.length; j++) {
				if (this.array[i][j].value != 0) {
					var index = j - 1;
					while (index > 0 && this.array[i][index].value == 0) {
						index--;
					}
					this.swipeCommon(
						i,
						j,
						this.array[i][index],
						{ x: this.transX(i), y: this.transY(index) },
						index + 1 != j,
						this.array[i][index + 1],
						{ x: this.transX(i), y: this.transY(index + 1) }
					);
				}
			}
		}
		this.swipeDone();
	};
	this.swipeRight = function() {
		this.swipeInit();
		for (var i = this.array.length - 2; i >= 0; i--) {
			for (var j = 0; j < this.array.length; j++) {
				if (this.array[i][j].value != 0) {
					var index = i + 1;
					while (index < this.array.length - 1 && this.array[index][j].value == 0) {
						index++;
					}
					this.swipeCommon(
						i,
						j,
						this.array[index][j],
						{ x: this.transX(index), y: this.transY(j) },
						index - 1 != i,
						this.array[index - 1][j],
						{ x: this.transX(index - 1), y: this.transY(j) }
					);
				}
			}
		}
		this.swipeDone();
	};
	this.swipeDown = function() {
		this.swipeInit();
		for (var i = 0; i < this.array.length; i++) {
			for (var j = this.array.length - 2; j >= 0; j--) {
				if (this.array[i][j].value != 0) {
					var index = j + 1;
					while (index < this.array.length - 1 && this.array[i][index].value == 0) {
						index++;
					}
					this.swipeCommon(
						i,
						j,
						this.array[i][index],
						{ x: this.transX(i), y: this.transY(index) },
						index - 1 != j,
						this.array[i][index - 1],
						{ x: this.transX(i), y: this.transY(index - 1) }
					);
				}
			}
		}
		this.swipeDone();
	};
	// swipe检测
	this.swipeCheck = {
		up: this.swipeUp.bind(this),
		down: this.swipeDown.bind(this),
		left: this.swipeLeft.bind(this),
		right: this.swipeRight.bind(this)
	};
	// 检测是否游戏结束
	this.checkGameover = function() {
		// 如果16个格子没满，return false
		for (var i = 0; i < this.array.length; i++) {
			for (var j = 0; j < this.array.length; j++) {
				if (this.array[i][j].value == 0) {
					return false;
				}
			}
		}
		// 如果16个格子和周围格子有相同的值的，return false
		var d = [ { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 } ];
		for (var i = 0; i < this.array.length; i++) {
			for (var j = 0; j < this.array.length; j++) {
				for (var k = 0; k < d.length; k++) {
					if (
						i + d[k].dx >= 0 &&
						i + d[k].dx < this.array.length &&
						j + d[k].dy >= 0 &&
						j + d[k].dy < this.array.length &&
						this.array[i][j].value == this.array[i + d[k].dx][j + d[k].dy].value
					) {
						return false;
					}
				}
			}
		}
		return true;
	};
	// 游戏结束
	this.gameOver = function() {
		if (!this.gameOverMask) {
			this.gameOverMask = game.add.sprite(0, 0);
			var mask = game.add.graphics(0, 0);
			mask.beginFill(0x000000, 0.5);
			mask.drawRect(0, 0, game.width, game.height);
			mask.endFill();
			this.gameOverMask.addChild(mask);
			var gameOverTextStyle = {
				font: 'bold 35px Arial',
				fill: '#FFFFFF',
				boundsAlignH: 'center'
			};
			var gameOverText = game.add.text(0, 100, 'Game Over', gameOverTextStyle);
			gameOverText.setTextBounds(0, 0, game.width, game.height);
			this.gameOverMask.addChild(gameOverText);
			var gameOverBtn = game.add.button((game.width - 206) / 2, 200, 'btnTryagain', this.tryAgain, this);
			this.gameOverMask.addChild(gameOverBtn);
		}
	};
	// try again
	this.tryAgain = function() {
		this.gameOverMask.kill();
		this.gameOverMask = undefined;
		this.rerunGame();
	};
};

// 串行控制 -- 这里是注册
game.state.add('boot', game.States.boot);
game.state.add('preload', game.States.preload);
game.state.add('main', game.States.main);
game.state.add('start', game.States.start);

// 这里是执行
game.state.start('boot');
