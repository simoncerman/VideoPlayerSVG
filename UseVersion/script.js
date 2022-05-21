class AnaliticVideoPlayer {
  /**
   * @param {JSON} dataSet
   */
  constructor(dataSet) {
    this.videoPlayer = document.getElementById("video-player");
    this.video = document.getElementById("main-video");

    this.settings ={
      secoundSvgOpacity : "0.5",
      mainStrokeOfCurveWidth: "0.75%",
      verticalLineStrokeWidth : "0.25%",
      outerCircleR : "1.5%",
      innerCircleR : "1%",
    }

    this.coverL;
    this.coverHolder;
    this.interval;

    this.strokePaths = [];
    this.legendTexts = [];    
    this.movingDots = [];

    //use pathGenerator.js
    this.pathHandler = new pathGenerator();

    //after loading metadata of video
    this.video.addEventListener("loadedmetadata", () => {
      this.vidWidth = this.video.offsetWidth;
      this.vidHeight = this.video.offsetHeight / 2;
      this.vidDuration = this.video.duration * 1000;
      this.afterLoad(dataSet);
    });
  }

  /**
   * Important for preparing all data and setting listeners before starting video
   * @param {*} dataSet
   */
  afterLoad(dataSet) {
    //creating default svgs
    let svgAfter = this.prepareSVG(this.vidWidth, this.vidHeight);
    let svgBefore = this.prepareSVG(this.vidWidth, this.vidHeight);
    svgAfter.id = "svgAfter";
    svgBefore.id = "svgBefore";

    //gradients
    let defs = this.prepareGradients(dataSet, false);
    svgAfter.appendChild(defs);
    let defs2 = this.prepareGradients(dataSet, true, dataSet.length);
    svgBefore.appendChild(defs2);

    svgAfter = this.prepareStrokesAndFill(svgAfter, dataSet);
    svgBefore = this.prepareStrokesAndFill(svgBefore, dataSet, true);

    this.svgBefore = svgBefore;
    this.prepareCover(svgAfter, svgBefore);

    //creates dots and moving line on top
    this.prepareOverlay(dataSet);
    this.prepareListeners();
  }

  prepareStrokesAndFill(svg, dataSet, svgBefore = false) {
    let strokes = [];
    let filled = [];
    dataSet.map((dataRow) => {
      let points = this.prepareData(
        dataRow.data,
        this.vidWidth,
        this.vidHeight
      );
      //stroke curve
      let strokePath = this.generateStroke(points, dataRow.color);
      if (svgBefore) {
        strokePath.setAttributeNS(null, "stroke", "gray");
        this.strokePaths.push(strokePath);
      }
      //fill curve
      let gradientID = dataSet.indexOf(dataRow);
      if (svgBefore) {
        gradientID += dataSet.length;
      }
      let fillPath = this.generateFill(
        points,
        dataRow.color,
        this.vidHeight,
        this.vidWidth,
        gradientID
      );
      strokes.push(strokePath);
      filled.push(fillPath);
    });
    //set strokes and filled areas into svg in correct order => stroke curves must be on top
    [...filled, ...strokes].forEach((element) => {
      svg.append(element);
    });
    if (svgBefore) svg.style.opacity = this.settings.secoundSvgOpacity;
    return svg;
  }

  /**
   * Return granide styles
   * @param {JSON} dataSet
   * @param {boolean} gray
   * @returns <defs>
   */
  prepareGradients(dataSet, gray = false, startingID = 0) {
    let defs = document.createElement("defs");
    for (let y = 0; y < dataSet.length; y++) {
      const dataRow = dataSet[y];
      let gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient"
      );
      let id = y + startingID;
      this.setMultipleAtributes(gradient, {
        id: "gradient" + id,
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
      });

      let stop1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      this.setMultipleAtributes(stop1, {
        offset: "0%",
        "stop-opacity": "80%",
      });
      if (gray) {
        stop1.setAttribute("stop-color", "gray");
      } else {
        stop1.setAttribute("stop-color", dataRow.color);
      }

      let stop2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      this.setMultipleAtributes(stop2, {
        offset: "100%",
        "stop-opacity": "0%",
      });
      if (gray) {
        stop2.setAttribute("stop-color", "gray");
      } else {
        stop2.setAttribute("stop-color", dataRow.color);
      }

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
    }
    return defs;
  }

  /**
   * Create svg element with specific w|h
   * @param {*} width
   * @param {*} height
   * @returns <svg>
   */
  prepareSVG(width, height) {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.setMultipleAtributes(svg, {
      viewBox: `0 0 ${width} ${height}`,
      version: "1.1",
      xmlns: "http://www.w3.org/2000/svg",
      height: "100%",
    });
    return svg;
  }

  /**
   * Recalculate data to points
   * @param {*} data
   * @param {*} vidWidth
   * @param {*} vidHeight
   */
  prepareData(data, vidWidth, vidHeight) {
    let points = [];
    for (let i = 0; i < data.length; i++) {
      points[i] = [
        i * (vidWidth / (data.length - 1)),
        ((100 - data[i]) / 100) * vidHeight,
      ];
    }
    return points;
  }

  /**
   * Prepare cover wich contains left and right
   * moving svgs and other important elements
   * @param {*} width
   * @param {*} height
   * @param {*} svgTo
   * @param {*} svgFrom
   */
  prepareCover(svgAfter, svgBefore) {
    let coverHolder = document.createElement("div");
    let coverL = document.createElement("div");
    let coverR = document.createElement("div");

    coverHolder.classList.add("coverHolder");
    coverL.classList.add("coverL");
    coverR.classList.add("coverR");

    coverHolder.appendChild(coverL);
    coverHolder.appendChild(coverR);
    coverL.appendChild(svgAfter);
    coverR.appendChild(svgBefore);

    this.coverL = coverL;
    this.coverR = coverR;

    coverHolder.style.display = "none";
    this.videoPlayer.appendChild(coverHolder);
    this.coverHolder = coverHolder;

    //fix dont remove important
    this.coverL.innerHTML = this.coverL.innerHTML + "";
    this.coverR.innerHTML = this.coverR.innerHTML + "";
  }
  /**
   * Function will pregenerate holder which contains dots and vertical line
   * @param {*} dataSet
   */
  prepareOverlay(dataSet) {
    let dotHolder = this.prepareSVG(this.vidWidth, this.vidHeight);
    dotHolder.classList.add("dotHolder");
    let dotMax = this.vidHeight;
    //dots
    let dots = dataSet.map((dataRow) => {
      if (((100 - dataRow.data[0]) / 100) * this.vidHeight < dotMax) {
        dotMax = ((100 - dataRow.data[0]) / 100) * this.vidHeight;
      }
      let dot = this.generateMovingGroup(
        dataRow.color,
        0,
        ((100 - dataRow.data[0]) / 100) * this.vidHeight,
        dataRow.legendText
      );
      return dot;
    });
    //line
    this.line = this.generateVerticalLine(dotMax);
    dotHolder.append(this.line);
    dots.map((dot) => {
      dotHolder.appendChild(dot);
    });
    this.coverHolder.appendChild(dotHolder);
    //button
    let btn = this.generateLegendButton();
    this.videoPlayer.appendChild(btn);
  }

  generateLegendButton() {
    let button = document.createElement("button");
    button.classList.add("buttonLegend");
    button.innerHTML = "Show legend";
    button.id = "showLegendBtn";
    button.style.visibility = "hidden";
    button.onclick = () => {
      this.legendTexts.map((legendText) => {
        if (legendText.style.visibility == "hidden") {
          legendText.style.visibility = "visible";
          button.innerHTML = "Hide legend";
        } else {
          legendText.style.visibility = "hidden";
          button.innerHTML = "Show legend";
        }
      });
    };
    return button;
  }

  generateVerticalLine(startingHeigth) {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.setMultipleAtributes(line, {
      x1: "0",
      y1: this.vidHeight,
      x2: "0",
      y2: startingHeigth,
      stroke: "white",
      "stroke-width": this.settings.verticalLineStrokeWidth,
    });
    return line;
  }
/**
 * Function responsible for generating dots on default position with specific color
 * @param {*} color 
 * @param {*} posX 
 * @param {*} posY 
 * @param {*} txt 
 * @returns 
 */
  generateMovingGroup(color, posX, posY, txt) {
    let circleGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    let outerCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    let innerCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    let legendText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

    this.setMultipleAtributes(outerCircle, {
      r: "1.5%",
      fill: "white",
    });
    this.setMultipleAtributes(innerCircle, {
      r: "1%",
      fill: color,
    });
    this.setMultipleAtributes(legendText, {
      "dominant-baseline": "middle",
      "text-anchor": "middle",
      y: "-7%",
      fill: color,
      "font-family": "Arial, Helvetica, sans-serif",
      "font-size":"larger"
    });

    legendText.innerHTML = txt;
    legendText.style.visibility = "hidden"; //default visibility
    this.legendTexts.push(legendText);

    circleGroup.setAttribute("transform", `translate(${posX},${posY})`);

    circleGroup.appendChild(outerCircle);
    circleGroup.appendChild(innerCircle);
    circleGroup.appendChild(legendText);

    this.movingDots.push(circleGroup);
    return circleGroup;
  }
  /**
   * Responsible for generating stroke curve
   * @param {*} points
   * @param {*} color
   * @returns
   */
  generateStroke(points, color) {
    let d = this.pathHandler.svgPath(points, color);
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.setMultipleAtributes(path, {
      "d": d,
      "stroke": color,
      "stroke-width":this.settings.mainStrokeOfCurveWidth,
      "fill": "none",
    })
    return path;
  }
  
  /**
   * Responsible for generating filled areas
   * @param {*} points
   * @param {*} color
   * @param {*} height
   * @param {*} widht
   * @param {*} gradientID
   * @returns
   */
  generateFill(points, color, height, widht, gradientID) {
    let d = this.pathHandler.svgPath(points, color, true);
    let newD = `M 0,${height}` + d + `L ${widht},${height} L 0,${height}`;

    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttributeNS(null, "d", newD);
    path.setAttributeNS(null, "stroke", "none");
    path.setAttributeNS(null, "fill", `url(#gradient${gradientID})`);
    return path;
  }

  /**
   * !This is magic script dont touch it
   * Responsible for calculating point y point from x and path
   * @param {*} path
   * @param {*} x
   * @returns y
   */
  findY(path, x) {
    var pathLength = path.getTotalLength();
    var start = 0;
    var end = pathLength;
    var target = (start + end) / 2;
    x = Math.max(x, path.getPointAtLength(0).x);
    x = Math.min(x, path.getPointAtLength(pathLength).x);
    while (target >= start && target <= pathLength) {
      var pos = path.getPointAtLength(target);
      if (Math.abs(pos.x - x) < 0.001) {
        return pos.y;
      } else if (pos.x > x) {
        end = target;
      } else {
        start = target;
      }
      target = (start + end) / 2;
    }
  }

  /**
   * Updating cover on percent
   * @param {*} percents
   */
  updateCover(percents) {
    //change of left cover widht
    this.coverL.style.width = 100 * (percents * 1000) + "%";
    //updating dots
    this.updateMovingGroup(percents);
  }

  /**
   * Updating moving group position by line pos
   * @param {*} percents 
   */
  updateMovingGroup(percents) {
    let maxDotPos = this.vidHeight;
    for (let i = 0; i < this.strokePaths.length; i++) {
      let path = this.strokePaths[i];
      let pos = {
        x: this.vidWidth * 1000 * percents,
        y: this.findY(path, this.vidWidth * 1000 * percents),
      };
      if (pos.y < maxDotPos) {
        maxDotPos = parseFloat(pos.y);
      }
      this.movingDots[i].setAttribute(
        "transform",
        `translate(${pos.x},${pos.y})`
      );
    }
    this.updateVerticalLine(percents, maxDotPos);
  }

  updateVerticalLine(percents, maxDotPos) {
    this.line.setAttribute("x1", this.vidWidth * percents * 1000);
    this.line.setAttribute("x2", this.vidWidth * percents * 1000);
    this.line.setAttribute("y1", this.vidHeight);
    this.line.setAttribute("y2", maxDotPos);
  }

  /**
   * Will prepare all listeners to video
   */
  prepareListeners() {
    this.video.addEventListener("play", () => {
      if (!this.firstPlay) {
        this.coverHolder.style.display = "block";
        this.firstPlay = true;
        document.getElementById("showLegendBtn").style.visibility = "visible";
      }
      this.interval = setInterval(() => {
        this.updateCover(this.video.currentTime / this.vidDuration);
      }, 10);
    });
    this.video.addEventListener("pause", () => {
      clearInterval(this.interval);
      this.updateCover(this.video.currentTime / this.vidDuration);
    });
    this.video.addEventListener("seeking", () => {
      this.updateCover(this.video.currentTime / this.vidDuration);
    });
  }
  
  /**
   *
   * @param {*} element
   * @param {*} atributes [{atributeName:atributeValue},...]
   */
  setMultipleAtributes(element, atributes) {
    let atributeNames = Object.keys(atributes);
    let atributeValues = Object.values(atributes);
    for (
      let atributeIndex = 0;
      atributeIndex < atributeNames.length;
      atributeIndex++
    ) {
      element.setAttribute(
        atributeNames[atributeIndex],
        atributeValues[atributeIndex]
      );
    }
    return element;
  }
}

let dataSet = [
  {
    color: "#1BE7FF",
    data: [70, 50, 80, 90, 68, 50, 59, 60, 49, 40, 30, 31, 28, 10],
    legendText: "Brand",
  },
  {
    color: "#13EFC9",
    data: [15, 21, 60, 40, 50, 30, 50, 20, 70, 30, 40, 60, 80, 90],
    legendText: "Need",
  },
  {
    color: "#D06BFF",
    data: [45, 40, 39, 55, 90, 74, 20, 20, 50, 49, 84, 20, 30, 21],
    legendText: "Emotion",
  }
];

let playerHandler = new AnaliticVideoPlayer(dataSet);
