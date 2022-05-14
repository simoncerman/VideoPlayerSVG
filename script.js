class AnaliticVideoPlayer {
  /**
   * @param {JSON} dataSet
   */
  constructor(dataSet) {
    //load videoPlayer (works like holder for all elements)
    this.videoPlayer = document.getElementById("video-player");
    this.video = document.getElementById("main-video");

    //for editing width and moving curve
    this.coverL;
    this.coverHolder;

    //for time handling
    this.interval;

    this.strokePaths = [];


    //use pathGenerator.js
    this.pathHandler = new pathGenerator();

    //dots moving in time
    this.dataDots = [];

    //after loading metadata of video
    this.video.addEventListener("loadedmetadata", () => {
      this.vidWidth = this.video.videoWidth;
      this.vidHeight = this.video.videoHeight / 2;
      this.vidDuration = this.video.duration * 1000;
      this.afterLoad(dataSet);
    });
  }

  afterLoad(dataSet) {
    let svgAfter = this.prepareSVG(this.vidWidth, this.vidHeight);
    let svgBefore = this.prepareSVG(this.vidWidth, this.vidHeight);
    svgBefore.id = "svgBefore";

    let defs = this.prepareGradients(dataSet, false, 0);
    svgAfter.appendChild(defs);

    let defs2 = this.prepareGradients(dataSet, true, dataSet.length);
    svgBefore.appendChild(defs2);

    [svgAfter, svgBefore].forEach((svg) => {
      let strokes = [];
      let filled = [];
      dataSet.map((dataRow) => {
        let points = this.prepareData(
          dataRow.data,
          this.vidWidth,
          this.vidHeight
        );
        let strokePath = this.generateStroke(points, dataRow.color);
        if (svg == svgBefore) {
          strokePath.setAttributeNS(null, "stroke", "gray");
          this.strokePaths.push(strokePath);
        }
        let gradientID = dataSet.indexOf(dataRow);
        if (svg == svgBefore) {
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
      [...filled,...strokes].forEach((element) => {
        svg.append(element);
      });
      svgBefore.style.opacity = "0.5";
    });
    this.svgBefore = svgBefore;
    this.prepareCover(this.vidWidth, this.vidHeight, svgAfter, svgBefore);
    
    //creates dots and moving line on top
    this.prepareOverlay(dataSet);
    this.prepareListeners();
  }

  /**
   * Return granide styles
   * @param {JSON} dataSet
   * @param {boolean} gray
   * @returns <defs>
   */
  prepareGradients(dataSet, gray = false, startingID) {
    let defs = document.createElement("defs");
    for (let y = 0; y < dataSet.length; y++) {
      const dataRow = dataSet[y];
      let gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient"
      );
      let id = y + startingID;
      gradient.setAttributeNS(null, "id", "gradient" + id);
      gradient.setAttributeNS(null, "x1", "0%");
      gradient.setAttributeNS(null, "y1", "0%");
      gradient.setAttributeNS(null, "x2", "0%");
      gradient.setAttributeNS(null, "y2", "100%");

      let stop1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop1.setAttributeNS(null, "offset", "0%");
      if (gray) {
        stop1.setAttributeNS(null, "stop-color", "gray");
      } else {
        stop1.setAttributeNS(null, "stop-color", dataRow.color);
      }
      stop1.setAttributeNS(null, "stop-opacity", "90%");

      let stop2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop2.setAttributeNS(null, "offset", "100%");
      stop2.setAttributeNS(null, "stop-opacity", "0%");
      if (gray) {
        stop2.setAttributeNS(null, "stop-color", "gray");
      } else {
        stop2.setAttributeNS(null, "stop-color", dataRow.color);
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
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    return svg;
  }

  /**
   * Recalculate data to points
   * @param {*} data 
   * @param {*} vidWidth 
   * @param {*} vidHeight 
   * @returns 
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
  prepareCover(width, height, svgAfter, svgBefore) {
    let coverHolder = document.createElement("div");
    let coverL = document.createElement("div");
    let coverR = document.createElement("div");
    coverHolder.appendChild(coverL);
    coverHolder.appendChild(coverR);

    coverHolder.style.width = width + "px";
    coverHolder.style.height = height + "px";
    coverHolder.style.padding = this.padding + "px";
    coverHolder.classList.add("coverHolder");

    coverL.style.width = "0px";
    coverL.style.overflow = "hidden";
    coverL.style.float = "left";
    coverL.appendChild(svgAfter);
    coverR.style.pointerEvents = "none";
    coverR.style.overflow = "hidden";

    coverR.appendChild(svgBefore);

    this.coverL = coverL;
    this.coverR = coverR;
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
  prepareOverlay(dataSet){
    let dotHolder = this.prepareSVG(this.vidWidth, this.vidHeight);
    dotHolder.classList.add("dotHolder");
    let dotMax = this.vidHeight;
    //dots
    let dots = dataSet.map((dataRow)=>{
      if(((100-dataRow.data[0])/100)*this.vidHeight<dotMax){
        dotMax = ((100-dataRow.data[0])/100)*this.vidHeight
      }
      let dot = this.generateDot(dataRow.color,0,((100-dataRow.data[0])/100)*this.vidHeight);
      return dot;
    })
    //line
    this.line = this.generateVerticalLine(dotMax);
    dotHolder.append(this.line);
    dots.map((dot)=>{
      dotHolder.appendChild(dot);
    })
    this.coverHolder.appendChild(dotHolder);
  }

  generateVerticalLine(startingHeigth){
    let line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1","0");
    line.setAttribute("y1",this.vidHeight);
    line.setAttribute("x2","0");
    line.setAttribute("y2",startingHeigth);
    line.setAttribute("stroke","white");
    line.setAttribute("stroke-width","2")
    line.setAttribute("stroke-dasharray", "3")
    return line;
  }

  /**
   * Function responsible for generating dots on default position with specific color
   * @param {*} color 
   * @param {*} posX 
   * @param {*} posY 
   * @returns 
   */
  generateDot(color, posX, posY){
    let circleGroup = document.createElementNS("http://www.w3.org/2000/svg","g");

    let outerCircle = document.createElementNS("http://www.w3.org/2000/svg","circle");
    outerCircle.setAttribute("r","9");
    outerCircle.setAttribute("fill", "white");
    circleGroup.appendChild(outerCircle);

    let innerCircle = document.createElementNS("http://www.w3.org/2000/svg","circle");
    innerCircle.setAttribute("r","6");
    innerCircle.setAttribute("fill", color);
    circleGroup.appendChild(innerCircle);

    circleGroup.setAttribute("transform", `translate(${posX},${posY})`);
    this.dataDots.push(circleGroup);
    return circleGroup;
  }

  /**
   * Responsible for calculating point y point from x and path
   * @param {*} path 
   * @param {*} x 
   * @returns 
   */
  findY(path, x) {
    var pathLength = path.getTotalLength()
    var start = 0
    var end = pathLength
    var target = (start + end) / 2
  
    // Ensure that x is within the range of the path
    x = Math.max(x, path.getPointAtLength(0).x)
    x = Math.min(x, path.getPointAtLength(pathLength).x)
  
    // Walk along the path using binary search 
    // to locate the point with the supplied x value
    while (target >= start && target <= pathLength) {
      var pos = path.getPointAtLength(target)
  
      // use a threshold instead of strict equality 
      // to handle javascript floating point precision
      if (Math.abs(pos.x - x) < 0.001) {
        return pos.y
      } else if (pos.x > x) {
        end = target
      } else {
        start = target
      }
      target = (start + end) / 2
    }
  }

  updateDots(percents){
    let maxDotPos = this.vidHeight;
    for (let i = 0; i < this.strokePaths.length; i++) {
      let path = this.strokePaths[i];
      let pos = {x:this.vidWidth*1000*percents,y:this.findY(path,this.vidWidth*1000*percents)};
      if(pos.y<maxDotPos){
        maxDotPos = parseFloat(pos.y);
      }
      this.dataDots[i].setAttribute("transform", `translate(${pos.x},${pos.y})`)
    }
    this.updateVerticalLine(percents, maxDotPos);
  }

  updateVerticalLine(percents, maxDotPos){
    this.line.setAttribute("x1",this.vidWidth*percents*1000);
    this.line.setAttribute("x2",this.vidWidth*percents*1000);
    this.line.setAttribute("y1",this.vidHeight);
    this.line.setAttribute("y2", maxDotPos);
  }
  /**
   * Will prepare all listeners to video
   */
  prepareListeners() {
    this.video.addEventListener("play", () => {
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
   * Updating cover on percent
   * @param {*} percents 
   */
  updateCover(percents) {
    //change of left cover widht
    this.coverL.style.width = this.vidWidth * (percents * 1000) + "px";
    //move viewbox data
    document
      .getElementById("svgBefore")
      .setAttribute(
        "viewBox",
        `${this.vidWidth * (percents * 1000)} 0 ${this.vidWidth} ${
          this.vidHeight
        }`
      );
    //updating dots
    this.updateDots(percents);
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
    path.setAttributeNS(null, "d", d);
    path.setAttributeNS(null, "stroke", color);
    path.setAttributeNS(null, "stroke-width", 4);
    path.setAttributeNS(null, "fill", "none");
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
}

let dataSet = [
  {
    color: "#1BE7FF",
    data: [70, 50, 76, 90, 68, 50, 59, 60, 49, 40, 30, 31, 28, 10],
  },
  {
    color: "#33B864",
    data: [15, 21, 60, 40, 50, 30, 50, 20, 70, 30, 40, 60, 80, 90],
  },
];

let playerHandler = new AnaliticVideoPlayer(dataSet);
