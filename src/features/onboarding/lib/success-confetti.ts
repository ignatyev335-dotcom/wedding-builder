export function launchSuccessConfetti() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.style.cssText =
    "position:fixed;inset:0;z-index:1000;pointer-events:none;width:100%;height:100%";
  document.body.appendChild(canvas);

  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  context.scale(ratio, ratio);

  const colors = ["#768b6b", "#d4b483", "#e6c7c2", "#f5eee2", "#364235"];
  const pieces = Array.from({ length: 100 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.42,
    vx: (Math.random() - 0.5) * 15,
    vy: -Math.random() * 12 - 4,
    size: Math.random() * 7 + 4,
    rotation: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const startedAt = performance.now();

  const draw = (now: number) => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    pieces.forEach((piece) => {
      piece.vy += 0.28;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += 0.12;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
      context.restore();
    });

    if (now - startedAt < 2200) requestAnimationFrame(draw);
    else canvas.remove();
  };

  requestAnimationFrame(draw);
}
