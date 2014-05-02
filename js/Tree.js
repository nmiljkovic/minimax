(function() {
  "use strict";
  /*globals _*/

  var Tree = function(treed3) {
    var self = this;

    self.root = {
      id: 0
    };

    self.tree = treed3;
    self.maximize = true;

    self.reset = function() {
      self.root = {
        id: 1,
        value: '0'
      };
      self.autoIncrementId = 1;
      self.update();
    };

    self.update = function() {
      self.tree.update(self.root);
    };

    self.reset();

    self.addNode = function(value, parentId, id) {
      var parent = self.find(parentId);
      if (parent === false) {
        return null;
      }
      if (!parent.children) {
        parent.children = [];
      }
      if (id === undefined) {
        id = ++self.autoIncrementId;
      }
      var child = {
        id: id,
        value: value
      };
      parent.children.push(child);
      return child;
    };

    self.removeNode = function(id) {
      var parent = self.findParent(id), i, child;
      if (parent === false || !parent.children) {
        return false;
      }
      for (i = 0; i < parent.children.length; i++) {
        child = parent.children[i];
        if (child.id === id) {
          parent.children.splice(i, 1);
          break;
        }
      }
      return parent;
    };

    self.removeAllChildren = function(id) {
      var node = self.find(id);
      if (node === false) {
        return;
      }
      node.children = [];
    };

    self.setVisible = function(id, visible) {
      var node = self.find(id);
      if (node === false) {
        return;
      }
      node.hidden = !visible;
    };

    self.hideAllNodes = function() {
      var nodes = [self.root], i, node;
      while (nodes.length) {
        node = nodes.pop();
        node.hidden = true;

        if (!node.children) {
          continue;
        }

        for (i = 0; i < node.children.length; i++) {
          nodes.push(node.children[i]);
        }
      }
    };

    self.setAB = function(id, a, b) {
      var node = self.find(id);
      if (node === false) {
        return;
      }
      node.a = a;
      node.b = b;
    };

    self.getAB = function(id) {
      var node = self.find(id);
      if (node === false) {
        return { a: 0, b: 0 };
      }
      return {
        a: node.a,
        b: node.b
      };
    };

    self.setValue = function(id, value) {
      var node = self.find(id);
      if (node === false) {
        return;
      }
      node.value = value;
    };

    self.getValue = function(id) {
      var node = self.find(id);
      if (node === false) {
        return '';
      }
      return node.value;
    };

    self.removeAB = function(id) {
      var node = self.find(id);
      if (node === false) {
        return;
      }
      delete node.a;
      delete node.b;
    };

    /**
     * Redraws the tree
     */
    self.update = function() {
      self.tree.update(self.root, self.maximize);
    };

    self.findParent = function(id) {
      var i, child, node, list;
      list = [self.root];

      while (list.length) {
        node = list.pop();

        if (!node.children) {
          continue;
        }

        for (i = 0; i < node.children.length; i++) {
          child = node.children[i];
          list.push(child);
          if (child.id === id) {
            return node;
          }
        }
      }

      return false;
    };

    self.find = function(id) {
      var i, child, node, list;
      list = [self.root];

      while (list.length) {
        node = list.pop();

        if (node.id === id) {
          return node;
        }

        if (!node.children) {
          continue;
        }

        for (i = 0; i < node.children.length; i++) {
          child = node.children[i];
          list.push(child);
        }
      }

      return false;
    };

    self.moveLeft = function(id) {
      var parent = self.findParent(id), i, child;

      for (i = 0; i < parent.children.length; i++) {
        child = parent.children[i];
        if (child.id === id) {
          parent.children.splice(i, 1);
          parent.children.splice(i - 1, 0, child);
          break;
        }
      }
    };

    self.moveRight = function(id) {
      var parent = self.findParent(id), i, child;

      for (i = 0; i < parent.children.length; i++) {
        child = parent.children[i];
        if (child.id === id) {
          parent.children.splice(i, 1);
          parent.children.splice(i + 1, 0, child);
          break;
        }
      }
    };

    self.markSelected = function(id, selected) {
      var node = self.find(id);
      if (node === false) {
        return;
      }
      node.selected = selected;
    };

    self.getSelectedId = function() {
      var list = [], i;
      list.push(self.root);

      while (list.length) {
        var node = list.pop();

        if (node.selected === true) {
          return node.id;
        }

        if (!node.children) {
          continue;
        }

        for (i = 0; i < node.children.length; i++) {
          list.push(node.children[i]);
        }
      }

      return null;
    };

    self.removeSelections = function() {
      var list = [], i;
      list.push(self.root);

      while (list.length) {
        var node = list.pop();
        node.selected = false;

        if (!node.children) {
          continue;
        }

        for (i = 0; i < node.children.length; i++) {
          list.push(node.children[i]);
        }
      }
    };

    self.onNodeClick = function(callback) {
      self.tree.onClick(callback);
    };
  };

  window.Tree = Tree;
}());
