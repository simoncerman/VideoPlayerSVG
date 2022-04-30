class AnaliticVideoPlayer {
  constructor(dataSet) {
    //load videoPlayer (works like holder for all elements)
    this.videoPlayer = document.getElementById("video-player");
    this.svgHolder = document.createElement("div");
    this.video = document.getElementById("main-video");

    //for editing width and moving curve
    this.coverL;

    //for time handling
    this.interval;

    //use pathGenerator.js
    let pathHandler = new pathGenerator();

    //after loading metadata of video
    this.video.addEventListener("loadedmetadata", () => {
      this.vidWidth = this.video.videoWidth;
      this.vidHeight = this.video.videoHeight;
      this.vidDuration = this.video.duration * 1000;

      let svg = this.prepareSVG(this.vidWidth, this.vidHeight);

      let paths = [];
      dataSet.map((dataRow) => {
        let points = this.prepareData(
          dataRow.data,
          this.vidWidth,
          this.vidHeight
        );
        let path = pathHandler.svgPath(points, dataRow.color);
        paths.push(path);
      });
      svg.innerHTML = [...paths];
      this.prepareCover(this.vidWidth, this.vidHeight, svg);
      this.prepareListeners();
    });
  }

  prepareSVG(width, height) {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    return svg;
  }

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

  prepareCover(width, height, svgTo, svgFrom) {
    let coverHolder = document.createElement("div");
    let coverL = document.createElement("div");
    let coverR = document.createElement("div");
    coverHolder.appendChild(coverL);
    coverHolder.appendChild(coverR);

    coverHolder.style.width = width + "px";
    coverHolder.style.height = height + "px";
    coverHolder.classList.add("coverHolder");

    coverL.style.width = "100px";
    coverL.style.overflow = "hidden";
    if (svgTo != undefined) {
      coverL.appendChild(svgTo);
    }

    coverR.style.flexGrow = 1;
    coverR.style.pointerEvents = "none";
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
  }
  updateCover(percents) {
    console.log(percents);
    this.coverL.style.width = this.vidWidth * (percents * 1000) + "px";
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
    color: "yellow",
    data: [5, 6, 7, 8, 9, 10, 11, 15, 17, 19, 20, 21, 17, 13],
  },
];
let playerHandler = new AnaliticVideoPlayer(dataSet);
