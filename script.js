class AnaliticVideoPlayer {
  constructor(dataSet, padding, lineStyles, fill = false) {
    //load videoPlayer (works like holder for all elements)
    this.videoPlayer = document.getElementById("video-player");
    this.video = document.getElementById("main-video");

    //for editing width and moving curve
    this.coverL;

    this.padding = padding;

    //for time handling
    this.interval;

    //use pathGenerator.js
    this.pathHandler = new pathGenerator();


    //after loading metadata of video
    this.video.addEventListener("loadedmetadata", () => {
      this.vidWidth = this.video.videoWidth;
      this.vidHeight = this.video.videoHeight;
      this.vidDuration = this.video.duration * 1000;
      this.afterLoad(dataSet, lineStyles, fill);
    });
  }

  afterLoad(dataSet, lineStyles, fill) {

    let svgAfter = this.prepareSVG(this.vidWidth, this.vidHeight);
    let svgBefore = this.prepareSVG(this.vidWidth, this.vidHeight);

    let defs = document.createElement("defs");
    let gradient = document.createElementNS("http://www.w3.org/2000/svg","linearGradient");
    gradient.setAttribute("id","Gradient1");
    let stop = document.createElementNS("http://www.w3.org/2000/svg","stop");
    stop.setAttribute("offset","0%");
    stop.setAttribute("stop-color","red");
    let stop2 = document.createElementNS("http://www.w3.org/2000/svg","stop");
    stop2.setAttribute("offset","100%");
    stop2.setAttribute("stop-color","white");
    stop2.setAttribute("stop-opacity","0");
    gradient.appendChild(stop);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    console.log(defs);
    svgAfter.appendChild(defs);
    

    //svg after
    dataSet.map((dataRow) => {
      let points = this.prepareData(
        dataRow.data,
        this.vidWidth,
        this.vidHeight
      );

      //generate full curves
      let strokePath = this.generateStroke(points, dataRow.color);
      let fillPath = this.generateFill(points,dataRow.color,this.vidHeight, this.vidWidth);

      svgAfter.appendChild(strokePath);
      svgAfter.appendChild(fillPath);
    });

    //svg before
    dataSet.map((dataRow) => {
      let points = this.prepareData(
        dataRow.data,
        this.vidWidth,
        this.vidHeight
      );
      let strokePath = this.generateStroke(points, dataRow.color);
      let fillPath = this.generateFill(points,"grey",this.vidHeight, this.vidWidth);

      svgBefore.appendChild(strokePath);
    });
    this.svgBefore = svgBefore;
    this.prepareCover(this.vidWidth, this.vidHeight, svgAfter, svgBefore);
    this.prepareListeners();
  }

  prepareSVG(width, height) {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute(
      "viewBox",
      `0 0 ${width - this.padding * 2} ${height - this.padding * 2}`
    );
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", width - this.padding * 2);
    svg.setAttribute("height", height - this.padding * 2);
    return svg;
  }

  prepareData(data, vidWidth, vidHeight) {
    let points = [];
    for (let i = 0; i < data.length; i++) {
      points[i] = [
        i * ((vidWidth - this.padding * 2) / (data.length - 1)),
        ((100 - data[i]) / 100) * (vidHeight - this.padding * 2),
      ];
    }
    return points;
  }

  prepareCover(width, height, svgTo, svgFrom) {
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
    if (svgTo != undefined) {
      coverL.appendChild(svgTo);
    }
    coverR.style.pointerEvents = "none";
    coverR.style.overflow = "hidden";

    if (svgFrom != undefined) {
      coverR.appendChild(svgFrom);
    }

    this.coverL = coverL;
    this.videoPlayer.appendChild(coverHolder);
  }
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
  updateCover(percents) {
    //change of left cover widht
    this.coverL.style.width =
      (this.vidWidth - this.padding * 2) * (percents * 1000) + "px";
    //move viewbox data
    this.svgBefore.setAttribute(
      "viewBox",
      `${(this.vidWidth - this.padding * 2) * (percents * 1000)} 0 ${
        this.vidWidth - this.padding * 2
      } ${this.vidHeight - this.padding * 2}`
    );
  }
  generateStroke(points,color){
    let d = this.pathHandler.svgPath(points, color)
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttributeNS(null, "d", d);
    path.setAttributeNS(null, "stroke", color);
    path.setAttributeNS(null, "stroke-width", 3);
    path.setAttributeNS(null, "fill", "none");
    return path;
  }
  generateFill(points,color, height, widht){
    let d = this.pathHandler.svgPath(points, color,true)

    let newD =
      `M 0,${height}` +
      d +
      `L ${widht},${height} L 0,${height}`;
    
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttributeNS(null, "d", newD);
    path.setAttributeNS(null, "stroke", "none");
    path.setAttributeNS(null, "fill", "url(#Gradient1)");
    return path;  }
}

let dataSet = [
  {
    color: "green",
    data: [0, 20, 10, 70, 10, 20, 10, 20, 10, 20, 10, 20, 10, 20],
  },
  {
    color: "red",
    data: [15, 21, 60, 40, 50, 30, 50, 100, 70, 30, 40, 60, 80, 90],
  },
  {
    color: "blue",
    data: [12, 13, 15, 25, 46, 40, 50, 60, 71, 68, 10, 20, 40, 100],
  },
  {
    color: "black",
    data: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
];
let lineStyle1 = {
  svgAfter: [{ qualifiedName: "stroke-width", value: "2" }],
  svgBefore: [{ qualifiedName: "stroke-width", value: "0" }],
};
let lineStyle2 = {
  svgAfter: [{ qualifiedName: "stroke-width", value: "2" }],
  svgBefore: [
    { qualifiedName: "stroke-width", value: "1" },
    { qualifiedName: "stroke-opacity", value: ".3" },
  ],
};
let lineStyle3 = {
  svgAfter: [{ qualifiedName: "stroke-width", value: "2" }],
  svgBefore: [
    { qualifiedName: "stroke", value: "gray" },
    { qualifiedName: "stroke-opacity", value: ".75" },
    { qualifiedName: "stroke-dasharray", value: "5 5" },
  ],
};

let playerHandler = new AnaliticVideoPlayer(dataSet, 30, lineStyle3, true);
