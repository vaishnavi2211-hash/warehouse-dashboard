import { useState, useEffect } from "react";

const gridSize = 6;

// shuffle directions
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// check valid
const isValid = (x, y, obstacles) => {
  return (
    x >= 0 &&
    y >= 0 &&
    x < gridSize &&
    y < gridSize &&
    !obstacles.some(o => o.x === x && o.y === y)
  );
};

// BFS with randomness
const findPath = (start, target, obstacles) => {
  let queue = [[start]];
  let visited = new Set();

  while (queue.length) {
    let path = queue.shift();
    let { x, y } = path[path.length - 1];

    if (x === target.x && y === target.y) return path;

    let key = `${x}-${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    let dirs = shuffle([
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ]);

    for (let d of dirs) {
      if (isValid(d.x, d.y, obstacles)) {
        queue.push([...path, d]);
      }
    }
  }

  return [];
};

export default function Dashboard() {

  const pickupPoints = [
    { x: 0, y: 5 },
    { x: 1, y: 4 }
  ];

  const deliveryPoints = [
    { x: 5, y: 5 },
    { x: 4, y: 3 }
  ];

  const [robots, setRobots] = useState([
    {
      id: 0,
      x: 0,
      y: 0,
      taskIndex: 0,
      stage: "pickup",
      carrying: false,
      path: [],
    },
    {
      id: 1,
      x: 5,
      y: 0,
      taskIndex: 1,
      stage: "pickup",
      carrying: false,
      path: [],
    }
  ]);

  const [obstacles, setObstacles] = useState([]);
  const [completedBoxes, setCompletedBoxes] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // generate obstacles (no overlap with robots or targets)
  const generateObstacles = () => {
    let obs = [];
    while (obs.length < 5) {
      let x = Math.floor(Math.random() * gridSize);
      let y = Math.floor(Math.random() * gridSize);

      let clash =
        obs.some(o => o.x === x && o.y === y) ||
        robots.some(r => r.x === x && r.y === y) ||
        pickupPoints.some(p => p.x === x && p.y === y) ||
        deliveryPoints.some(d => d.x === x && d.y === y);

      if (!clash) obs.push({ x, y });
    }
    setObstacles(obs);
  };

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRobots(currentRobots => {
        let boxesToAdd = [];

        let newRobots = currentRobots.map(robot => {
          let r = { ...robot };
          
          let pickup = pickupPoints[r.taskIndex % pickupPoints.length];
          let delivery = deliveryPoints[r.taskIndex % deliveryPoints.length];
          let currentTarget = r.stage === "pickup" ? pickup : delivery;

          // 1. Check if arrived at current target before moving
          if (r.x === currentTarget.x && r.y === currentTarget.y) {
            if (r.stage === "pickup") {
              r.carrying = true;
              r.stage = "delivery";
              currentTarget = delivery;
            } else if (r.stage === "delivery") {
              r.carrying = false;
              r.stage = "pickup";
              boxesToAdd.push(delivery);
              r.taskIndex += 2; // Each robot skips to the next valid task (staggered by 2)
              currentTarget = pickupPoints[r.taskIndex % pickupPoints.length];
            }
          }

          // 2. Find path and move
          let path = findPath({ x: r.x, y: r.y }, currentTarget, obstacles);
          if (path.length > 1) {
            const nextStep = path[1];
            // Simple Collision Avoidance
            const otherRobot = currentRobots.find(or => or.id !== r.id && or.x === nextStep.x && or.y === nextStep.y);
            if (!otherRobot) {
              r.x = nextStep.x;
              r.y = nextStep.y;
            }
          }
          r.path = path;
          return r;
        });

        if (boxesToAdd.length > 0) {
          setCompletedBoxes(prev => [...prev, ...boxesToAdd]);
        }

        return newRobots;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [obstacles, isRunning]); // re-run only when obstacles change or running state changes

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">

      <h1 className="text-2xl font-bold mb-4">
        Smart Warehouse AI 🤖🤖
      </h1>

      <div className="flex gap-4 mb-4">
        <button
          onClick={generateObstacles}
          className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded font-semibold transition-colors"
        >
          Generate Obstacles
        </button>
        <button
          onClick={() => setIsRunning(val => !val)}
          className={`px-4 py-2 rounded font-semibold transition-colors ${
            isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isRunning ? "Stop Simulation" : "Start Simulation"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* MAP */}
        <div className="col-span-2 bg-gray-800 p-4 rounded-xl">

          <div className="grid grid-cols-6 gap-2">
            {[...Array(gridSize)].map((_, i) =>
              [...Array(gridSize)].map((_, j) => {

                const botsHere = robots.filter(r => r.x === i && r.y === j);
                const isRobot = botsHere.length > 0;
                const isObstacle = obstacles.some(o => o.x === i && o.y === j);
                const isPickup = pickupPoints.some(p => p.x === i && p.y === j);
                const isDelivery = deliveryPoints.some(d => d.x === i && d.y === j);
                const isCompleted = completedBoxes.some(c => c.x === i && c.y === j);
                const isPath = robots.some(r => r.path?.some(p => p.x === i && p.y === j));

                return (
                  <div
                    key={i + "-" + j}
                    className={`h-12 flex items-center justify-center rounded
                      ${isRobot ? "bg-green-500" : ""}
                      ${!isRobot && isObstacle ? "bg-red-500" : ""}
                      ${!isRobot && !isObstacle && isCompleted ? "bg-green-700" : ""}
                      ${!isRobot && !isObstacle && !isCompleted && isPickup ? "bg-purple-500" : ""}
                      ${!isRobot && !isObstacle && !isCompleted && !isPickup && isDelivery ? "bg-blue-500" : ""}
                      ${!isRobot && !isObstacle && !isCompleted && !isPickup && !isDelivery && isPath ? "bg-yellow-400" : "bg-gray-700"}
                    `}
                  >
                    {isRobot
                      ? (botsHere.length > 1 ? "🤖🤖" : (botsHere[0].carrying ? "📦🤖" : "🤖"))
                      : isObstacle
                      ? "X"
                      : isCompleted
                      ? "✔"
                      : isPickup
                      ? "P"
                      : isDelivery
                      ? "D"
                      : ""}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* STATUS */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-bold">Status</h2>
          {robots.map(r => (
            <div key={r.id} className="mt-2 text-sm">
              <p><strong>Robot {r.id + 1}</strong></p>
              <p>Pos: ({r.x},{r.y}) | Carry: {r.carrying ? "Yes" : "No"}</p>
              <p>Stage: {r.stage}</p>
            </div>
          ))}
        </div>

        {/* TASK */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-bold">Task</h2>
          <p>Dynamic Pickup → Delivery</p>
          <p>Completed: {completedBoxes.length}</p>
        </div>

        {/* STATS */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-bold">Stats</h2>
          {robots.map(r => (
            <p key={`stat-${r.id}`}>R{r.id + 1} Path: {r.path?.length || 0}</p>
          ))}
        </div>

        {/* ALERT */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-bold">Alerts</h2>
          {robots.map(r => (
            <p key={`alert-${r.id}`}>R{r.id + 1}: {(!r.path || r.path.length === 0) ? "No Path Found!" : "Optimizing..."}</p>
          ))}
        </div>

      </div>
    </div>
  );
}