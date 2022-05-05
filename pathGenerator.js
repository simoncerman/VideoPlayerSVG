class pathGenerator {
  constructor() {
    // The smoothing ratio
    this.smoothing = 0.2;
  }

  /**
   * Properties of a line
   * @param {*} pointA (array) [x,y] coordinates
   * @param {*} pointB (array) [x,y] coordinates
   * @returns
   */
  line(pointA, pointB) {
    const lengthX = pointB[0] - pointA[0];
    const lengthY = pointB[1] - pointA[1];
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  }

  /**
   * Position of a control point
   * @param {*} current (array) [x, y]: current point coordinates
   * @param {*} previous (array) [x, y]: previous point coordinates
   * @param {*} next (array) [x, y]: next point coordinates
   * @param {*} reverse (boolean, optional): sets the direction
   * @returns (array) [x,y]: a tuple of coordinates
   */
  controlPoint(current, previous, next, reverse) {
    // When 'current' is the first or last point of the array
    // 'previous' or 'next' don't exist.
    // Replace with 'current'
    const p = previous || current;
    const n = next || current;

    // Properties of the opposed-line
    const o = this.line(p, n);

    // If is end-control-point, add PI to the angle to go backward
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * this.smoothing;

    // The control point position is relative to the current point
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    return [x, y];
  }

  /**
   * Create the bezier curve command
   * @param {*} point (array) [x,y]: current point coordinates
   * @param {*} i (integer): index of 'point' in the array 'a'
   * @param {*} a (array): complete array of points coordinates
   * @returns (string) 'C x2,y2 x1,y1 x,y': SVG cubic bezier C command
   */
  bezierCommand(point, i, a) {
    // start control point
    const cps = this.controlPoint(a[i - 1], a[i - 2], point);

    // end control point
    const cpe = this.controlPoint(point, a[i - 1], a[i + 1], true);
    return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
  }

  /**
   * Create the svg <path> element
   * @param {*} points (array): points coordinates
   * @param {*} color string: color of stroke
   * @param {boolean} fill bool: True = fill | false = dont fill
   * @returns (string): a Svg <path> element
   */
  svgPath(points, color, fill = false) {
    // build the d attributes by looping over the points
    const d = points.reduce(
      (acc, point, i, a) =>
        i === 0
          ? fill
            ? ` L ${point[0]},${point[1]}`
            : ` M ${point[0]},${point[1]}`
          : `${acc} ${this.bezierCommand(point, i, a)}`,
      ""
    );

    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttributeNS(null, "d", d);
    path.setAttributeNS(null, "stroke", color);
    path.setAttributeNS(null, "stroke-width", 1);
    if (fill) {
      path.setAttributeNS(null, "fill", color);
      path.setAttributeNS(null, "fill-opacity", "0.40");
    } else {
      path.setAttributeNS(null, "fill", "none");
    }
    return path;
  }
}
