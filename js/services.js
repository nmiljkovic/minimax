(function (app) {
  "use strict";
  /*global MinimaxApp,Tree,TreeD3*/

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
