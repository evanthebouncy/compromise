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

// create grasping world
function mk_grasping_world(arm_state) {
  // floor and a box
  var floor   = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
  var boxv1 = Bodies.rectangle(400-30, 430-30, 5, 5, {density: 0.0001})
  var boxv2 = Bodies.rectangle(400-30, 430+30, 5, 5, {density: 0.0001})
  var boxv3 = Bodies.rectangle(400+30, 430-30, 5, 5, {density: 0.0001})
  var boxv4 = Bodies.rectangle(400+30, 430+30, 5, 5, {density: 0.0001})
  var boxc1 = Constraint.create({bodyA: boxv1, bodyB: boxv2})
  var boxc2 = Constraint.create({bodyA: boxv1, bodyB: boxv3})
  var boxc3 = Constraint.create({bodyA: boxv1, bodyB: boxv4})
  var boxc4 = Constraint.create({bodyA: boxv2, bodyB: boxv3})
  var boxc5 = Constraint.create({bodyA: boxv2, bodyB: boxv4})
  var boxc6 = Constraint.create({bodyA: boxv3, bodyB: boxv4})
  boxc2.render.lineWidth = 5;
  
  // an arm to moove the box
  // objects of arm
  var arm_top_jt1 = Bodies.rectangle(400, 50, 20, 20, {isStatic:true});
  var arm_top_jt2 = Bodies.rectangle(250, 50, 20, 20, {isStatic:true});
  var arm_elbow = Bodies.rectangle(250, 300, 20, 20)
  var arm_hand = Bodies.circle(400, 400, 5)
  // constraints on arm
  var arm_bone1 = Constraint.create({bodyA: arm_top_jt1, bodyB: arm_elbow})
  var arm_bone2 = Constraint.create({bodyA: arm_elbow, bodyB: arm_hand})
  var arm_mus1 = Constraint.create({bodyA: arm_top_jt2, bodyB: arm_elbow})
  var arm_mus2 = Constraint.create({bodyA: arm_top_jt1, bodyB: arm_hand})

  arm_state.l1 = arm_mus1.length
  arm_state.l2 = arm_mus2.length

  var state = [boxv1, boxv2, boxv3, boxv4, 
               boxc1, boxc2, boxc3, boxc4, boxc5, boxc6,
               floor,
               arm_top_jt1, arm_top_jt2, arm_elbow, arm_hand,
               arm_bone1, arm_bone2, arm_mus1, arm_mus2]
  var grasp_constr = null

  // add state to world
  World.add(engine.world, state)
  Runner.run(runner, engine)
  Events.on(engine, 'afterUpdate', function() {
    arm_mus1.length = arm_state.l1
    arm_mus2.length = arm_state.l2
    if (arm_state.grasp == true) {
      grasp_constr = grasp(arm_hand, [boxv1, boxv2, boxv3, boxv4], grasp_constr)
    }
    if (arm_state.grasp == false) {
      grasp_constr = ungrasp(grasp_constr)
    }
  });
  return [arm_mus1, arm_mus2]
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

function Start() {
  if (engine == null) {
    // create the engine
    engine = Engine.create(document.getElementById('canvas-container'));
    engine.render.options.showAngleIndicator = true
    runner = Runner.create()

    var l1_bnd = [200, 400]
    var l2_bnd = [200, 400]
    var arm_state = {l1:null, l2:null, grasp:false}
    var mus = mk_grasping_world(arm_state)

    $("#M1_u").click( function() {
      if (arm_state.l1 < l1_bnd[1]) { arm_state.l1 += 5 }
      console.log(arm_state)
    });
    $("#M1_d").click( function() {
      if (arm_state.l1 > l1_bnd[0]) { arm_state.l1 -= 5 }
      console.log(arm_state)
    });
    $("#M2_u").click( function() {
      if (arm_state.l2 < l2_bnd[1]) { arm_state.l2 += 5 }
      console.log(arm_state)
    });
    $("#M2_d").click( function() {
      if (arm_state.l2 > l2_bnd[0]) { arm_state.l2 -= 5 }
      console.log(arm_state)
      console.log(arm_state)
    });
    $("#grasp").click( function() {
      arm_state.grasp = true
      console.log(arm_state)
    });
    $("#ungrasp").click( function() {
      arm_state.grasp = false
      console.log(arm_state)
      console.log(engine.world)
    });
  }
}

