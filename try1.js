// bad global vars but fuck it
var Engine = Matter.Engine,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Constraint = Matter.Constraint;
var engine = null;

// clear the world of all objects and events
function clear_world() {
  World.clear(engine.world);
  Engine.clear(engine);
  engine.events = {}
}

function simulate(concrete_state, controller, term_cb_obj, cb_fun_name) {
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
      clear_world()
      term_cb_obj[cb_fun_name]()
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
    // var concrete_state = abstract_state_A.concretize(predicate_A.sample()) 
    // simulate(concrete_state, controller_f, function(){});
    var measurer = mk_measurer(abstract_state_A, abstract_state_B, 
                               predicate_A, predicate_B,
                               controller_f, 10)
    measurer.run1()
  });
}

