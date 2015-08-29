// bad global vars but fuck it
var Engine = Matter.Engine,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Constraint = Matter.Constraint;
var engine = null;

function simulate() {
  // create a fresh world
  World.clear(engine.world);
  Engine.clear(engine);
  engine.events = {}
  clearCTRL();
  // create two boxes and a ground
//  var boxA = Bodies.rectangle(randI(50,750), 590, 50, 50, {restitution: 0.9});
//  Body.setVelocity(boxA, {x: 10, y: -10})
//
//  var boxB = Bodies.rectangle(randI(25,750), randI(50,250), 50, 50, {isStatic:true});
//  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

  // add all of the bodies to the world
  World.add(engine.world, concretize_A(predicate_A.sample()));

  // bind the singular event that calls the controller at every update
  Events.on(engine, 'afterUpdate', function() {
    var time = engine.timing.timestamp;
    var boxA = engine.world.bodies[0]
    var boxB = engine.world.bodies[1]
    CTRL.run(boxA, boxB, time);
  });

  console.log(engine.world);
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    Engine.run(engine);
  }
  $("#start_btn").click( function() {
    simulate();
  });
}

