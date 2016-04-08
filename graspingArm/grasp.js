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

// use the hand to grab objects
function grasp$(world_objs) {
  if (world_objs.grasp == null) {
    var objs = [world_objs.boxv1, world_objs.boxv2, world_objs.boxv3, world_objs.boxv4]
    var hand = world_objs.arm_hand
    for (i = 0; i < objs.length; i++) { 
      var obj = objs[i]
      var vec = Matter.Vector.sub(hand.position, obj.position)
      var l_grasp = Matter.Vector.magnitude(vec)
      if (l_grasp < 15) {
        var constr = Constraint.create({bodyA: hand, bodyB: obj})
        console.log(constr)
        World.add(engine.world, constr)
        world_objs.grasp = constr
        return
      }
    }
  }
}

function ungrasp$(world_objs) {
  old_constr = world_objs.grasp
  if (old_constr != null) {
    World.remove(engine.world, old_constr)
  }
  world_objs.grasp = null
}

// animate until timeout or termination
function animate(ctrl, timeout, terminate_on_ctrl, term_callback) {
  var n = timeout / deltaT
  var cur_frame = 0
  function animate1() {
    var cur_state = engine.world.bodies
    // console.log("FDJK")
    // console.log(ctrl.terminate(cur_state))

    if (ctrl.terminate(cur_state) && terminate_on_ctrl) {
      console.log("WHAT",  ctrl.terminate(1))

      console.log("end animate")
      return term_callback(cur_state)
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
function simulate_and_render(abs_state_start, controller, abs_state_end, timeout, 
                             terminate_on_ctrl, term_callback) {
  var world_objs = abs_state_start.concretize()
  var world_bodies = []
  for(var key in world_objs) {
    world_bodies.push(world_objs[key]);
  }
  // clear the world and controller
  clear_world()
  controller.clear()
  // add all of the bodies to the world
  World.add(engine.world, world_bodies)

  // bind 'afterUpdate' event to call the controller at every update
  // to act based on the current simulation state
  Events.on(engine, 'afterUpdate', function() {
    console.log(abs_state_end.checks(world_objs))
    controller.act(world_objs, abs_state_start, abs_state_end)
  });
  animate(controller, timeout, terminate_on_ctrl, term_callback)
}

// for just showing a configuration
function display(world_objs) {
  var world_bodies = []
  for(var key in world_objs) {
    world_bodies.push(world_objs[key]);
  }
  // clear the world and controller
  clear_world()
  // add all of the bodies to the world
  World.add(engine.world, world_bodies)
  Runner.tick(runner, engine, 0.0)
}


// simulate the current controller behaviour on a concrete state
// assume: controller has an act function, which denote what to do on every frame
// assume: controller has a terminate function, which the simulation should end early
// assume: controller has a "clear" function, which clears of its internal states
// the time out is the maximum time a controller should be allowed to run
// return the result of simulation, i.e. the afterward concrete state
function simulate$(world_objs, controller, pre, post, timeout) {
  var world_bodies = []
  for(var key in world_objs) {
    world_bodies.push(world_objs[key]);
  }
  // clear the world and controller
  clear_world()
  controller.clear()
  // add all of the bodies to the world
  World.add(engine.world, world_bodies)

  // bind 'afterUpdate' event to call the controller at every update
  // to act based on the current simulation state
  Events.on(engine, 'afterUpdate', function() {
    controller.act(world_objs, pre, post)
  });

  // simulate the world w/o rendering in a loop
  // starting from the concrete state and initial time
  var elapsed_time = 0
  // continue to simulate if not_terminate AND has_time_left
  while (!controller.terminate(123) && elapsed_time < timeout) {
    elapsed_time += deltaT
    conc_state = engine.world.bodies
    Engine.update(engine, deltaT)
  }
  return world_objs
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    engine.render.options.showAngleIndicator = true
    runner = Runner.create()
  }

  mus1_l = 150
  mus2_l = 300

  var A = Abar()
  var B = Bbar([200, 500])
  var C = Cbar(mus1_l, mus2_l)
  // display(concA.world_objs)
  // console.log(all_static(concA.world_objs))

  // console.log(A.concretize())
  f_AB = make_fAB([0.2, 100, 0.3, 400])

  $("#stateA").click( function() {
    world_objjs = A.concretize()
    resultz = simulate$(world_objjs, f_AB, A, B, 8000)
    console.log("A HA HA ", B.checks(resultz))
    // simulate_and_render(A, f_AB, B, 8000, true, function(){})
  });
  $("#stateB").click( function() {
    f_BC = make_fBC([0.3, 100, 0.3, 400])
    simulate_and_render(B, f_BC, C, 8000, true, function(){})
  });
  $("#stateC").click( function() {
    simulate_and_render(C, null_ctrl, 10000, false, function(){})
  });
  $("#stateD").click( function() {
    simulate_and_render(D, null_ctrl, 10000, false, function(){})
  });
}

