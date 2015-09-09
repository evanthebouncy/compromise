// bad global vars but fuck it
var Engine = Matter.Engine,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Runner = Matter.Runner,
    Events = Matter.Events,
    Constraint = Matter.Constraint;
var engine = null;
var runner = null;
var deltaT = 1000 / 60;

// clear the world of all objects and events
function clear_world() {
  World.clear(engine.world);
  Engine.clear(engine);
  engine.events = {}
}

// animate until timeout or termination
function animate(ctrl, timeout, terminate_on_ctrl, term_callback) {
  var n = timeout / deltaT
  var cur_frame = 0
  function animate1() {
    var cur_state = engine.world.bodies
    if (ctrl.terminate(cur_state) && terminate_on_ctrl) {
      term_callback(cur_state)
      return;
    }
    if (cur_frame < n) {
      Runner.tick(runner, engine, deltaT)
      cur_frame += 1
      setTimeout(animate1, deltaT)
    } else {
      console.log("end animate")
    }
  }
  animate1()
}

// for displaying a particular controller's behaviour
function simulate_and_render(concrete_state, controller, timeout, 
                             terminate_on_ctrl, term_callback) {
  // clear the world and controller
  clear_world()
  controller.clear()
  // add all of the bodies to the world
  World.add(engine.world, concrete_state)

  // bind 'afterUpdate' event to call the controller at every update
  // to act based on the current simulation state
  Events.on(engine, 'afterUpdate', function() {
    var bodies = engine.world.bodies
    controller.act(bodies)
  });
  animate(controller, timeout, terminate_on_ctrl, term_callback)
}

// for just showing a configuration
function display(concrete_state) {
  // clear the world and controller
  clear_world()
  // add all of the bodies to the world
  World.add(engine.world, concrete_state)
  Runner.tick(runner, engine, 0.0)
}


// simulate the current controller behaviour on a concrete state
// assume: controller has an act function, which denote what to do on every frame
// assume: controller has a terminate function, which the simulation should end early
// assume: controller has a "clear" function, which clears of its internal states
// the time out is the maximum time a controller should be allowed to run
// return the result of simulation, i.e. the afterward concrete state
function simulate(concrete_state, controller, timeout) {
  // clear the world and controller
  clear_world()
  controller.clear()
  // add all of the bodies to the world
  World.add(engine.world, concrete_state)

  // bind 'afterUpdate' event to call the controller at every update
  // to act based on the current simulation state
  Events.on(engine, 'afterUpdate', function() {
    var bodies = engine.world.bodies
    controller.act(bodies)
  });

  // simulate the world w/o rendering in a loop
  // starting from the concrete state and initial time
  var elapsed_time = 0
  var conc_state = concrete_state
  // continue to simulate if not_terminate AND has_time_left
//  var beg_time = new Date().getTime();
  while (!controller.terminate(conc_state) && elapsed_time < timeout) {
    elapsed_time += deltaT
    conc_state = engine.world.bodies
    Engine.update(engine, deltaT)
  }
//  var end_time = new Date().getTime();
//  if (end_time - beg_time > 1000) {
//    console.log("wtf long time")
//    console.log(controller.params)
//  }
  return engine.world.bodies
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    runner = Runner.create()
  }

  // initialize some starting points
  var pred_B = mk_pred_B([6,6,6,6,6,6])
  console.log("initial pred_B guess: ", pred_B.params)
  var ctrl_f = mk_ctrl_f([6,6,6,6,6,6],pred_B)
  var ctrl_g = mk_ctrl_g([6,6,6,6,6,6],predicate_C) 

  // for visualizing the controller and the compsoed controller
  $("#animate_f").click( function() {
    var abstr_a = predicate_A.sample()
    var the_state_a = abstract_state_A.concretize(abstr_a)
    var term_cb_f = function(cur_state) {
      var abstr_state = abstract_state_B.abstraction(cur_state)
      var score = pred_B.soft_sat(abstr_state)
      console.log("score ", score, " with ", abstr_state)
    }
    simulate_and_render(the_state_a, ctrl_f, 8000, true, term_cb_f)
  });
  $("#animate_g").click( function() {
    var abstr_b = pred_B.sample()
    var the_state_b = abstract_state_B.concretize(abstr_b)
    var term_cb_f = function(cur_state) {
      var abstr_state = abstract_state_C.abstraction(cur_state)
      var score = predicate_C.soft_sat(abstr_state)
      console.log("score ", score, " with ", abstr_state)
    }
    simulate_and_render(the_state_b, ctrl_g, 8000, true, term_cb_f)
  });
  $("#visualize_pred").click( function() {
    var bodies = abstract_state_B.concretize(pred_B.sample())
    for (var i = 0; i < 100; i++) {
      var the_state_b = abstract_state_B.concretize(pred_B.sample())
      bodies.push(the_state_b[1])
    }
    display(bodies)
  });
  $("#animate_fg").click( function() {
    var ctrl_fg = mk_ctrl_fg(ctrl_f, ctrl_g)
    var abstr_a = predicate_A.sample()
    var the_state_a = abstract_state_A.concretize(abstr_a)
    simulate_and_render(the_state_a, ctrl_fg, 3000, false, function(x){})
  });

  // for training
  function train_f() {
    console.log("# # # training f # # #")
    ctrl_f = train_ctrl(mk_ctrl_f, abstract_state_A, predicate_A, abstract_state_B, pred_B, 6)
    console.log("# # # training f result: ", ctrl_f.params)
    console.log("")
  }
  function train_g() {
    console.log("# # # training g # # #")
    ctrl_g = train_ctrl(mk_ctrl_g, abstract_state_B, pred_B, abstract_state_C, predicate_C, 6)
    console.log("# # # training g result: ", ctrl_g.params)
    console.log("")
  }
  function compromise() {
    console.log("# # # compromising f and g # # #")
    pred_B = train_constraint(mk_pred_B, abstract_state_A, predicate_A, ctrl_f,
                              abstract_state_C, predicate_C, ctrl_g,
                              abstract_state_B, 5)
    console.log("# # # compromising f g result: ", pred_B.params)
    console.log("")
  }
  $("#train_f").click( function() { train_f() });
  $("#train_g").click( function() { train_g() });
  $("#compromise").click( function() { compromise() });
  $("#infinite_train").click( function() {
    var measure = mk_measurer (abstract_state_A, predicate_A, 
                               abstract_state_C, predicate_C, 1000)

    while(true) {
      var ctrl_fg = mk_ctrl_fg(ctrl_f, ctrl_g)
      console.log("")
      console.log("currently the score is ", measure(ctrl_fg))
      train_f()
      train_g()
      compromise()
    }
  });
}

