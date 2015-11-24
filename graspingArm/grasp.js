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
function grasp(hand, objs, grasp_constr) {
  if (grasp_constr == null) {
    for (i = 0; i < objs.length; i++) { 
      var obj = objs[i]
      var vec = Matter.Vector.sub(hand.position, obj.position)
      var l_grasp = Matter.Vector.magnitude(vec)
      if (l_grasp < 15) {
        var constr = Constraint.create({bodyA: hand, bodyB: obj})
        console.log(constr)
        World.add(engine.world, constr)
        return constr
      }
    }
  }
  return grasp_constr
}

function ungrasp(old_constr) {
  if (old_constr != null) {
    World.remove(engine.world, old_constr)
  }
  return null
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
function simulate_and_render(abstract_state, controller, timeout, 
                             terminate_on_ctrl, term_callback) {
  var concrete_state = abstract_state.concretize()
  var world_objs = concrete_state.world_objs
  // clear the world and controller
  clear_world()
  controller.clear()
  // add all of the bodies to the world
  World.add(engine.world, world_objs)

  // bind 'afterUpdate' event to call the controller at every update
  // to act based on the current simulation state
  Events.on(engine, 'afterUpdate', function() {
    controller.act(concrete_state.actuators, concrete_state.perceptions)
  });
  animate(controller, timeout, terminate_on_ctrl, term_callback)
}

// for just showing a configuration
function display(world_objs) {
  // clear the world and controller
  clear_world()
  // add all of the bodies to the world
  World.add(engine.world, world_objs)
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
  while (!controller.terminate(conc_state) && elapsed_time < timeout) {
    elapsed_time += deltaT
    conc_state = engine.world.bodies
    Engine.update(engine, deltaT)
  }
  return engine.world.bodies
}

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    engine.render.options.showAngleIndicator = true
    runner = Runner.create()
  }

//  var l1_bnd = [200, 400]
//  var l2_bnd = [200, 400]
//  var arm_state = {l1:null, l2:null, grasp:false}
//  var mus = mk_grasping_world(arm_state)

  var A = Abar([300, 500], [250, 400])
  var B = Bbar([300, 500], [300, 500], [250, 500])
  var C = Cbar([300, 500], [300, 500], [250, 400])
  var D = Dbar([300, 500])
  // display(concA.world_objs)
  // console.log(all_static(concA.world_objs))

  // console.log(A.concretize())
  simulate_and_render(A, null_ctrl, 10000, false, function(){})
  $("#rmove").click( function() {
  
  });
}

