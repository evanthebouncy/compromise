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
      term_callback(cur_state)
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

function loggy(stuffs) {
  $('<p>'+stuffs+'</p>').appendTo('#loggy');
}

function display_constraint(constraint) {
  var bodies = constraint.concrete_sample()
  for (var i = 0; i < 100; i++) {
    var the_state = constraint.concrete_sample()
    bodies.push(the_state[1])
  }
  display(bodies)
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    runner = Runner.create()
  }

  // initialize some starting points
  var constraint_B = mk_constraint_B([6,6,6,6,6,6])
  var constraint_img = mk_constraint_B([])
  var constraint_preimg = mk_constraint_B([])
  console.log("initial constraint_B guess: ", constraint_B.params)
  var ctrl_f = mk_ctrl_f([])
  var ctrl_g = mk_ctrl_g([]) 

  // for visualizing the controller and the compsoed controller
  $("#animate_f").click( function() {
    var the_state_a = constraint_A.concrete_sample()
    var term_cb_f = function(cur_state) {
      var abstr_state = constraint_B.abstraction(cur_state)
      var score = constraint_B.sat(abstr_state)
      console.log("score ", score, " with ", abstr_state)
    }
    simulate_and_render(the_state_a, ctrl_f, 8000, true, term_cb_f)
  });
  $("#animate_g").click( function() {
    var the_state_b = constraint_B.concrete_sample()
    var term_cb_f = function(cur_state) {
      var abstr_state = constraint_C.abstraction(cur_state)
      var score = constraint_C.sat(abstr_state)
      console.log("score ", score, " with ", abstr_state)
    }
    simulate_and_render(the_state_b, ctrl_g, 8000, true, term_cb_f)
  });
  $("#visualize_constraint_img").click( function() {
    display_constraint(constraint_img)
  });
  $("#visualize_constraint_preimg").click( function() {
    display_constraint(constraint_preimg)
  });
  $("#visualize_constraint_mid").click( function() {
    display_constraint(constraint_B)
  });
  $("#animate_fg").click( function() {
    var ctrl_fg = mk_ctrl_fg(ctrl_f, ctrl_g)
    var the_state_a = constraint_A.concrete_sample()
    simulate_and_render(the_state_a, ctrl_fg, 3000, false, function(x){})
  });

  // for training
  function train_f() {
    console.log("# # # training f # # #")
    var measure = mk_measurer(constraint_A, constraint_B, 150) 
    ctrl_f = train(mk_ctrl_f, measure, 20, 5, ctrl_f)
    console.log("# # # training f result: ", ctrl_f.params)
    console.log("")
  }
  function train_g() {
    console.log("# # # training g # # #")
    var measure = mk_measurer(constraint_B, constraint_C, 150) 
    ctrl_g = train(mk_ctrl_g, measure, 20, 5, ctrl_g)
    console.log("# # # training g result: ", ctrl_g.params)
    console.log("")
  }
  function compromise() {
    console.log("# # # compromising f and g # # #")
    var match_img_measure = mk_match_measure_img(constraint_A, ctrl_f, 200)
    var match_preimage_measure = mk_match_measure_preimg(constraint_C, ctrl_g, 200)

    constraint_img = train(mk_constraint_B, match_img_measure, 20, 5, constraint_img)
    constraint_preimg = train(mk_constraint_B, match_preimg_measure, 20, 5, constraint_preimg)

    constraint_B = compromise(constraint_img, constraint_preimg)
    console.log("# # # compromising f g result: ", constraint_B.params)
    console.log("")
  }
  $("#train_f").click( function() { train_f() });
  $("#train_g").click( function() { train_g() });
  $("#compromise").click( function() { compromise() });

//  var boss_measure = mk_measurer (abstract_state_A, predicate_A, 
//                             abstract_state_C, predicate_C, 1000)
  $("#full_train").click( function() {
    console.log("full training iteration")
    loggy("full training")
    loggy("training f")
    train_f()
    loggy("training g")
    train_g()
    var ctrl_fg = mk_ctrl_fg(ctrl_f, ctrl_g)
    // loggy("currently the score is "+ boss_measure(ctrl_fg))
    loggy("compromising... ")
    compromise()
    loggy("training f")
    train_f()
    loggy("training g")
    train_g()
  });
}

