# This is universal manual for using "VIDEOPLAYERSVG"

let playerHandler = new AnaliticVideoPlayer(*dataset*, *padding*, *lineStyle*);

### dataset

*STRUCTURE:*
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

### padding
Is just number in pixels of paddint(int/float)
use always number value and *not* string like "10px"

*STRUCTURE*
let padding = 100;

### lineStyle
*STRUCTURE*
let lineStyle = {
  svgAfter: [{ qualifiedName: "stroke-width", value: "2" }],
  svgBefore: [
    { qualifiedName: "stroke-width", value: "1" },
    { qualifiedName: "stroke-opacity", value: ".3" },
  ],
};