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

    //after loading metadata of video
    this.video.addEventListener("loadedmetadata", () => {
      this.vidWidth = this.video.videoWidth;
      this.vidHeight = this.video.videoHeight;
      this.vidDuration = this.video.duration * 1000;
      this.afterLoad(dataSet, lineStyles, fill);
    });
  }

  afterLoad(dataSet, lineStyles, fill) {
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
      let path = pathHandler.svgPath(points, dataRow.color, fill);
      if (fill == true) {
        path = this.setupFill(path, this.vidWidth, this.vidHeight);
      }
      lineStyles.svgAfter.map((e) => {
        path.setAttributeNS(null, e.qualifiedName, e.value);
      });
      svgAfter.appendChild(path);
    });

    dataSet.map((dataRow) => {
      let points = this.prepareData(
        dataRow.data,
        this.vidWidth,
        this.vidHeight
      );
      let path = pathHandler.svgPath(points, dataRow.color);

      lineStyles.svgBefore.map((e) => {
        path.setAttributeNS(null, e.qualifiedName, e.value);
      });

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
  setupFill(path, widht, height) {
    let newD =
      `M 0,${height}` +
      path.getAttribute("d") +
      `L ${widht},${height} L 0,${height}`;
    path.setAttribute("d", newD);
    return path;
  }
}
