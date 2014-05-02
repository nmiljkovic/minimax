(function(app) {
  "use strict";

  function switchSelection(id, steps) {
    var lastSelection;
    steps.push({
      advance: function(tree) {
        lastSelection = tree.getSelectedId();
        tree.markSelected(lastSelection, false);
        tree.markSelected(id, true);
      },
      undo: function(tree) {
        tree.markSelected(id, false);
        tree.markSelected(lastSelection, true);
      }
    });
  }

  function showNode(id, steps) {
    steps.push({
      advance: function(tree) {
        tree.setVisible(id, true);
      },
      undo: function(tree) {
        tree.setVisible(id, false);
      }
    });
  }

  function showNodeAlphaBeta(id, a, b, children, steps) {
    steps.push({
      advance: function(tree) {
        tree.setVisible(id, true);

        if (children) {
          tree.setAB(id, a, b);
        }
      },
      undo: function(tree) {
        tree.setVisible(id, false);

        if (children) {
          tree.removeAB(id);
        }
      }
    });
  }

  function updateNode(id, value, a, b, steps) {
    var lastAB, lastValue, lastSelection;

    steps.push({
      advance: function(tree) {
        lastSelection = tree.getSelectedId();
        tree.markSelected(lastSelection, false);
        tree.markSelected(id, true);

        lastAB = tree.getAB(id);
        lastValue = tree.getValue(id);
        tree.setAB(id, a, b);
        tree.setValue(id, value);
      },
      undo: function(tree) {
        tree.markSelected(id, false);
        tree.markSelected(lastSelection, true);

        tree.setValue(id, lastValue);
        tree.setAB(id, lastAB.a, lastAB.b);
      }
    });
  }

  function markCutoff(nodeId, children, i, steps) {
    while (children.length !== i + 2) {
      children.pop();
    }

    // we have more children in this node, mark them visually as pruned
    var lastChild = children[i + 1];
    lastChild.value = false;
    lastChild.hidden = true;
    lastChild.cutoff = true;

    var lastSelection;
    steps.push({
      advance: function(tree) {
        lastSelection = tree.getSelectedId();
        tree.markSelected(lastSelection, false);
        tree.markSelected(nodeId, true);
        tree.setVisible(lastChild.id, true);
      },
      undo: function(tree) {
        tree.markSelected(nodeId, false);
        tree.markSelected(lastSelection, true);
        tree.setVisible(lastChild.id, false);
      }
    });
  }

  app.service('Minimax', function() {
    function minimax(node, maximize, steps) {
      if (!node.children || node.children.length === 0) {
        return parseInt(node.value, 10);
      }

      var child, i, best, minimaxValue;

      switchSelection(node.id, steps);

      best = maximize ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

      for (i = 0; i < node.children.length; i++) {
        child = node.children[i];

        showNode(child.id, steps);

        minimaxValue = minimax(child, !maximize, steps);

        if (maximize) {
          best = Math.max(best, minimaxValue);
        }
        else {
          best = Math.min(best, minimaxValue);
        }
      }

      updateNode(node.id, best, undefined, undefined, steps);

      return best;
    }

    return {
      calculate: function(root, maximize) {
        var steps = [];
        minimax(root, maximize, steps);
        return steps;
      }
    };
  });

  app.service('MinimaxAB', function() {
    function minimax(node, a, b, maximize, steps) {
      var i, child, minimaxResult, newNodeValue, value, cutoff = false;

      if (!node.children || node.children.length === 0) {
        value = parseInt(node.value, 10);
        return {
          result: value,
          newValue: value
        };
      }

      switchSelection(node.id, steps);

      if (maximize) {
        newNodeValue = Number.NEGATIVE_INFINITY;
      }
      else {
        newNodeValue = Number.POSITIVE_INFINITY;
      }

      for (i = 0; i < node.children.length; i++) {
        child = node.children[i];

        showNodeAlphaBeta(child.id, a, b, child.children, steps);

        minimaxResult = minimax(child, a, b, !maximize, steps);
        if (maximize) {
          a = Math.max(a, minimaxResult.result);
          newNodeValue = Math.max(newNodeValue, minimaxResult.newValue);
        }
        else {
          b = Math.min(b, minimaxResult.result);
          newNodeValue = Math.min(newNodeValue, minimaxResult.newValue);
        }

        if (b <= a) {
          // cutoff
          if (i < node.children.length - 1) {
            cutoff = true;
          }
          break;
        }
      }

      value = maximize ? a : b;

      updateNode(node.id, newNodeValue, a, b, steps);

      if (cutoff) {
        markCutoff(node.id, node.children, i, steps);
      }

      return {
        result: value,
        newValue: newNodeValue
      };
    }

    return {
      calculate: function(root, maximize) {
        var steps = [];
        minimax(root, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, maximize, steps);
        return steps;
      }
    };
  });

  app.service('Algorithms', function(Minimax, MinimaxAB) {
    return {
      get: function(algorithm) {
        if (algorithm === 'minimax') {
          return Minimax;
        }
        if (algorithm === 'minimaxab') {
          return MinimaxAB;
        }

        throw "No algorithm found for `" + algorithm + "`";
      }
    };
  });

}(window.MinimaxApp));
