// bad global vars but fuck it
var Engine = Matter.Engine,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Runner = Matter.Runner,
    Constraint = Matter.Constraint;
var engine = null;
var runner = null;

// animate n key frames with 100 ms delay
function animateN(n) {
  var cur_frame = 0
  function animate() {
    if (cur_frame < n) {
      Runner.tick(runner, engine, 10)
      cur_frame += 1
      setTimeout(animate, 10)
    } else {
    }
  }
  animate()
}

function simulate_no_render(total_time) {
  delayzz = 1000 / 60
  World.clear(engine.world);
  Engine.clear(engine);
  engine.events = {}
  // create world
  var boxA = Bodies.rectangle(400, 0, 80, 80);
  // var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  World.add(engine.world, [boxA]);

  var start_time = new Date().getTime()
  var num_step = total_time / delayzz
  for (var i = 0; i < num_step; i++ ) {
    Engine.update(engine, delayzz)
  }
  console.log("run time: ", new Date().getTime() - start_time)
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    runner = Runner.create()
    // Events.on(engine, 'afterUpdate', function() {
    //   console.log("do the la la la la la")
    // })
  }
  $("#start_btn").click( function() {
    for (var i = 0; i < 10000; i++) {
      console.log("iteration ", i)
      simulate_no_render(10000)
    }
  });
}

