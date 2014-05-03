(function (app) {
  "use strict";
  /*global MinimaxApp,Tree,TreeD3*/

  app.service('TreeEncoder', function() {
    function encode(node) {
      if (node.value !== false) {
        return node.value.toString();
      }

      var result = "(", i;

      for (i = 0; i < node.children.length; i++) {
        result += encode(node.children[i]);
        if (i !== node.children.length - 1) {
          result += ",";
        }
      }

      result += ")";
      return result;
    }

    function number(string, tree, cursor, parent) {
      var breaks = [',', ')'], formedNumber = '', token;

      while (true) {
        if (cursor.i >= string.length) {
          break;
        }

        token = string.charAt(cursor.i);
        if (breaks.indexOf(token) !== -1) {
          break;
        }

        formedNumber += token;
        cursor.i++;
      }

      tree.addNode(parseInt(formedNumber, 10), parent.id);
    }

    function list(string, tree, cursor, parent) {
      var node, token;

      if (parent === undefined) {
        node = tree.root;
        node.value = false;
      }
      else {
        node = tree.addNode(false, parent.id);
      }

      while (true) {
        if (cursor.i >= string.length) {
          break;
        }

        token = string.charAt(cursor.i);
        if (token === ')') {
          break;
        }

        if (token === '(') {
          cursor.i++;
          list(string, tree, cursor, node);
        }
        else if (token === ',') {
          cursor.i++;
        }
        else {
          number(string, tree, cursor, node);
        }
      }
      cursor.i++;
    }

    function decode(string, tree) {
      var cursor = {
        i: 1
      };
      list(string, tree, cursor);
    }

    return {
      apply: function(tree) {
        var hash = document.location.hash;
        if (!/^#tree=.*$/.test(hash)) {
          return false;
        }

        tree.reset();
        var base64tree = decodeURIComponent(hash.substr(6));
        var treeString = window.atob(base64tree);
        decode(treeString, tree);
      },
      encode: function(root) {
        var encoded = encode(root);
        var base64tree = window.btoa(encoded);
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
