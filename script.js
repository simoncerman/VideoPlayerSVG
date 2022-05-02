class AnaliticVideoPlayer {
  constructor(dataSet, padding) {
    //load videoPlayer (works like holder for all elements)
    this.videoPlayer = document.getElementById("video-player");
    this.video = document.getElementById("main-video");

    //for editing width and moving curve
    this.coverL;

    this.padding = padding;

    //for time handling
    this.interval;

    //after loading metadata of video
    this.video.addEventListener("loadedmetadata", () => {
      this.vidWidth = this.video.videoWidth;
      this.vidHeight = this.video.videoHeight;
      this.vidDuration = this.video.duration * 1000;
      this.afterLoad(dataSet);
    });
  }

  afterLoad(dataSet) {
    //use pathGenerator.js
    let pathHandler = new pathGenerator();

    let svgAfter = this.prepareSVG(this.vidWidth, this.vidHeight);
    let svgBefore = this.prepareSVG(this.vidWidth, this.vidHeight);

    dataSet.map((dataRow) => {
      let points = this.prepareData(
        dataRow.data,
        this.vidWidth,
        this.vidHeight
      );
      let path = pathHandler.svgPath(points, dataRow.color);
      svgAfter.appendChild(path);
    });

    dataSet.map((dataRow) => {
      let points = this.prepareData(
        dataRow.data,
        this.vidWidth,
        this.vidHeight
      );
      let path = pathHandler.svgPath(points, dataRow.color);
      path.setAttributeNS(null, "stroke-dasharray", "4 5");
      svgBefore.appendChild(path);
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
    console.log(percents);
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
let playerHandler = new AnaliticVideoPlayer(dataSet, 20);
