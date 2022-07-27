const {
  useRef,
  useState,
  useEffect
} = React;
let w;
let h;
const gap = 130; // 130/200;

const pipew = 90;
let birdh;
let birdw;
const g = 9.81;
const hmeters = 5;
const verticalgap = hmeters / 4; // 5.5/4

let grassh;
const npipes = 20;
let propw;
let ctx;
let vy;
let score;
let gameover;
let losses;
let setLosses;
let interval;
let wingSound;
let deathSound;

function mToY(x) {
  return (hmeters - x) / hmeters * h;
}

function yToM(x) {
  return hmeters - x / h * hmeters;
}

function img(i, x, y, w, h) {
  ctx.drawImage(i, x * propw, y, w * propw, h);
}

function MyApp() {
  const canvasRef = useRef(null);
  [losses, setLosses] = useState(0);
  useEffect(() => {
    const grassimg = new Image();
    const birdimg = new Image();
    const pipeimg = new Image();
    const fpipeimg = new Image();
    grassimg.src = "https://i.imgur.com/cjTERnI.png";
    birdimg.src = "https://i.imgur.com/R1PnJuH.png";
    pipeimg.src = "https://i.imgur.com/drXBESn.png";
    fpipeimg.src = "https://i.imgur.com/5dhVgLM.png";
    wingSound = new Audio("https://www.myinstants.com/media/sounds/sfx_wing.mp3");
    deathSound = new Audio("https://www.myinstants.com/media/sounds/sfx_die.mp3");
    let lastTime = Date.now();
    ({
      clientWidth: w,
      clientHeight: h
    } = canvasRef.current.parentElement);
    canvasRef.current.height = h;
    canvasRef.current.width = w;
    birdh = h / 40;
    propw = h / 800;
    const x = 100;
    let y = mToY(hmeters / 2);
    vy = 0;
    score = -3;
    let grassoffset = 0;
    birdw = 40;
    grassh = h - h / 8;
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("touchstart", onTouchStart, {
      passive: false
    });
    ctx = canvasRef.current.getContext("2d");
    const pipes = [];

    for (let i = 0; i < npipes; i += 1) {
      pipes.push({
        x: i * (pipew + gap) + 500,
        y: mToY(Math.random() * (hmeters / 2) + hmeters / 7),
        dir: Math.random() * 2 * Math.PI,
        cw: Math.random() > 0.5,
        speed: Math.random()
      });
    }

    gameover = false;
    ctx.font = `normal bold ${h / 800 * 80}px sans-serif`;
    ctx.textAlign = "left";
    interval = setInterval(() => {
      const gamestarted = vy || score > -3;
      const rr = (Date.now() - lastTime) / 1000;
      lastTime = Date.now();
      ctx.clearRect(0, 0, w, h);

      if (gamestarted) {
        y = mToY(yToM(y) + vy * rr + 1 / 2 * g * rr * rr);
        vy = Math.max(vy - g * rr, -5);
        if (!gameover) score += rr;
      }

      ctx.fillStyle = "green";

      for (let i = 0; i < pipes.length; i += 1) {
        if (gamestarted && !gameover) {
          pipes[i].x -= rr * 100;
          pipes[i].x += Math.sin(pipes[i].dir) * (rr / 0.015);
          pipes[i].y += Math.cos(pipes[i].dir) * (rr / 0.015);
          pipes[i].dir += (pipes[i].cw * 2 - 1) * Math.random() * 0.1 * (rr / 0.015);

          if (pipes[i].x < -pipew) {
            pipes[i].x = (npipes - 1) * (pipew + gap) + gap;
            pipes[i].y = mToY(Math.random() * (hmeters / 2) + hmeters / 4);
          }

          const mercy = 0;

          if (y < pipes[i].y - verticalgap / hmeters * h && x < pipes[i].x + pipew - mercy && x + birdw > pipes[i].x + mercy || y + birdh >= grassh - 5 || y + birdh > pipes[i].y && x < pipes[i].x + pipew - mercy && x + birdw > pipes[i].x + mercy) {
            gameover = Date.now();
            vy = 2;
            deathSound.play();
          }
        }

        img(pipeimg, pipes[i].x, pipes[i].y, pipew, h / 3);
        img(fpipeimg, pipes[i].x, pipes[i].y + h / 3 - 5, pipew, h); // second pipe to continue first pipe

        img(fpipeimg, pipes[i].x, pipes[i].y - verticalgap / hmeters * h - h / 3, pipew, h / 3);
        img(pipeimg, pipes[i].x, pipes[i].y - verticalgap / hmeters * h - h / 3 - h, pipew, h);
      } // ctx.fillStyle = 'lime';


      const multi = (h - grassh) / 112;

      for (let i = grassoffset; Math.min(i * propw, i) <= Math.max(w, w * propw); i += 335 * multi) {
        img(grassimg, i, grassh, 336 * multi, 112 * multi);
      }

      if (gamestarted && !gameover) {
        grassoffset -= rr * 100;

        if (grassoffset < -multi * 335) {
          grassoffset += multi * 335;
        }
      }

      ctx.fillStyle = "white";
      ctx.fillText(Math.floor(Math.max(0, score * 14.12)) + " m", h / 800 * 100, h / 800 * 150);
      ctx.fillStyle = "black";
      ctx.strokeText(Math.floor(Math.max(0, score * 14.12)) + " m", h / 800 * 100, h / 800 * 150);
      ctx.translate(x * propw, y);
      ctx.rotate(-vy / 10);
      img(birdimg, 0, 0, birdw, birdh);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }, 10);
    return () => {
      clearInterval(interval);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [losses]);

  function onKeydown(e) {
    if (e.key === " ") {
      e.preventDefault();
      tap();
    }
  }

  function tap() {
    if (gameover && Date.now() - gameover > 1000) {
      clearInterval(interval);
      gameover = false;
      setLosses(losses + 1);
    } else if (!gameover) {
      vy = 3;
      wingSound.play();
    }
  }

  function onMouseDown(e) {
    if (e.button === 0) tap();
  }

  function onTouchStart(e) {
    e.preventDefault();
    tap();
  }

  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-[100vh] bg-cover bg-bottom bg-[url('https://user-images.githubusercontent.com/18351809/46888871-624a3900-ce7f-11e8-808e-99fd90c8a3f4.png')] grow"
  }, /*#__PURE__*/React.createElement("canvas", {
    tabIndex: "0",
    onMouseDown: onMouseDown,
    ref: canvasRef
  }));
}

const container = document.getElementById('react_container');
const root = ReactDOM.createRoot(container);
root.render( /*#__PURE__*/React.createElement(MyApp, null));
