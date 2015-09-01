// bad global vars but fuck it
var Engine = Matter.Engine,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Constraint = Matter.Constraint;
var engine = null;

function simulate(concrete_state, controller) {
  // create a fresh world
  World.clear(engine.world);
  Engine.clear(engine);
  engine.events = {}
//  clearCTRL();

  // add all of the bodies to the world
  World.add(engine.world, concrete_state)

  // bind the singular event that calls the controller at every update
  Events.on(engine, 'afterUpdate', function() {
    var time = engine.timing.timestamp;
    var bodies = engine.world.bodies
    if (!controller.terminate(concrete_state, time)) {
    controller.act(bodies, time)
    } else {
    // do something here
      console.log("terminated")
    }
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
    var controller_f = mk_ctrl_f([], predicate_B)
    var concrete_state = concretize_A(predicate_A.sample()) 
    simulate(concrete_state, controller_f);
  });
}

