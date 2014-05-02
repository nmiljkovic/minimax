(function (app) {
  "use strict";
  /*global MinimaxApp,Tree,TreeD3*/

  app.service('TreeEncoder', function() {
    function encode(node, parent) {
      var i, newNode = {};
      if (node.value !== false) {
        newNode.v = parseInt(node.value, 10);
      }
      if (parent !== undefined) {
        if (!parent.c) {
          parent.c = [];
        }
        parent.c.push(newNode);
      }

      if (node.children) {
        for (i = 0; i < node.children.length; i++) {
          encode(node.children[i], newNode);
        }
      }

      return newNode;
    }

    function decode(node, parent, tree) {
      var newNode, i;

      var value = node.v !== undefined ? node.v : false;

      if (parent !== undefined) {
        newNode = tree.addNode(value, parent.id);
      }
      else {
        newNode = tree.root;
        newNode.value = value;
      }

      if (node.c) {
        for (i = 0; i < node.c.length; i++) {
          decode(node.c[i], newNode, tree);
        }
      }

      return newNode;
    }

    return {
      apply: function(tree) {
        var hash = document.location.hash;
        if (!/^#tree=.*$/.test(hash)) {
          return false;
        }

        tree.reset();
        var base64tree = decodeURIComponent(hash.substr(6));
        var jsonTree = window.atob(base64tree);
        var treeObject = JSON.parse(jsonTree);
        decode(treeObject, undefined, tree);
      },
      encode: function(root) {
        var object = encode(root);
        var jsonString = JSON.stringify(object);
        var base64tree = window.btoa(jsonString);
        var uriEncoded = encodeURIComponent(base64tree);
        window.location.hash = "#tree=" + uriEncoded;
        return uriEncoded;
      }
    };
  });

  app.service('Tree', function() {
    return {
      create: function(selector, size, margins) {
        var treed3 = new TreeD3(selector, size, margins);
        var tree = new Tree(treed3);
        return tree;
      }
    };
  });

  app.service('Playback', function() {
    return {
      currentStep: 0,
      steps: [],
      setSteps: function(steps) {
        this.steps = steps;
        this.currentStep = 0;
      },
      setTree: function(tree) {
        this.tree = tree;
      },
      atStart: function() {
        return this.currentStep <= 0;
      },
      atEnd: function() {
        return this.currentStep >= this.steps.length;
      },
      rewind: function() {
        while (!this.atStart()) {
          this.undo();
        }
      },
      undo: function() {
        if (!this.atStart()) {
          var step = --this.currentStep;
          this.steps[step].undo(this.tree);
        }
      },
      advance: function() {
        if (!this.atEnd()) {
          var step = this.currentStep++;
          this.steps[step].advance(this.tree);
        }
      },
      fastforward: function() {
        while (!this.atEnd()) {
          this.advance();
        }
      }
    };
  });
}(MinimaxApp));
