(function () {
  'use strict';
  /*global d3,_*/

  /**
   * Returns a translation css property from x and y coordinates
   * @param {number} x
   * @param {number} y
   */
  function cssTranslate(x, y) {
    return 'translate(' + x + ', ' + y + ')';
  }

  /**
   *
   * @param clazz
   * @param on
   * @returns {Function}
   */
  function classed(clazz, on) {
    return function () {
      d3.select(this).classed(clazz, on);
    };
  }

  /**
   * Constructs a d3.layout.tree and contains methods for manipulating/drawing the data
   * @param {string} selector - css selector for the svg element
   * @param {{x: number, y: number}} size - an object containing width and height properties
   * @param {{left: number, top: number, right: number, bottom: number}} [margin] - an object containing top, right, bottom and left properties (defaults to 0 margin)
   * @constructor
   */
  function TreeD3(selector, size, margin) {
    var self = this;

    if (margin === undefined) {
      // default margins to 0
      margin = {
        left: 0, top: 0, right: 0, bottom: 0
      };
    }

    /**
     * Node circle radius
     * @type {number}
     */
    var radius = 15;

    /**
     * The y difference in pixels between two levels of nodes
     * @type {number}
     */
    var ySeparation = 100;

    /**
     * On click callback
     * @type {function}
     */
    var clickCallback = null;

    /**
     * Animation delay in milliseconds
     * @type {number}
     */
    var animationDuration = 250;

    /**
     * Offset of the text value
     * @type {string}
     */
    var textYOffset = ".35em";

    var tree = d3.layout.tree()
      .size([size.width, size.height]);

    var svgWidth = size.width + margin.left + margin.right,
      svgHeight = size.height + margin.top + margin.bottom,
      svg;

    var zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 1.3])
      .on("zoom", function() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      });

    zoom.translate([margin.left, margin.top]);

    svg = d3.select(selector)
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .call(zoom)
      .append("g")
      .attr("class", "tree-container")
      .attr("transform", cssTranslate(margin.left, margin.top));

    var notifyClick = function (event) {
      if (clickCallback) {
        clickCallback(event);
      }
    };

    function setLinePosition(line) {
      line
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          if (d.target.cutoff) {
            return d.target.x - (d.target.x - d.source.x) / 2;
          }
          return d.target.x;
        })
        .attr("y2", function (d) {
          if (d.target.cutoff) {
            return d.target.y - (d.target.y - d.source.y) / 2;
          }
          return d.target.y;
        });
    }

    function calculateLineAngle(x1, x2, y1, y2) {
      var dy = y2 - y1;
      var dx = x2 - x1;
      var theta = Math.atan2(dy, dx);
      return theta;
    }

    function setLineCutoffPosition(line) {
      line
        .attr("x1", function (d) {
          var x1 = d.target.x - (d.target.x - d.source.x) / 2 - 5;
          return x1;
        })
        .attr("y1", function (d) {
          var y1 = d.target.y - (d.target.y - d.source.y) / 2;

          var angle = calculateLineAngle(d.source.x, d.target.x, d.source.y, d.target.y);
          var diff = Math.tan(angle - Math.PI / 2) * 5;
          return y1 - diff;
        })
        .attr("x2", function (d) {
          var x2 = d.target.x - (d.target.x - d.source.x) / 2 + 5;
          return x2;
        })
        .attr("y2", function (d) {
          var y2 = d.target.y - (d.target.y - d.source.y) / 2;

          var angle = calculateLineAngle(d.source.x, d.target.x, d.source.y, d.target.y);
          var diff = Math.tan(angle - Math.PI / 2) * 5;
          return y2 + diff;
        });
    }

    function enterNodes(node) {
      // Enter the nodes.
      var nodes = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
          return cssTranslate(d.x, d.y);
        })
        .on('click', notifyClick)
        .on("mouseover", classed("hover", true))
        .on("mouseout", classed("hover", false))
        .style('opacity', 0);

      nodes.append("circle")
        .attr("r", radius);

      nodes.append("text")
        .attr("class", "node-value")
        .attr("x", 0)
        .attr("y", textYOffset)
        .attr("text-anchor", "middle");

      nodes.append("text")
        .attr("class", "node-ab")
        .attr("x", radius + 5)
        .attr("y", textYOffset);
    }

    function updateNodes(node) {
      node
        .classed("selected", function(d) {
          return d.selected === true;
        })
        .transition().duration(animationDuration)
        .style('opacity', function(d) {
          if (d.hidden || d.cutoff) {
            return 0;
          }
          return 1;
        })
        .attr("transform", function (d) {
          return cssTranslate(d.x, d.y);
        });

      node.select("text.node-value").text(function(d) {
        if (d.value === false) {
          return '';
        }
        return d.value;
      });

      // IE fallback - it doesn't support .html
      node.select("text.node-ab").text(function(d) {
        if (d.a === undefined || d.b === undefined) {
          return '';
        }
        var a = d.a.toString(), b = d.b.toString();
        return "[" + a + ", " + b + "]";
      });

      node.select("text.node-ab").html(function(d) {
        if (d.a === undefined || d.b === undefined) {
          return '';
        }
        var a = d.a.toString(), b = d.b.toString();
        if (a === "-Infinity") {
          a = "-&infin;";
        }
        if (b === "Infinity") {
          b = "&infin;";
        }
        return "[" + a + ", " + b + "]";
      });
    }

    function exitNodes(node) {
      node.exit()
        .transition().duration(animationDuration)
        .style('opacity', 0)
        .remove();
    }

    function enterLinks(link, linkCutoffs) {
      // Enter the links.
      var line = link.enter().insert("line", "g")
        .attr("class", "link")
        .style("opacity", 0);

      var lineCutoffs = linkCutoffs.enter().insert("line", "g")
        .attr("class", "link-cutoff")
        .style("opacity", 0);

      setLinePosition(line);
      setLineCutoffPosition(lineCutoffs);
    }

    function updateLinks(link, linkCutoffs) {
      var line = link
        .transition().duration(animationDuration)
        .style("opacity", function(d) {
          return d.target.hidden ? 0 : 1;
        });

      setLinePosition(line);

      var lineCutoffs = linkCutoffs
        .transition().duration(animationDuration)
        .style("opacity", function(d) {
          return !d.target.hidden && d.target.cutoff ? 1 : 0;
        });

      setLineCutoffPosition(lineCutoffs);
    }

    function exitLinks(link, linkCutoffs) {
      link.exit().transition().duration(animationDuration).style("opacity", 0).remove();
      linkCutoffs.exit().transition().duration(animationDuration).style("opacity", 0).remove();
    }

    /**
     *
     */
    self.resetPanAndZoom = function() {
      zoom.translate([margin.left, margin.top]);
      zoom.scale(1);
      svg.attr("transform", cssTranslate(margin.left, margin.top));
    };

    /**
     * Redraws the tree
     * @param _root - Tree root node
     */
    self.update = function (_root, maximize) {
      var root = _(_root).clone();

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

      // Normalize for fixed-depth.
      var maxDepth = 0;
      nodes.forEach(function (d) {
        d.y = d.depth * ySeparation + 50;
        maxDepth = Math.max(maxDepth, d.depth);
      });

      // Declare the nodes…
      var node = svg.selectAll("g.node")
        .data(nodes, function (d) {
          if (d.id === undefined) {
            throw "Each node must have a unique id!";
          }
          return d.id;
        });

      enterNodes(node);
      updateNodes(node);
      exitNodes(node);

      // Declare the links…
      var link = svg.selectAll("line.link")
        .data(links, function (d) {
          return d.target.id;
        });

      var linkCutoffs = svg.selectAll("line.link-cutoff")
        .data(links, function(d) {
          return d.target.id;
        });

      enterLinks(link, linkCutoffs);
      updateLinks(link, linkCutoffs);
      exitLinks(link, linkCutoffs);

      var minimax = [], i, text;

      if (maximize) {
        text = ["MAX", "MIN"];
      }
      else {
        text = ["MIN", "MAX"];
      }

      for (i = 0; i < maxDepth; i++) {
        minimax.push({
          index: i,
          text: text[i % 2]
        });
      }

      var minimaxLines = svg.selectAll("line.minimax-boundary-line")
        .data(minimax);

      minimaxLines.enter().insert("line", "g").attr("class", "minimax-boundary-line")
        .attr("x1", function(d) { return -margin.left / 4; })
        .attr("x2", function(d) { return svgWidth - margin.left; })
        .attr("y1", function(d) { return (d.index + 1) * ySeparation; })
        .attr("y2", function(d) { return (d.index + 1) * ySeparation; })
        .attr("stroke-dasharray", "10,10");

      minimaxLines.exit().remove();

      var minimaxText = svg.selectAll("text.minimax")
        .data(minimax);

      minimaxText.enter().insert("text", "g")
        .attr("class", "minimax")
        .attr("x", function(d) {
          return -margin.left / 4;
        })
        .attr("y", function(d) {
          return d.index * ySeparation + ySeparation / 2;
        });

      minimaxText.text(function(d) {
        return d.text;
      });

      minimaxText.exit().remove();
    };

    self.setRadius = function ($radius) {
      radius = $radius;
    };

    self.getRadius = function () {
      return radius;
    };

    self.setYSeparation = function ($ySeparation) {
      ySeparation = $ySeparation;
    };

    self.getYSeparation = function () {
      return ySeparation;
    };

    self.setAnimationDuration = function ($animationDuration) {
      animationDuration = $animationDuration;
    };

    self.getAnimationDuration = function () {
      return animationDuration;
    };

    self.setTextYOffset = function ($textYOffset) {
      textYOffset = $textYOffset;
    };

    self.getTextYOffset = function () {
      return textYOffset;
    };

    self.onClick = function (callback) {
      clickCallback = callback;
    };
  }

  window.TreeD3 = TreeD3;
}());
