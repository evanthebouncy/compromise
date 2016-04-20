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

// some generic generators
function generate_world$(world_objs){
  world_objs.floor = Bodies.rectangle(400, 550, 800, 100, {isStatic:true});
  return world_objs
}

function generate_arm$(world_objs) {
  // an arm to moove the box
  // objects of arm
  world_objs.arm_top_jt1 = Bodies.rectangle(400, 50, 20, 20, {isStatic:true});
  world_objs.arm_top_jt2 = Bodies.rectangle(250, 50, 20, 20, {isStatic:true});
  // world_objs.elbow_pos = find_elbow([400, 50], [hand_x, hand_y], bone_l)
  world_objs.arm_elbow = Bodies.rectangle(250, 200, 20, 20)
  world_objs.arm_hand = Bodies.circle(400, 350, 5)
  // constraints on arm
  world_objs.arm_bone1 = Constraint.create({bodyA: world_objs.arm_top_jt1, bodyB: world_objs.arm_elbow})
  world_objs.arm_bone2 = Constraint.create({bodyA: world_objs.arm_elbow, bodyB: world_objs.arm_hand})
  world_objs.arm_mus1 = Constraint.create({bodyA: world_objs.arm_top_jt2, bodyB: world_objs.arm_elbow})
  world_objs.arm_mus2 = Constraint.create({bodyA: world_objs.arm_top_jt1, bodyB: world_objs.arm_hand})
  return world_objs
}

function generate_box$(world_objs, box_x, box_y, box_dir){
  var lll = Math.sqrt(Math.pow(60, 2) * 2) / 2
  normalized_dir = vscale(box_dir, 1.0 / mag(box_dir))

  vec_v1 = vadd([box_x, box_y], vscale(normalized_dir, lll))
  vec_v3 = vadd([box_x, box_y], vscale(normalized_dir, -1 * lll))
  vec_v2 = vadd([box_x, box_y], vscale([normalized_dir[1], -normalized_dir[0]], lll))
  vec_v4 = vadd([box_x, box_y], vscale([normalized_dir[1], -normalized_dir[0]], -1 * lll))

  world_objs.boxv1 = Bodies.rectangle(vec_v1[0], vec_v1[1], 8, 8, {density: 0.001})
  world_objs.boxv2 = Bodies.rectangle(vec_v2[0], vec_v2[1], 8, 8, {density: 0.001})
  world_objs.boxv3 = Bodies.rectangle(vec_v3[0], vec_v3[1], 8, 8, {density: 0.001})
  world_objs.boxv4 = Bodies.rectangle(vec_v4[0], vec_v4[1], 8, 8, {density: 0.001})
  world_objs.boxc1 = Constraint.create({bodyA: world_objs.boxv1, bodyB: world_objs.boxv2})
  world_objs.boxc2 = Constraint.create({bodyA: world_objs.boxv1, bodyB: world_objs.boxv3})
  world_objs.boxc3 = Constraint.create({bodyA: world_objs.boxv1, bodyB: world_objs.boxv4})
  world_objs.boxc4 = Constraint.create({bodyA: world_objs.boxv2, bodyB: world_objs.boxv3})
  world_objs.boxc5 = Constraint.create({bodyA: world_objs.boxv2, bodyB: world_objs.boxv4})
  world_objs.boxc6 = Constraint.create({bodyA: world_objs.boxv3, bodyB: world_objs.boxv4})
  world_objs.boxc3.render.lineWidth = 5;
  return world_objs
}

function box_orientation(world_objs) {
  var v1x = world_objs.boxv1.position.x
  var v1y = world_objs.boxv1.position.y
  var v4x = world_objs.boxv4.position.x
  var v4y = world_objs.boxv4.position.y

  var diffx = v1x - v4x
  var diffy = v1y - v4y
  var orient = [diffx, diffy]
  return vscale(orient, 1.0 / mag(orient))
}

function box_position(world_objs) {
  var v1x = world_objs.boxv1.position.x
  var v1y = world_objs.boxv1.position.y
  var v3x = world_objs.boxv3.position.x
  var v3y = world_objs.boxv3.position.y

  var avg_x = 0.5 * (v1x + v3x)
  var avg_y = 0.5 * (v1y + v3y)
  return [avg_x, avg_y]
}

// abstr state space for A
// hand up box up, holding vertex 1
function Abar() {
  var A = {}

  A.concretize = function() {

    world_objs = {}
    generate_world$(world_objs)
    generate_arm$(world_objs)

    var lll = Math.sqrt(Math.pow(60, 2) * 2) / 2
    generate_box$(world_objs, 400, 350+10+lll, [0,-1])

    world_objs.grasp = Constraint.create({bodyA: world_objs.arm_hand, bodyB: world_objs.boxv1})
    return world_objs
  }

  return A
}

// abstr state space for B
// hand down box down, vertex 1 on left
function Bbar(x_pos_rangee) {
  var x_pos = x_pos_rangee[0]
  var rangee = x_pos_rangee[1]

  // console.log(x_pos, rangee)
  var box_down_x = [x_pos, x_pos + rangee]
  if (box_down_x[0] > box_down_x[1]) {
    var swp = box_down_x[0]
    box_down_x[0] = box_down_x[1]
    box_down_x[1] = swp
  }
  var box_yy = 464
  var B = {
    box_down_x : box_down_x,
    box_yy : box_yy
  }

  // concretization of state B
  B.concretize = function() {
    // pick a random x position based on box_x
    var box_xx = randI(box_down_x[0], box_down_x[1])

    var world_objs = {}
    generate_world$(world_objs)
    generate_arm$(world_objs)

    var lll = Math.sqrt(Math.pow(60, 2) * 2) / 2
    generate_box$(world_objs, box_xx, box_yy, [-1,-1])
    return world_objs
  }

  B.checks = function(world_objs){
    // console.log("fuck man")
    var box_x = 0.5 * (world_objs.boxv1.position.x + world_objs.boxv3.position.x)
    var box_y = 0.5 * (world_objs.boxv1.position.y + world_objs.boxv3.position.y)
    var orient = box_orientation(world_objs)

    var is_orient_left = vdot(orient, [-1.0, 0.0])
    // console.log( B.box_down_x[0] <= box_x ,
    //        B.box_down_x[1] >= box_x ,
    //        Math.abs(B.box_yy - box_y) < 10 ,
    //        is_orient_left > 0.95 )

    return B.box_down_x[0] <= box_x &
           B.box_down_x[1] >= box_x &
           Math.abs(B.box_yy - box_y) < 10 &
           is_orient_left > 0.95
  }

  B.softchecks = function(world_objs){
    var box_x = 0.5 * (world_objs.boxv1.position.x + world_objs.boxv3.position.x)
    var box_y = 0.5 * (world_objs.boxv1.position.y + world_objs.boxv3.position.y)
    var orient = box_orientation(world_objs)

    var is_orient_left = Math.max(vdot(orient, [-1.0, 0.0]), 0.0)

    return soft_in_rng(box_x,B.box_down_x) * soft_in_rng(box_y, [B.box_yy - 10, B.box_yy + 10]) * is_orient_left
  }

  return B
}


function Cbar() {
  var C = {}

  C.checks = function(world_objs) {
    var hand_x = world_objs.arm_hand.position.x
    var hand_y = world_objs.arm_hand.position.y
    var boxv4_x = world_objs.boxv4.position.x
    var boxv4_y = world_objs.boxv4.position.y

    var mus1_ll = world_objs.arm_mus1.length
    var mus2_ll = world_objs.arm_mus2.length

    var hand_box_dist = Math.abs(hand_x - boxv4_x) + Math.abs(hand_y - boxv4_y)
    // var mus_dist = Math.abs(mus1_ll - mus1_l) + Math.abs(mus2_ll - mus2_l)
    return hand_box_dist  < 18
  }

  C.softchecks = function(world_objs) {
    var hand_x = world_objs.arm_hand.position.x
    var hand_y = world_objs.arm_hand.position.y
    var boxv4_x = world_objs.boxv4.position.x
    var boxv4_y = world_objs.boxv4.position.y

    var mus1_ll = world_objs.arm_mus1.length
    var mus2_ll = world_objs.arm_mus2.length

    var hand_box_dist = Math.abs(hand_x - boxv4_x) + Math.abs(hand_y - boxv4_y)
    // var mus_dist = Math.abs(mus1_ll - mus1_l) + Math.abs(mus2_ll - mus2_l)
    return 1.0 / (Math.max(0.0, hand_box_dist-18) + 1.0)
  }

  return C
}

// function Cbar() {
//   var C = {}

//   C.checks = function(world_objs) {
//     var hand_x = world_objs.arm_hand.position.x
//     var hand_y = world_objs.arm_hand.position.y
//     var boxv4_x = world_objs.boxv4.position.x
//     var boxv4_y = world_objs.boxv4.position.y

//     var mus1_ll = world_objs.arm_mus1.length
//     var mus2_ll = world_objs.arm_mus2.length

//     var hand_box_dist = Math.abs(hand_x - boxv4_x) + Math.abs(hand_y - boxv4_y)
//     var mus_dist = Math.abs(mus1_ll - mus1_l) + Math.abs(mus2_ll - mus2_l)

//     return hand_box_dist + mus_dist  < 20
//   }

//   return C
// }
