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
// hand up box up, holding vertex 1
function Abar(hand_up_x, hand_up_y) {
  var A = {
    hand_up_x : hand_up_x,
    hand_up_y : hand_up_y 
  }
  
  A.concretize = function() {
    // pick a random hand x, y position
    var hand_x = randI(hand_up_x[0], hand_up_x[1]) 
    var hand_y = randI(hand_up_y[0], hand_up_y[1]) 
    
    // the rombus little length with diagonal 60
    var lll = Math.sqrt(Math.pow(60, 2) * 2) / 2
    // bone lengths are fixed are both bone same length
    var bone_l = 250

    // create the world in gods image lmao
    var floor = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
    var boxv1 = Bodies.rectangle(hand_x, hand_y + 10, 5, 5, {density: 0.0001})
    var boxv2 = Bodies.rectangle(hand_x - lll, hand_y + lll + 10, 5, 5, {density: 0.0001})
    var boxv3 = Bodies.rectangle(hand_x + lll, hand_y + lll + 10, 5, 5, {density: 0.0001})
    var boxv4 = Bodies.rectangle(hand_x, hand_y + lll + lll + 10, 5, 5, {density: 0.0001})
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
    var elbow_pos = find_elbow([400, 50], [hand_x, hand_y], bone_l)
    var arm_elbow = Bodies.rectangle(elbow_pos[0], elbow_pos[1], 20, 20)
    var arm_hand = Bodies.circle(hand_x, hand_y, 5)
    // constraints on arm
    var arm_bone1 = Constraint.create({bodyA: arm_top_jt1, bodyB: arm_elbow})
    var arm_bone2 = Constraint.create({bodyA: arm_elbow, bodyB: arm_hand})
    var arm_mus1 = Constraint.create({bodyA: arm_top_jt2, bodyB: arm_elbow})
    var arm_mus2 = Constraint.create({bodyA: arm_top_jt1, bodyB: arm_hand})

    // the initial grasp
    grasp = Constraint.create({bodyA: arm_hand, bodyB: boxv1})

    var world_objs = [boxv1, boxv2, boxv3, boxv4, 
                     boxc1, boxc2, boxc3, boxc4, boxc5, boxc6,
                     floor,
                     arm_top_jt1, arm_top_jt2, arm_elbow, arm_hand,
                     arm_bone1, arm_bone2, arm_mus1, arm_mus2,
                     grasp]
    var conc_A = {
      world_objs : world_objs,
      actuators : [arm_mus1, arm_mus2, grasp],
      perceptions : []
    }

    return conc_A
  }

  return A
}

// abstr state space for B
// hand down box down, vertex 1 on left
function Bbar(box_x, hand_down_x, hand_down_y) {
  var B = {
    box_x : box_x
  }

  // concretization of state B
  B.concretize = function() {
    // pick a random x position based on box_x
    var box_xx = randI(box_x[0], box_x[1])
    // pick a random hand_x and hand_y, 
    var hand_x = randI(hand_down_x[0], hand_down_x[1])
    var hand_y = randI(hand_down_y[0], hand_down_y[1])

    // floor and a box
    var floor   = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
    var boxv1 = Bodies.rectangle(box_xx-30, 464-30, 5, 5, {density: 0.0001})
    var boxv2 = Bodies.rectangle(box_xx-30, 464+30, 5, 5, {density: 0.0001})
    var boxv3 = Bodies.rectangle(box_xx+30, 464-30, 5, 5, {density: 0.0001})
    var boxv4 = Bodies.rectangle(box_xx+30, 464+30, 5, 5, {density: 0.0001})
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
    var arm_hand = Bodies.circle(hand_x, hand_y, 5)

    var bone_l = 250
    var elbow_pos = find_elbow([400, 50], [hand_x, hand_y], bone_l)
    var arm_elbow = Bodies.rectangle(elbow_pos[0], elbow_pos[1], 20, 20)
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
    
    var conc_B = {
      world_objs : world_objs,
      actuators : [arm_mus1, arm_mus2],
      perceptions : []
    }
    return conc_B
  }

  return B
}

// abstr state space for C
// hand up box down
function Cbar(box_x, hand_up_x, hand_up_y) {
  var C = {
    box_x : box_x,
    hand_up_x : hand_up_x,
    hand_up_y : hand_up_y 
  }
  
  C.concretize = function() {
    // pick a random box_x position
    var box_xx = randI(box_x[0], box_x[1])
    // pick a random hand x, y position
    var hand_x = randI(hand_up_x[0], hand_up_x[1]) 
    var hand_y = randI(hand_up_y[0], hand_up_y[1]) 
    
    // bone lengths are fixed are both bone same length
    var bone_l = 250

    // create the world in gods image lmao
    var floor = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
    var boxv1 = Bodies.rectangle(box_xx-30, 464-30, 5, 5, {density: 0.0001})
    var boxv2 = Bodies.rectangle(box_xx-30, 464+30, 5, 5, {density: 0.0001})
    var boxv3 = Bodies.rectangle(box_xx+30, 464-30, 5, 5, {density: 0.0001})
    var boxv4 = Bodies.rectangle(box_xx+30, 464+30, 5, 5, {density: 0.0001})
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
    var elbow_pos = find_elbow([400, 50], [hand_x, hand_y], bone_l)
    var arm_elbow = Bodies.rectangle(elbow_pos[0], elbow_pos[1], 20, 20)
    var arm_hand = Bodies.circle(hand_x, hand_y, 5)
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
    var conc_C = {
      world_objs : world_objs,
      actuators : [arm_mus1, arm_mus2],
      perceptions : [boxv3]
    }

    return conc_C
  }

  return C
}

// abstr state space for D
// hand down box down, holding v2
function Dbar(box_x) {
  var D = {
    box_x : box_x
  }
  
  D.concretize = function() {
    // pick a random box_x position
    var box_xx = randI(box_x[0], box_x[1])
    
    // bone lengths are fixed are both bone same length
    var bone_l = 250

    // create the world in gods image lmao
    var floor = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
    var boxv1 = Bodies.rectangle(box_xx-30, 464-30, 5, 5, {density: 0.0001})
    var boxv2 = Bodies.rectangle(box_xx-30, 464+30, 5, 5, {density: 0.0001})
    var boxv3 = Bodies.rectangle(box_xx+30, 464-30, 5, 5, {density: 0.0001})
    var boxv4 = Bodies.rectangle(box_xx+30, 464+30, 5, 5, {density: 0.0001})
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
    var elbow_pos = find_elbow([400, 50], [box_xx+30, 464-30], bone_l)
    var arm_elbow = Bodies.rectangle(elbow_pos[0], elbow_pos[1], 20, 20)
    var arm_hand = Bodies.circle(box_xx+30, 464-30-10, 5)
    // constraints on arm
    var arm_bone1 = Constraint.create({bodyA: arm_top_jt1, bodyB: arm_elbow})
    var arm_bone2 = Constraint.create({bodyA: arm_elbow, bodyB: arm_hand})
    var arm_mus1 = Constraint.create({bodyA: arm_top_jt2, bodyB: arm_elbow})
    var arm_mus2 = Constraint.create({bodyA: arm_top_jt1, bodyB: arm_hand})

    var grasp = Constraint.create({bodyA: arm_hand, bodyB: boxv3})

    var world_objs = [boxv1, boxv2, boxv3, boxv4, 
                     boxc1, boxc2, boxc3, boxc4, boxc5, boxc6,
                     floor,
                     arm_top_jt1, arm_top_jt2, arm_elbow, arm_hand,
                     arm_bone1, arm_bone2, arm_mus1, arm_mus2,
                     grasp]
    var conc_D = {
      world_objs : world_objs,
      actuators : [arm_mus1, arm_mus2, grasp],
      perceptions : []
    }

    return conc_D
  }

  return D
}
