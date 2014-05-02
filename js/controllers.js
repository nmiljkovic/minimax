(function(app) {
  'use strict';
  /*global MinimaxApp,_*/

  app.controller('MainController', function($scope, Tree, TreeEncoder, Algorithms, Playback) {
    var self = $scope

    self.algorithm = 'minimaxab';

    self.tree = Tree.create("svg#tree", {
      width: 1000, height: 500
    }, { left: 300, top: 0, bottom: 0, right: 0 });

    self.maximize = true;
    self.tree.update();

    self.$watch('maximize', function() {
      self.tree.maximize = self.maximize;
      self.tree.update();
    });

    Playback.setTree(self.tree);

    /**
     * Represents the current node being edited
     */
    self.editingNode = {
      // id of 0 means there isn't a selected node
      id: 0,
      value: 1,
      children: 0
    };

    /**
     * Used to enter a special, edit mode, where you can manually edit the tree
     * @type {boolean}
     */
    self.editMode = true;

    self.toggleEditMode = function() {
      if (self.editMode) {
        self.tree.markSelected(self.editingNode.id, false);
        self.editingNode.id = 0;
      }

      self.editMode = !self.editMode;

      if (!self.editMode) {
        self.originalRoot = self.tree.root;
        self.solve();
      }
      else {
        self.tree.root = self.originalRoot;
        self.tree.update();
      }
    };

    self.solve = function() {
      self.tree.root = _(self.originalRoot).cloneDeep();

      var algorithm = Algorithms.get(self.algorithm);
      var steps = algorithm.calculate(self.tree.root, self.maximize);

      self.tree.hideAllNodes();
      self.tree.setVisible(1, true);

      Playback.setSteps(steps);
      self.tree.update();
    };

    self.setAlgorithm = function(algorithm) {
      if (self.algorithm !== algorithm) {
        self.algorithm = algorithm;
        self.solve();
      }
    };

    self.setMaximize = function(maximize) {
      if (self.maximize !== maximize) {
        self.maximize = maximize;
        self.tree.maximize = maximize;
        self.tree.update();
        if (!self.editMode) {
          self.solve();
        }
      }
    };

    self.resetTree = function() {
      self.tree.reset();
    };

    self.generatePermalink = function() {
      var root = self.editMode ? self.tree.root : self.originalRoot;
      TreeEncoder.encode(root);
      self.shared = true;

      setTimeout(function() {
        self.$apply(function() {
          self.shared = false;
        });
      }, 5000);
    };

    TreeEncoder.apply(self.tree);
  });

  app.controller('EditNodeController', function($scope) {
    var self = $scope;

    self.addChild = function() {
      self.editingNode.value = false;
      self.tree.addNode('0', self.editingNode.id);
      self.editingNode.children++;
      self.tree.update();
    };

    self.removeNode = function() {
      var parent = self.tree.removeNode(self.editingNode.id);
      if (parent !== false) {
        self.selectNode(parent);
        self.tree.update();
      }
    };

    self.removeAllChildren = function() {
      self.tree.removeAllChildren(self.editingNode.id);
      self.editingNode.value = 0;
      self.editingNode.children = 0;
      self.tree.update();
    };

    self.canMoveLeft = function() {
      return self.editingNode.index > 0;
    };

    self.canMoveRight = function() {
      return self.editingNode.index < self.editingNode.parentChildren - 1;
    };

    self.moveLeft = function() {
      self.editingNode.index--;
      self.tree.moveLeft(self.editingNode.id);
      self.tree.update();
    };

    self.moveRight = function() {
      self.editingNode.index++;
      self.tree.moveRight(self.editingNode.id);
      self.tree.update();
    };

    self.selectNode = function(node) {
      var parent = self.tree.findParent(node.id), i;
      if (parent !== false) {
        for (i = 0; i < parent.children.length; i++) {
          if (parent.children[i].id === node.id) {
            self.editingNode.index = i;
            self.editingNode.parentChildren = parent.children.length;
            break;
          }
        }
      }

      self.tree.markSelected(self.editingNode.id, false);
      self.editingNode.id = node.id;
      self.editingNode.value = node.value !== false ? parseInt(node.value, 10) : false;
      self.editingNode.children = node.children ? node.children.length : 0;
      self.tree.markSelected(node.id, true);
      self.tree.update();

      setTimeout(function() {
        // timeout of 10 milliseconds because the edit_value field might be hidden
        // so focus and select do nothing
        var editField = window.edit_value;
        editField.focus();
        editField.select();
      }, 10);
    };

    function nodeClick(node) {
      if (!self.editMode) {
        return;
      }

      self.$apply(function() {
        self.selectNode(node);
      });
    }

    self.$watch('editingNode.value', function() {
      self.tree.setValue(self.editingNode.id, self.editingNode.value);
      self.tree.update();
    });

    self.tree.onNodeClick(nodeClick);
  });

  app.controller('PlaybackController', function($scope, Playback) {
    var self = $scope;

    self.playing = false;
    self.speed = 500;

    function animate() {
      self.$apply(function() {
        if (self.playing) {
          if (self.editMode) {
            self.playing = false;
            return;
          }

          Playback.advance();
          self.tree.update();

          if (!Playback.atEnd()) {
            setTimeout(animate, self.speed);
          }
          else {
            self.playing = false;
          }
        }
      });
    }

    self.atEnd = function() {
      return Playback.atEnd();
    };

    self.atStart = function() {
      return Playback.atStart();
    };

    self.rewind = function() {
      self.playing = false;
      Playback.rewind();
      self.tree.update();
    };

    self.undo = function() {
      self.playing = false;
      Playback.undo();
      self.tree.update();
    };

    self.play = function() {
      if (Playback.atEnd()) {
        return;
      }

      self.playing = true;
      Playback.advance();
      self.tree.update();
      setTimeout(animate, self.speed);
    };

    self.pause = function() {
      self.playing = false;
    };

    self.advance = function() {
      self.playing = false;
      Playback.advance();
      self.tree.update();
    };

    self.fastforward = function() {
      self.playing = false;
      Playback.fastforward();
      self.tree.update();
    };

    self.setSpeed = function(speed) {
      self.speed = speed;
    };
  });
}(MinimaxApp));
