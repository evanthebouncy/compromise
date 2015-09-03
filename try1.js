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
  // clear the world
  clear_world()
  // add all of the bodies to the world
  World.add(engine.world, concrete_state)

  // bind the singular event that calls the controller at every update
  Events.on(engine, 'afterUpdate', function() {
    var time = engine.timing.timestamp;
    var bodies = engine.world.bodies
    if (!controller.terminate(concrete_state, time)) {
    controller.act(bodies, time)
    } else {
    // once the controller terminates, call the cb function with argument
    // the state of the world
      console.log("terminated")
      term_cb_obj[cb_fun_name](bodies)
    }
  });

  console.log(engine.world);
}

function simulate_no_render(concrete_state, controller, delayzz) {
  // clear the world and controller
  clear_world()
  controller.clear()
  // add all of the bodies to the world
  World.add(engine.world, concrete_state)

  // bind the singular event that calls the controller at every update
  // which would cause it to terminate
  Events.on(engine, 'afterUpdate', function() {
    var time = engine.timing.timestamp;
    var bodies = engine.world.bodies
    controller.act(bodies, time)
  });

  var time = engine.timing.timestamp
  var conc_state = concrete_state
  while (!controller.terminate(conc_state, time)) {
    time = engine.timing.timestamp;
    conc_state = engine.world.bodies
    Engine.update(engine, delayzz)
  }
  console.log(engine.world.bodies[0].position)
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
  }
  $("#start_btn").click( function() {
    var controller_f = mk_ctrl_f([], predicate_B)
//    // var concrete_state = abstract_state_A.concretize(predicate_A.sample()) 
//    // simulate(concrete_state, controller_f, function(){});
//    var measurer = mk_measurer(abstract_state_A, abstract_state_B, 
//                               predicate_A, predicate_B,
//                               controller_f, 10)
//    measurer.run1()
    var the_state = abstract_state_A.concretize(predicate_A.sample())
    for (var i = 0; i < 5; i++) {
      simulate_no_render(the_state, controller_f, i*5+1)
    }
  });
}

