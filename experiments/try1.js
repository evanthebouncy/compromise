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

function simulate_no_render(delayzz) {
  World.clear(engine.world);
  Engine.clear(engine);
  engine.events = {}
  // create world
  var boxA = Bodies.rectangle(400, 0, 80, 80);
  // var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  World.add(engine.world, [boxA]);

  console.log(boxA.position)
  var total_time = 5000
  var num_step = total_time / delayzz
  for (var i = 0; i < num_step; i++ ) {
    Engine.update(engine, delayzz)
  }
  console.log(boxA.position)
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
    simulate_no_render(2)
    simulate_no_render(5)
    simulate_no_render(10)
    simulate_no_render(20)
//    animateN(100)
//    console.log("start animate")
  });
}

