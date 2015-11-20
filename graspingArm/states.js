// we have different levels of abstractions in here
// --base level is a concrete state
// --one lvl on top of that is an abstr state, which can be concretized into many diff conc state
// --one lvl up on that is abstr state space, denoted as ...Bar, and encoded as a
// parametrizable function

// a concrete state must have these following
// world_objs: all the objects ready to instantiate the world
// actuators: the objects that a controller can use to actuate
// perceptions: the objects that a controller can observe

// an abstract state must have these following
// concretize: a function that provides a sample concrete state within its abstraction
// abstract: a function that checks if a concrete state can be within its abstraction
// theta: its own parametrization
// state_space: the state space function that's responsible for creating it

// abstr state space for A
function Abar(theta) {

  // concretization of state A
  function concretize(box_x) {
    // floor and a box
    var floor   = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
    var boxv1 = Bodies.rectangle(box_x-30, 460-30, 5, 5, {density: 0.0001})
    var boxv2 = Bodies.rectangle(box_x-30, 460+30, 5, 5, {density: 0.0001})
    var boxv3 = Bodies.rectangle(box_x+30, 460-30, 5, 5, {density: 0.0001})
    var boxv4 = Bodies.rectangle(box_x+30, 460+30, 5, 5, {density: 0.0001})
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

    var world_objs = [boxv1, boxv2, boxv3, boxv4, 
                     boxc1, boxc2, boxc3, boxc4, boxc5, boxc6,
                     floor,
                     arm_top_jt1, arm_top_jt2, arm_elbow, arm_hand,
                     arm_bone1, arm_bone2, arm_mus1, arm_mus2]
    
    var ret = {
      world_objs : world_objs,
      actuators : [arm_mus1, arm_mus2],
      perceptions : [boxv1]
    }
    return ret
  }

  var A = {
    concretize : function() {
      var box_x = randI(theta[0], theta[1])
      return concretize(box_x)
    },
    theta : theta,
    state_space : Abar
  }

  return A
}
