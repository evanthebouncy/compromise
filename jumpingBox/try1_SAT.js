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
  // var constraint_B = mk_constraint_B([-0.2507706522126682, 0.5908728351932949, -4.519418032607064, -0.27293739386368543])
  var constraint_img = constraint_B
  var constraint_preimg = constraint_B
  console.log("initial constraint_B guess: ", constraint_B.params)
  var ctrl_f = mk_mk_f(constraint_B)([])
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
  $("#animate_fg").click( function() {
    var ctrl_fg = mk_ctrl_fg(ctrl_f, ctrl_g)
    var the_state_a = constraint_A.concrete_sample()
    simulate_and_render(the_state_a, ctrl_fg, 3000, false, function(x){})
  });
  $("#visualize_img").click( function() {
    display_constraint(constraint_img)
  });
  $("#visualize_preimg").click( function() {
    display_constraint(constraint_preimg)
  });

  // for training
  function project_Bf() {
    console.log("# # # projecting onto Bf # # #")
    console.log("# training f ...") 
    var measure_f = mk_measurer(constraint_A, constraint_B, 150) 
    var mk_ctrl_f = mk_mk_f(constraint_B)
    ctrl_f = train(mk_ctrl_f, measure_f, 30, 8, ctrl_f)
    console.log("# f result: ", ctrl_f.params)
    console.log("")
    console.log("# projecting ...")
    var project_img_measure = mk_project_img_measure(constraint_A, constraint_B, ctrl_f, 200)
    constraint_img = train(mk_constraint_B, project_img_measure, 20, 5, constraint_img)
    console.log("# img result: ", constraint_img.params)
    constraint_B = constraint_img
    console.log("\n")
  }
  function project_Bg() {
    console.log("# # # projecting onto Bg # # #")
    console.log("# training g ...") 
    var measure_g = mk_measurer(constraint_B, constraint_C, 150) 
    ctrl_g = train(mk_ctrl_g, measure_g, 30, 4, ctrl_g)
    console.log("# g result: ", ctrl_g.params)
    console.log("")
    console.log("# projecting ...")
    var project_preimg_measure = mk_project_preimg_measure(constraint_C, constraint_B, 
                                                           ctrl_g, 200)
    constraint_preimg = train(mk_constraint_B, project_preimg_measure, 20, 5, constraint_preimg)
    console.log("# preimg result: ", constraint_preimg.params)
    constraint_B = constraint_preimg
    console.log("\n")
  }
  $("#project_Bf").click( function() { project_Bf() });
  $("#project_Bg").click( function() { project_Bg() });

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

